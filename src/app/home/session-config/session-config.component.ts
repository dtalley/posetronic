import { SessionRoundType } from './../../core/services/sessions/sessions.service';
import { SessionsService } from '../../core/services/sessions/sessions.service';
import { ListItemComponent } from './../../shared/components/list-item/list-item.component';
import { Component, OnInit, QueryList, ViewChildren, AfterViewInit, ViewChild, AfterViewChecked } from '@angular/core';
import { Output, EventEmitter } from '@angular/core';

const { ipcRenderer } = require('electron')

@Component({
  selector: 'app-session-config',
  templateUrl: './session-config.component.html',
  styleUrls: ['./session-config.component.scss']
})
export class SessionConfigComponent implements OnInit, AfterViewChecked {
  @Output() roundSelected = new EventEmitter
  selectedRound: ListItemComponent
  sessionData: any = {}
  selectedFolder = ""
  lastSelected = false
  firstSelected = false
  editable = false

  @ViewChild('name') nameBox;

  @ViewChildren(ListItemComponent) private listItems: QueryList<ListItemComponent>;

  roundDuration = ""

  editingName = false

  constructor(
    private sessionsService: SessionsService
  ) { }

  ngOnInit(): void {
    
  }

  ngAfterViewChecked(): void {
    window.setTimeout(()=>{
      this.calculateDuration()
    })
  }

  onRoundSelected(ev: any) {
    if(!this.selectedRound || this.selectedRound != ev.listItem) {
      if(this.selectedRound) {
        this.selectedRound.deselect()
      }
      this.selectedRound = ev.listItem

      this.roundSelected.emit({
        round: ev.payload,
        index: this.getSelectedRoundIndex()
      })

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

  async onChooseFolder(ev: any) {
    let dialogResult = await ipcRenderer.invoke("open-folder-dialog")
    this.folderSelected(dialogResult)

    ev.preventDefault()
    return false
  }

  folderSelected(result: any) {
    this.selectedFolder = result.filePaths[0]
    this.sessionsService.setLastFolder(this.selectedFolder)
  }

  onStartSession(ev: any) {
    this.sessionsService.setActiveSessionFolder(this.selectedFolder)
  }

  loadSession(payload: any) {
    this.sessionData = payload || {}
    this.selectedFolder = this.sessionsService.getLastFolder()
    this.calculateDuration()    
    this.editable = payload ? payload.editable : false
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

    let roundIndex = this.getSelectedRoundIndex()
    if(roundIndex >= 0) {
      this.sessionsService.deleteRound(this.sessionData.id, roundIndex)
      if(this.selectedRound) {
        this.selectedRound.deselect()
        this.selectedRound = null
        this.roundSelected.emit(null)
        this.calculateDuration()
      }
    }
  }

  getSelectedRoundIndex() {
    let index = 0
    let foundIndex = -1
    this.listItems.forEach((item) => {
      if(item == this.selectedRound) {
        foundIndex = index
      }
      index++
    })
    return foundIndex
  }

  onMoveRoundUp() {
    let roundIndex = this.getSelectedRoundIndex()
    if(roundIndex >= 0) {
      this.reorderRound(roundIndex, -1)
    }
  }

  onMoveRoundDown() {
    let roundIndex = this.getSelectedRoundIndex()
    if(roundIndex >= 0) {
      this.reorderRound(roundIndex, 1)
    }
  }

  reorderRound(index, direction) {
    this.sessionsService.reorderRound(this.sessionData.id, index, direction)
    window.setTimeout(()=>{
      let selectedIndex = index + direction
      this.selectedRound.deselect()
      this.selectedRound = null
      this.onRoundSelected({
        listItem: this.listItems.toArray()[selectedIndex],
        payload: this.listItems.toArray()[selectedIndex].payload
      })
    })
  }

  onEditName() {
    if(this.editingName) {
      return;
    }
    this.editingName = true
    window.setTimeout(()=>{
      let selection = window.getSelection()
      let range = document.createRange()
      range.selectNodeContents(this.nameBox.nativeElement)
      selection.removeAllRanges()
      selection.addRange(range)
    })
  }

  onNameEdited(newName) {
    this.sessionsService.setSessionName(this.sessionData.id, newName)
    this.editingName = false
    window.getSelection().removeAllRanges()
  }

  calculateRoundHours(round) {
    return Math.floor(round.duration / (60*60))
  }

  calculateRoundMinutes(round) {
    let hours = this.calculateRoundHours(round)
    return Math.floor((round.duration - (hours*(60*60))) / 60)
  }

  calculateRoundSeconds(round) {
    let hours = this.calculateRoundHours(round)
    let minutes = this.calculateRoundMinutes(round)
    return round.duration - ((hours * (60*60)) + (minutes * 60))
  }

  setRoundType(type) {
    this.sessionsService.setRoundType(this.sessionData.id, this.getSelectedRoundIndex(), type)
  }

  addCount(count) {
    this.sessionsService.addRoundCount(this.sessionData.id, this.getSelectedRoundIndex(), count)
  }

  addTime(time) {
    this.sessionsService.addRoundTime(this.sessionData.id, this.getSelectedRoundIndex(), time)
  }

  deselectRound() {
    
  }

  reselectRound() {

  }
}
