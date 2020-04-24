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
  private sub: any

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
    
    this.sub = this.route.params.subscribe(params => {
      this.sessionData = this.sessionsService.getSession(params['sessionId'])
    })
  }

}
