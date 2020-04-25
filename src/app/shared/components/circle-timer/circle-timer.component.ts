import { Component, OnInit, OnDestroy } from '@angular/core';
import { Output, EventEmitter} from '@angular/core';

@Component({
  selector: 'circle-timer',
  templateUrl: './circle-timer.component.html',
  styleUrls: ['./circle-timer.component.scss']
})
export class CircleTimerComponent implements OnInit, OnDestroy {
  leftPercent = 0
  rightPercent = 0

  timeMax = 0
  timeLeft = 0

  timerHandle: number

  countdown = 0
  countdownTime = 0

  lastTime: number = 0

  paddingClass = ""

  mute = 2

  audioFinished = new Audio("assets/audio/finished.mp3")
  audioStart = new Audio("assets/audio/start.mp3")
  audioCountdown = new Audio("assets/audio/countdown.mp3")

  @Output() timerFinished = new EventEmitter
  @Output() timerStarted = new EventEmitter
  @Output() countdownStarted = new EventEmitter

  constructor() { }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    if(this.timerHandle) {
      window.clearInterval(this.timerHandle)
    }
  }

  setDuration(duration): void {
    this.timeMax = duration
    this.timeLeft = duration
    this.leftPercent = 0
    this.rightPercent = 0
  }

  start(delay: number): void {
    if(this.timerHandle) {
      window.clearInterval(this.timerHandle)
    }
    
    this.countdownTime = delay
    this.countdown = Math.ceil(delay/1000)
    this.startInternal()

    if(this.paddingClass == "fadeOut") {
      this.paddingClass = "fadeIn"
    }

    if(this.countdownTime <= 0) {
      this.timerStarted.emit()
      this.audioStart.play()
    }
  }

  private startInternal(): void {
    window.clearInterval(this.timerHandle)
    this.lastTime = performance.now()
    this.timerHandle = window.setInterval(this.onTick.bind(this), 16)
  }

  onTick(): void {
    let now = performance.now()
    let delta = now - this.lastTime
    this.lastTime = now

    if(this.countdownTime > 0) {
      this.countdownTime -= delta
      this.countdown = Math.ceil(this.countdownTime/1000)

      if(this.countdown == 0) {
        this.timerStarted.emit()
        this.audioStart.play()
      }
      return;
    }

    let oldTime = this.timeLeft
    this.timeLeft -= delta

    if(oldTime < 6000 && 
      Math.floor(oldTime/1000) > Math.floor((oldTime-delta)/1000) &&
      Math.floor(oldTime/1000) > 0) {
      this.audioCountdown.currentTime = 0
      this.audioCountdown.play()
      if(oldTime > 5000) {
        this.countdownStarted.emit()
      }
    }

    if(this.timeLeft <= 0) {
      this.timeLeft = 0;
      window.clearInterval(this.timerHandle)
      this.timerHandle = null
      this.timerFinished.emit()

      this.paddingClass = "fadeOut"

      this.audioFinished.play()
    }

    let percent = this.timeLeft / this.timeMax;
    if(percent >= .5) {
      this.rightPercent = 0
      this.leftPercent = (1-percent)/.5;
    } else {
      this.leftPercent = 1
      this.rightPercent = (.5-percent)/.5;
    }
  }

  setMute(newMute: number) {
    this.mute = newMute

    let volume = 1
    if(this.mute == 1) {
      volume = .4
    } else if(this.mute == 0) {
      volume = 0
    }
    this.audioStart.volume = volume
    this.audioFinished.volume = volume
    this.audioCountdown.volume = volume
  }

  pause() {
    window.clearInterval(this.timerHandle)
  }

  resume() {
    this.startInternal()
  }
}
