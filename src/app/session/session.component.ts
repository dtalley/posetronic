import { Component, OnInit } from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router'
import { SessionsService } from '../core/services/sessions/sessions.service'

import * as fs from "fs";
import * as path from "path";

@Component({
  templateUrl: './session.component.html',
  styleUrls: ['./session.component.css']
})
export class SessionComponent implements OnInit {
  sessionFolder: string
  sessionFiles: Array<string> = []
  activeSession: any
  sessionData: any = {}
  currentFile: string
  private sub: any
  private roundList: Array<any> = []
  intervalHandle: number

  constructor(
    private sessionsService: SessionsService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.sessionFolder = this.sessionsService.getActiveSessionFolder()
    if(!this.sessionFolder) {
      this.router.navigate(['/home'])
      return;
    }

    let supportedExtensions = [
      ".jpg",
      ".png",
      ".jpeg"
    ]
    
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
          } else if(supportedExtensions.includes(path.extname(fullFile))) {
            fileList.push(fullFile)
          }
        })
      }

      iterateDirectory(this.sessionFolder)

      this.sessionFiles = fileList

      this.showNextRound()
    })
  }

  showNextRound() {
    if(this.intervalHandle) {
      window.clearInterval(this.intervalHandle)
    }

    if(this.roundList.length == 0 || this.sessionFiles.length == 0) {
      this.router.navigate(['/home'])
      return;
    }

    let round = this.roundList.shift()
    let fileIndex = Math.floor(Math.random()*this.sessionFiles.length)
    this.currentFile = this.sessionFiles[fileIndex]
    this.sessionFiles.splice(fileIndex, 1)
    this.intervalHandle = window.setTimeout(() => {
      this.intervalHandle = window.setTimeout(this.showNextRound.bind(this), round.duration)
    }, 1000)
  }
}
