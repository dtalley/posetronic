import { AppConfig } from './../../environments/environment';
import { CircleTimerComponent } from './../shared/components/circle-timer/circle-timer.component';
import { Component, ViewChild, AfterViewInit, HostListener, OnDestroy, ElementRef } from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router'
import { SessionsService, SessionRoundType } from '../core/services/sessions/sessions.service'

import * as fs from "fs";
import * as path from "path";
import * as explorer from 'open-file-explorer';
import {screen} from "electron";
import { URLSearchParams } from 'url';

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
  unsplashQuery: string
  defaultSessionFolder: string
  sessionFiles: Array<any> = []
  roundImages: Array<string> = []
  activeSession: any
  sessionData: any = {}
  currentFile: any = {}
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
    if(this.currentRound.type == SessionRoundType.Technical) {
      worker.postMessage({
        type: "resize",
        width: window.innerWidth,
        height: window.innerHeight
      })
    }
  }

  createDrawingCanvas(): void {
    if(this.canvas) {
      this.canvasHolder.nativeElement.removeChild(this.canvas)
    }

    this.canvas = document.createElement("canvas") 
    this.canvas.style.width = "100%"
    this.canvas.style.height = "100%"
    this.canvas.addEventListener("pointerdown", this.onPointerDown)
    this.canvas.addEventListener("pointermove", this.onPointerMove)
    this.canvas.addEventListener("pointercancel", this.onPointerCancel)
    this.canvas.width = window.innerWidth * window.devicePixelRatio
    this.canvas.height = window.innerHeight * window.devicePixelRatio

    this.canvasHolder.nativeElement.appendChild(this.canvas)

    this.offscreenCanvas = this.canvas.transferControlToOffscreen()
    worker.postMessage({ type:"canvas", canvas: this.offscreenCanvas, scale: window.devicePixelRatio }, [this.offscreenCanvas])
  }

  ngAfterViewInit(): void {   
    worker.onmessage = ({ data }) => {
      if(data.type == "resized") {
        this.canvasHolder.nativeElement.removeChild(this.canvas)
        this.canvas = document.createElement("canvas")
        this.canvas.style.width = "100%"
        this.canvas.style.height = "100%"
        this.canvas.addEventListener("pointerdown", this.onPointerDown)
        this.canvas.addEventListener("pointermove", this.onPointerMove)
        this.canvas.addEventListener("pointercancel", this.onPointerCancel)
        this.canvas.width = data.width * window.devicePixelRatio
        this.canvas.height = data.height * window.devicePixelRatio
        this.canvasHolder.nativeElement.appendChild(this.canvas)
        this.offscreenCanvas = this.canvas.transferControlToOffscreen()
        worker.postMessage({ type:"canvas", canvas: this.offscreenCanvas, existingImage: data.bitmap, scale: window.devicePixelRatio }, [this.offscreenCanvas, data.bitmap])
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
            query: round.unsplashQuery,
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
        this.sessionFiles.push({
          url: "file://" + fullFile.replace(/\\/g, "\\\\").replace(/ /g, "%20").replace(/\(/g, "%28").replace(/\)/g, "%29"),
          name: fullFile
        })
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

  async showNextRound() {
    this.currentIndex++
    
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

    console.log(round)

    if(round.type != SessionRoundType.Technical) {
      if(round.query) {
        let oldUnsplashQuery = this.unsplashQuery
        this.unsplashQuery = round.query
        this.sessionFolder = ""
        if(oldUnsplashQuery != this.unsplashQuery) {
          const res = await fetch('https://or2ux34au1.execute-api.us-west-2.amazonaws.com/default/PosetronicUnsplashSearch?' + new URLSearchParams({
            query: round.query,
            per_page: "100",
            total: "100"
          }));
          if (res.ok) {
            const data = await res.json();
            console.log(data.length, " images found from Unsplash");
            this.sessionFiles = []
            for(let result of data) {
              this.sessionFiles.push({
                url: result.url,
                name: result.url,
                link: result.link,
                author: result.author
              })
            }
          } else {
            console.log("Unsplash query failed, returning home...")
            this.router.navigate(['/home'])
            return;
          }
          this.shuffleFiles();
        }
      } else {
        let oldSessionFolder = this.sessionFolder;
        this.sessionFolder = round.folder
        this.unsplashQuery = ""
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
    } else {
      this.createDrawingCanvas()
    }
    
    if(round.type == SessionRoundType.Sketch) {
      if(this.currentIndex < this.roundImages.length && this.roundImages[this.currentIndex]) {
        this.currentFile = this.roundImages[this.currentIndex]
      } else {
        this.imageIndex++

        if(this.imageIndex >= this.sessionFiles.length) {
          console.log("Exhausted all images for sketching session, returning home...")
          this.router.navigate(['/home'])
          return;
        }

        this.currentFile = this.sessionFiles[this.imageIndex]
        if(this.currentIndex >= this.roundImages.length) {
          this.roundImages.push(this.currentFile)
        } else {
          this.roundImages[this.currentIndex] = this.currentFile
        }
      }

      console.log(this.currentFile)

      let protocol = "file://"
      if(round.query) {
        protocol = ""
      }
      this.encodedFile = this.currentFile.url
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

  getFileAttribution() {
    if(!this.currentFile) {
      return "Loading..."
    } else if(this.currentRound.type == SessionRoundType.Rest) {
      return "Rest your brain for a bit..."
    } else if(this.currentRound.query) {
      if(!this.currentFile.author) {
        return "Loading..."
      } else {
        return "via <a href=\"" + this.currentFile.link + "\">Unsplash</a> by <a href=\"" + this.currentFile.author.link + "\">" + this.currentFile.author.name + "</a>"
      }
    } else {
      return this.currentFile.url
    }
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
      this.roundImages[this.currentIndex] = null
      this.currentIndex -= 1
      this.showNextRound()
    }
  }

  onNextImage() {
    if(this.imageIndex < this.sessionFiles.length-1) {
      this.roundImages[this.currentIndex] = null
      this.currentIndex -= 1
      this.showNextRound()
    }
  }

  onPreviousRound() {
    if(this.currentIndex > 0) {
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
    if(!this.currentRound.query) {
      explorer(path.dirname(this.currentFile.url.replace("file://", "")), err => {
        if(err) {
          console.log(err)
        }
      })
    } else {
      window.open(this.currentFile.link)
    }
  }

  onDeleteImage() {
    if(!this.currentRound.query) {
      let unpause = false
      if(!this.paused) {
        this.onTogglePause()
        unpause = true
      }
      let confirm = window.confirm("Are you sure you want to delete this file?")
      if(confirm) {
        fs.unlinkSync(this.currentFile.url.replace("file://", ""))
        this.sessionFiles.splice(this.imageIndex, 1)
        this.imageIndex -= 1
        this.currentIndex -= 1
        this.showNextRound()
      }  else if(unpause) {
        this.onTogglePause()
      }
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

  onPointerCancel(e) {
    console.log("Pointer events canceled...")
  }

  onExit() {
    this.router.navigate(['/home'])
  }
}