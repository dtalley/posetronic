import { SessionRoundType } from './../../core/services/sessions/sessions.service';
import { SessionsService } from '../../core/services/sessions/sessions.service';
import { ListItemComponent } from './../../shared/components/list-item/list-item.component';
import { Component, OnInit, QueryList, ViewChildren } from '@angular/core';
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
  lastSelected = false
  firstSelected = false

  @ViewChildren(ListItemComponent) private listItems: QueryList<ListItemComponent>;

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
        this.firstSelected = this.lastSelected = false;
        if(this.listItems.first == this.selectedRound) {
          this.firstSelected = true
        }
        if(this.listItems.last == this.selectedRound) {
          this.lastSelected = true
        }
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
    this.calculateDuration()    
  }

  calculateDuration() {
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

  onAddRound() {
    this.sessionsService.addRound(this.sessionData.id)
    window.setTimeout(()=>{
      this.onRoundSelected({
        listItem: this.listItems.last,
        payload: this.listItems.last.payload
      })
      this.calculateDuration()
    })
  }

  onDeleteRound() {
    let confirm = window.confirm("Are you sure you want to delete this round?")
    if(!confirm) {
      return;
    }

    let index = 0
    let foundIndex = -1
    this.listItems.forEach((item) => {
      if(item == this.selectedRound) {
        foundIndex = index
      }
      index++
    })
    if(foundIndex >= 0) {
      this.sessionsService.deleteRound(this.sessionData.id, foundIndex)
      if(this.selectedRound) {
        this.selectedRound.deselect()
        this.selectedRound = null
        this.roundSelected.emit(null)
        this.calculateDuration()
      }
    }
  }

  onMoveRoundUp() {

  }

  onMoveRoundDown() {
    
  }
}
