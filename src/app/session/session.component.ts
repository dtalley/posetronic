import { CircleTimerComponent } from './../shared/components/circle-timer/circle-timer.component';
import { Component, ViewChild, AfterViewInit } from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router'
import { SessionsService } from '../core/services/sessions/sessions.service'

import * as fs from "fs";
import * as path from "path";

@Component({
  selector: 'app-session',
  templateUrl: './session.component.html',
  styleUrls: ['./session.component.scss']
})
export class SessionComponent implements AfterViewInit {
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
  currentIndex = 0
  imageClass = ""

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
        for(let i = 0; i < round.count; i++) {
          this.roundList.push({
            duration: round.duration*1000,
            type: round.type
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

      this.currentIndex = 0
      
      this.showNextRound()
    })
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
    if(this.intervalHandle) {
      window.clearInterval(this.intervalHandle)
    }

    if(this.currentIndex >= this.roundList.length || 
      this.currentIndex >= this.sessionFiles.length) {
      this.router.navigate(['/home'])
      return;
    }

    let round = this.roundList[this.currentIndex]
    this.currentFile = this.sessionFiles[this.currentIndex]
    this.encodedFile = this.currentFile.replace(/\\/g, "\\\\").replace(/ /g, "%20")
    
    this.circleTimer.setDuration(round.duration)
    this.circleTimer.start(5000)
    this.currentIndex++
    this.imageClass = "fadeIn"
  }

  onTimerFinished() {
    this.imageClass = "fadeOut"
    this.intervalHandle = window.setTimeout(()=>{
      this.showNextRound()
    }, 2000)
  }
}
