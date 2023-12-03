import { AppConfig } from './../../environments/environment';
import { CircleTimerComponent } from './../shared/components/circle-timer/circle-timer.component';
import { Component, ViewChild, AfterViewInit, HostListener, OnDestroy, ElementRef } from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router'
import { SessionsService, SessionRoundType } from '../core/services/sessions/sessions.service'

import * as fs from "fs";
import * as path from "path";
import * as explorer from 'open-file-explorer';

let worker = null
if (typeof Worker !== 'undefined') {
  // Create a new
  worker = new Worker(new URL('./session.worker.ts', import.meta.url), {type: "module"});
} else {
  // Web Workers are not supported in this environment.
  // You should add a fallback so that your program still executes correctly.
}

@Component({
  selector: 'app-session',
  templateUrl: './session.component.html',
  styleUrls: ['./session.component.scss']
})
export class SessionComponent implements AfterViewInit, OnDestroy {
  @ViewChild(CircleTimerComponent) circleTimer: CircleTimerComponent

  @ViewChild('canvasHolder', {static: true, read: ElementRef<HTMLElement>}) canvasHolder: ElementRef<HTMLElement>
  offscreenCanvas: OffscreenCanvas = null
  
  trial = AppConfig.trial

  sessionFolder: string
  defaultSessionFolder: string
  sessionFiles: Array<string> = []
  roundImages: Array<string> = []
  activeSession: any
  sessionData: any = {}
  currentFile: string
  encodedFile: string
  private sub: any
  private roundList: Array<any> = []
  intervalHandle: number
  countdown: number = 0
  currentIndex = -1
  imageIndex = -1
  imageClass = "nopacity"
  interfaceClass = "nopacity"
  timerClass = "nopacity"
  betweenRounds = true
  mouseOver = false
  currentRound: any = {}
  canvas: HTMLCanvasElement
  
  showTimer = false
  fullscreen = false
  mute = 2

  grayscale = false
  mirror = false
  mirrorY = false

  restQuote = ""
  restAuthor = ""

  private restQuotes = [
    {
      quote: "Learning to draw is really a matter of learning to see - to see correctly - and that means a good deal more than merely looking with the eye.",
      author: "Kimon Nicolaides"
    },
    {
      quote: "Drawing is rather like playing chess: your mind races ahead of the moves that you eventually make.",
      author: "David Hockney"
    },
    {
      quote: "Drawing is the basis of art. A bad painter cannot draw. But one who draws well can always paint.",
      author: "Arshile Gorky"
    },
    {
      quote: "In drawing, one must look for or suspect that there is more than is casually seen.",
      author: "George Bridgman"
    }
  ]

  paused = false

  private supportedExtensions = [
    ".jpg",
    ".png",
    ".jpeg"
  ]

  constructor(
    private sessionsService: SessionsService,
    private route: ActivatedRoute,
    private router: Router
  ) { }
    
  @HostListener('window:resize', ['$event'])
  onResize(event) {
    worker.postMessage({
      type: "resize",
      width: window.innerWidth,
      height: window.innerHeight
    })
  }

  ngAfterViewInit(): void {   
    this.canvas = document.createElement("canvas") 
    this.canvas.addEventListener("pointerdown", this.onPointerDown)
    this.canvas.addEventListener("pointermove", this.onPointerMove)
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight

    this.canvasHolder.nativeElement.appendChild(this.canvas)

    this.offscreenCanvas = this.canvas.transferControlToOffscreen()
    worker.postMessage({ type:"canvas", canvas: this.offscreenCanvas }, [this.offscreenCanvas])
    worker.onmessage = ({ data }) => {
      if(data.type == "resized") {
        this.canvasHolder.nativeElement.removeChild(this.canvas)
        this.canvas = document.createElement("canvas")
        this.canvas.addEventListener("pointerdown", this.onPointerDown)
        this.canvas.addEventListener("pointermove", this.onPointerMove)
        this.canvas.width = data.width
        this.canvas.height = data.height
        this.canvasHolder.nativeElement.appendChild(this.canvas)
        this.offscreenCanvas = this.canvas.transferControlToOffscreen()
        worker.postMessage({ type:"canvas", canvas: this.offscreenCanvas, existingImage: data.bitmap }, [this.offscreenCanvas, data.bitmap])
      }
    };

    this.defaultSessionFolder = this.sessionsService.getActiveSessionFolder()
    this.sessionFolder = this.defaultSessionFolder
    
    this.sub = this.route.params.subscribe(params => {
      this.sessionData = this.sessionsService.getSession(params['sessionId'])
      this.roundList = []
      this.sessionFiles = []
      
      this.sessionData.rounds.forEach((round) => {
        let minutes = Math.floor(round.duration/60)
        let seconds = round.duration - (minutes*60)
        if(minutes < 2) {
          seconds += minutes * 60;
          minutes = 0;
        }
        let duration = round.duration*1000
        let rest = round.type == SessionRoundType.Rest
        for(let i = 0; i < round.count; i++) {
          this.roundList.push({
            duration: duration<10000?10000:duration,
            rest: rest,
            minutes: minutes,
            seconds: duration<10000?10:seconds,
            folder: round.selectedFolder,
            type: round.type,
            exercise: round.exercise
          })
        }
      })
      
      let fileList = []

      if(this.sessionFolder) {
        this.iterateDirectory(this.sessionFolder)
      }

      this.currentIndex = -1
      this.imageIndex = -1

      this.betweenRounds = true
      
      this.intervalHandle = window.setTimeout(() => {
        this.showNextRound()
      }, 2000)
    })
  }

  iterateDirectory(directory) {
    this.sessionFiles = []
    let files = fs.readdirSync(directory)
    files.forEach(file => {
      let fullFile = path.join(directory, file)
      let stats = fs.statSync(fullFile);
      if(stats.isDirectory()) {
        this.iterateDirectory(fullFile)
      } else if(this.supportedExtensions.includes(path.extname(fullFile))) {
        this.sessionFiles.push(fullFile)
      }
    })
    this.shuffleFiles()
  }

  ngOnDestroy() {
    if(this.intervalHandle) {
      window.clearTimeout(this.intervalHandle)
      this.intervalHandle = null
    }
  }

  @HostListener("mouseover") onMouseOver() {
    this.mouseOver = true;
  }

  @HostListener("mouseout") onMouseOut() {
    this.mouseOver = false;
  }

  shuffleFiles() {
    let j, i = 0
    var x: string

    for (i = this.sessionFiles.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      x = this.sessionFiles[i];
      this.sessionFiles[i] = this.sessionFiles[j];
      this.sessionFiles[j] = x
    }
  }

  showNextRound() {
    this.currentIndex++

    worker.postMessage({type:"clear"})
    
    if(this.intervalHandle) {
      window.clearTimeout(this.intervalHandle)
    }

    if(this.currentIndex >= this.roundList.length) {
      console.log("Completed all rounds, returning home...")
      this.router.navigate(['/home'])
      return;
    }

    let round = this.roundList[this.currentIndex]
    this.currentRound = round
    this.betweenRounds = true
    this.circleTimer.setDuration(round.duration)
    this.circleTimer.start(round.rest?0:5000)
    if(this.paused) {
      this.onTogglePause()
    }

    if(round.type != 2) {
      let oldSessionFolder = this.sessionFolder;
      this.sessionFolder = round.folder
      if(!this.sessionFolder) {
        this.sessionFolder = this.defaultSessionFolder
      }
      if(!this.sessionFolder) {
        console.log("No folder detected for sketching round, returning home...")
        this.router.navigate(['/home'])
        return;
      }
      if(oldSessionFolder != this.sessionFolder) {
        this.iterateDirectory(this.sessionFolder)
        this.imageIndex = -1
      }
    }

    if(round.type == 1) {
      if(this.currentIndex < this.roundImages.length) {
        this.currentFile = this.roundImages[this.currentIndex]
      } else {
        this.imageIndex++

        if(this.imageIndex >= this.sessionFiles.length) {
          console.log("Exhausted all images for sketching session, returning home...")
          this.router.navigate(['/home'])
          return;
        }

        this.currentFile = this.sessionFiles[this.imageIndex]
        this.roundImages.push(this.currentFile)
      }

      this.encodedFile = this.currentFile.replace(/\\/g, "\\\\").replace(/ /g, "%20").replace(/\(/g, "%28").replace(/\)/g, "%29")
    } else {
      let quoteIndex = Math.round(Math.random()*(this.restQuotes.length-1))
      this.restQuote = this.restQuotes[quoteIndex].quote
      this.restAuthor = this.restQuotes[quoteIndex].author
    }

    this.imageClass = "fadeIn"

    if(this.interfaceClass == "fadeOut" || this.interfaceClass == "nopacity") {
      this.interfaceClass = "fadeIn"
    }
    this.timerClass = "fadeIn"
  }

  onTimerFinished() {
    if(this.intervalHandle) {
      window.clearTimeout(this.intervalHandle)
    }

    this.imageClass = "fadeOut"
    this.intervalHandle = window.setTimeout(()=>{
      this.showNextRound()
    }, 2000)
  }

  onTimerStarted() {
    if(this.intervalHandle) {
      window.clearTimeout(this.intervalHandle)
    }

    this.intervalHandle = window.setTimeout(()=>{
      this.timerClass = "fadeOut"
      this.interfaceClass = "fadeOut"
    },1000)

    this.betweenRounds = false;
  }

  onCountdownStarted() {
    this.timerClass = "fadeIn"
  }

  onToggleTimer() {
    this.showTimer = !this.showTimer;
  }

  onToggleFullscreen() {
    this.fullscreen = !this.fullscreen;
    if(this.fullscreen) {
      document.documentElement.requestFullscreen()
      document.onfullscreenchange = ()=>{
        if(document.fullscreen) {
          this.fullscreen = true
        } else {
          this.fullscreen = false
        }
      }
    } else {
      document.exitFullscreen()
      this.mouseOver = false
    }
  }

  onToggleMute() {
    this.mute -= 1
    if(this.mute < 0) {
      this.mute = 2
    }
    this.circleTimer.setMute(this.mute);
  }

  onToggleGrayscale() {
    this.grayscale = !this.grayscale
  }

  onToggleMirror() {
    this.mirror = !this.mirror
  }

  onToggleMirrorY() {
    this.mirrorY = !this.mirrorY;
  }

  onPreviousImage() {
    if(this.imageIndex > 0) {
      this.imageIndex -= 2
      this.currentIndex -= 1
      this.showNextRound()
    }
  }

  onNextImage() {
    if(this.imageIndex < this.sessionFiles.length-1) {
      this.currentIndex -= 1
      this.showNextRound()
    }
  }

  onPreviousRound() {
    if(this.currentIndex > 0) {
      if(!this.roundList[this.currentIndex].rest && !this.roundList[this.currentIndex-1].rest) {
        this.imageIndex -= 2
      } else {
        this.imageIndex -= 1
      }
      this.currentIndex -= 2
      this.showNextRound()
    }
  }

  onNextRound() {
    if(this.currentIndex < this.roundList.length-1) {
      this.showNextRound()
    }
  }

  onTogglePause() {
    this.paused = !this.paused;

    if(this.paused) {
      this.circleTimer.pause()
    } else {
      this.circleTimer.resume()
    }
  }

  onRestartRound() {
    this.currentIndex -= 1
    this.imageIndex -= 1
    this.showNextRound()
  }

  onOpenImage() {
    explorer(path.dirname(this.currentFile), err => {
      if(err) {
        console.log(err)
      }
    })
  }

  onDeleteImage() {
    let unpause = false
    if(!this.paused) {
      this.onTogglePause()
      unpause = true
    }
    let confirm = window.confirm("Are you sure you want to delete this file?")
    if(confirm) {
      fs.unlinkSync(this.currentFile)
      this.sessionFiles.splice(this.imageIndex, 1)
      this.imageIndex -= 1
      this.currentIndex -= 1
      this.showNextRound()
    }  else if(unpause) {
      this.onTogglePause()
    }
  }

  onPointerDown(e) {
    e.target.setPointerCapture(e.pointerId)
    worker.postMessage({
      type: "point",
      x: e.pageX,
      y: e.pageY,
      pressure: e.pressure,
      start: true
    })
  }

  onPointerMove(e) {
    if (e.buttons !== 1) return;

    worker.postMessage({
      type: "point",
      x: e.pageX,
      y: e.pageY,
      pressure: e.pressure,
      start: false
    })
  }

  onExit() {
    this.router.navigate(['/home'])
  }
}