import { ListItemComponent } from './../../shared/components/list-item/list-item.component';
import { Component, OnInit } from '@angular/core';
import { Output, Input, EventEmitter } from '@angular/core';
import { SessionsService } from '../../core/services/sessions/sessions.service'

@Component({
  selector: 'app-session-list',
  templateUrl: './session-list.component.html',
  styleUrls: ['./session-list.component.scss']
})
export class SessionListComponent implements OnInit {
  sessions;

  @Output() sessionSelected = new EventEmitter()

  selectedSession: ListItemComponent

  constructor(
    private sessionsService: SessionsService
  ) { }

  onSessionSelected(ev: any): void {
    if(!this.selectedSession || this.selectedSession != ev.listItem) {
      if(this.selectedSession) {
        this.selectedSession.deselect()
      }
      this.sessionSelected.emit(ev.payload)
      this.selectedSession = ev.listItem
      if(this.selectedSession) {
        this.selectedSession.select()
      }
    }
  }

  ngOnInit(): void {
    this.sessions = this.sessionsService.getSessions();
  }

}
