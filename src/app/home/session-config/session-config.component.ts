import { SessionRoundType } from './../../core/services/sessions/sessions.service';
import { SessionsService } from '../../core/services/sessions/sessions.service';
import { ListItemComponent } from './../../shared/components/list-item/list-item.component';
import { Component, OnInit } from '@angular/core';
import { Output, EventEmitter } from '@angular/core';

const { dialog } = require('electron').remote

@Component({
  selector: 'app-session-config',
  templateUrl: './session-config.component.html',
  styleUrls: ['./session-config.component.scss']
})
export class SessionConfigComponent implements OnInit {
  @Output() roundSelected = new EventEmitter
  selectedRound: ListItemComponent
  sessionData: any = {}
  selectedFolder = ""

  roundDuration = ""

  constructor(
    private sessionsService: SessionsService
  ) { }

  onRoundSelected(ev: any) {
    if(!this.selectedRound || this.selectedRound != ev.listItem) {
      if(this.selectedRound) {
        this.selectedRound.deselect()
      }
      this.roundSelected.emit(ev.payload)
      this.selectedRound = ev.listItem
      if(this.selectedRound) {
        this.selectedRound.select()
      }
    }
  }

  onChooseFolder(ev: any) {
    let dialogResult = dialog.showOpenDialog({
      properties: ['openDirectory']
    })

    dialogResult.then(this.folderSelected.bind(this))

    ev.preventDefault()
    return false
  }

  folderSelected(result: any) {
    this.selectedFolder = result.filePaths[0]
  }

  onStartSession(ev: any) {
    this.sessionsService.setActiveSessionFolder(this.selectedFolder)
  }

  loadSession(payload: any) {
    this.sessionData = payload || {}

    if(this.sessionData.rounds) {
      let duration = 0
      this.sessionData.rounds.forEach(round => {
        duration += round.duration * round.count;
      })
      this.roundDuration = this.sessionsService.formatDuration(duration)
    }
  }

  ngOnInit(): void {
  }

  isRoundSketch(round) {
    return round.type == SessionRoundType.Sketch;
  }

  isRoundRest(round) {
    return round.type == SessionRoundType.Rest;
  }

  calculateRoundLength(round) {
    return this.sessionsService.formatDuration(round.duration*round.count);
  }
}
