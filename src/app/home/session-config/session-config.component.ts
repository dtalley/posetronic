import { SessionRoundType } from './../../core/services/sessions/sessions.service';
import { SessionsService } from '../../core/services/sessions/sessions.service';
import { ListItemComponent } from './../../shared/components/list-item/list-item.component';
import { Component, OnInit, QueryList, ViewChildren, AfterViewInit, ViewChild, AfterViewChecked } from '@angular/core';
import { Output, EventEmitter } from '@angular/core';

import { ipcRenderer } from 'electron';

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
  @ViewChild('unpublish') unpublishBox;

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
    if(this.selectedFolder) {
      this.selectedFolder = null
      this.sessionsService.setLastFolder(this.selectedFolder)
    } else {
      let dialogResult = await ipcRenderer.invoke("open-folder-dialog")
      this.folderSelected(dialogResult)
    }

    ev.preventDefault()
    return false
  }

  async onChooseRoundFolder(ev: any) {
    let round = this.sessionData.rounds[this.getSelectedRoundIndex()]
    if(round.selectedFolder) {
      this.sessionsService.setRoundFolder(this.sessionData.id, this.getSelectedRoundIndex(), null)
    } else {
      let dialogResult = await ipcRenderer.invoke("open-folder-dialog")
      if(dialogResult.filePaths && dialogResult.filePaths.length > 0) {
        this.sessionsService.setRoundFolder(this.sessionData.id, this.getSelectedRoundIndex(), dialogResult.filePaths[0])
      }
    }

    ev.preventDefault()
    return false
  }

  getRoundTitle(type) {
    if(type === 0) {
      return "Sketch"
    } else if(type === 1) {
      return "Rest"
    } else if(type === 2) {
      return "Technical"
    }
  }

  hasSelectedFolders() {
    if(this.selectedFolder) {
      return true;
    }

    for(let round of this.sessionData.rounds) {
      if(round.type == 0 && !round.selectedFolder && !round.unsplashQuery) {
        return false;
      }
    }

    return true;
  }

  folderSelected(result: any) {
    if(result.filePaths && result.filePaths.length > 0) {
      this.selectedFolder = result.filePaths[0]
      this.sessionsService.setLastFolder(this.selectedFolder)
    }
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
        if(round.type == 0 || round.type == 1) {
          duration += round.duration * round.count;
        }
      })
      if(duration > 0) {
        this.roundDuration = this.sessionsService.formatDuration(duration)
      } else {
        this.roundDuration = "---"
      }
    }
  }

  isRoundSketch(round) {
    return round.type == SessionRoundType.Sketch;
  }

  isRoundRest(round) {
    return round.type == SessionRoundType.Rest;
  }

  isRoundTechnical(round) {
    return round.type == SessionRoundType.Technical;
  }

  calculateRoundLength(round) {
    if(round.type == 2) {
      return ""
    } else {
      return this.sessionsService.formatDuration(round.duration*round.count);
    }
  }

  getRoundDuration(round) {
    if(round.type == 2) {
      return "Boxes"
    } else {
      return this.sessionsService.formatDuration(round.duration)
    }
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

  onEditUnsplash(event) {
    this.sessionsService.setRoundUnsplashEditing(this.sessionData.id, this.getSelectedRoundIndex(), true)
    window.setTimeout(()=>{
      let selection = window.getSelection()
      let range = document.createRange()
      range.selectNodeContents(event.target)
      selection.removeAllRanges()
      selection.addRange(range)
    })
    event.preventDefault()
  }

  onUnsplashEdited(event) {
    console.log("Unsplash edited")
    let newQuery = event.target.innerText
    this.sessionsService.setRoundUnsplashEditing(this.sessionData.id, this.getSelectedRoundIndex(), false)
    this.sessionsService.setRoundUnsplashQuery(this.sessionData.id, this.getSelectedRoundIndex(), newQuery)
    window.getSelection().removeAllRanges()
    event.preventDefault()
    event.target.innerText = newQuery
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
    let roundData = this.sessionData.rounds[this.getSelectedRoundIndex()]
    if(time < 0 && (roundData.duration + time) < 10) {
      time = 10 - roundData.duration
    }
    this.sessionsService.addRoundTime(this.sessionData.id, this.getSelectedRoundIndex(), time)
  }

  getRoundText(round) {
    if(round.type == 0) {
      if(round.selectedFolder) {
        return "Sketch: Custom";
      } else if(this.selectedFolder) {
        return "Sketch: Default";
      } else {
        return "Sketch"
      }
    } else if(round.type == 1) {
      return "Rest"
    } else if(round.type == 2) {
      return "Technical"
    }
  }

  deselectRound() {
    
  }

  reselectRound() {

  }
}
