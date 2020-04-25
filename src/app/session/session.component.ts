import { CircleTimerComponent } from './../shared/components/circle-timer/circle-timer.component';
import { Component, ViewChild, AfterViewInit, HostListener, OnDestroy } from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router'
import { SessionsService, SessionRoundType } from '../core/services/sessions/sessions.service'

import * as fs from "fs";
import * as path from "path";
import * as explorer from 'open-file-explorer';

@Component({
  selector: 'app-session',
  templateUrl: './session.component.html',
  styleUrls: ['./session.component.scss']
})
export class SessionComponent implements AfterViewInit, OnDestroy {
  @ViewChild(CircleTimerComponent) circleTimer: CircleTimerComponent

  sessionFolder: string
  sessionFiles: Array<string> = []
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
  currentRound: any

  showTimer = false
  fullscreen = false
  mute = 2

  grayscale = false
  mirror = false
  mirrorY = false

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

  ngAfterViewInit(): void {    
    this.sessionFolder = this.sessionsService.getActiveSessionFolder()
    if(!this.sessionFolder) {
      this.router.navigate(['/home'])
      return;
    }
    
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
            duration: duration,
            rest: rest,
            minutes: minutes,
            seconds: seconds
          })
        }
      })
      
      let fileList = []

      let iterateDirectory = (directory) => {      
        let files = fs.readdirSync(directory)
        files.forEach(file => {
          let fullFile = path.join(directory, file)
          let stats = fs.statSync(fullFile);
          if(stats.isDirectory()) {
            iterateDirectory(fullFile)
          } else if(this.supportedExtensions.includes(path.extname(fullFile))) {
            fileList.push(fullFile)
          }
        })
      }

      iterateDirectory(this.sessionFolder)

      this.sessionFiles = fileList
      this.shuffleFiles()

      this.currentIndex = -1
      this.imageIndex = -1

      this.betweenRounds = true
      
      this.intervalHandle = window.setTimeout(() => {
        this.showNextRound()
      }, 2000)
    })
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
    this.imageIndex++
    
    if(this.intervalHandle) {
      window.clearTimeout(this.intervalHandle)
    }

    if(this.currentIndex >= this.roundList.length || 
      this.imageIndex >= this.sessionFiles.length) {
      this.router.navigate(['/home'])
      return;
    }

    let round = this.roundList[this.currentIndex]
    this.currentRound = round
    this.currentFile = this.sessionFiles[this.imageIndex]
    this.encodedFile = this.currentFile.replace(/\\/g, "\\\\").replace(/ /g, "%20").replace(/\(/g, "%28").replace(/\)/g, "%29")
    
    this.circleTimer.setDuration(round.duration)
    this.circleTimer.start(5000)
    this.imageClass = "fadeIn"
    if(this.interfaceClass == "fadeOut" || this.interfaceClass == "nopacity") {
      this.interfaceClass = "fadeIn"
    }
    if(this.timerClass == "nopacity") {
      this.timerClass = "fadeIn"
    }
    this.betweenRounds = true

    if(this.paused) {
      this.onTogglePause()
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

    if(this.currentRound.type != SessionRoundType.Rest) {
      this.betweenRounds = false;
    }
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
      this.imageIndex -= 2
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

  onExit() {
    this.router.navigate(['/home'])
  }
}
