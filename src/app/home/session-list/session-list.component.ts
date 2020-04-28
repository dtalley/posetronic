import { ListItemComponent } from './../../shared/components/list-item/list-item.component';
import { Component, OnInit, AfterViewChecked, QueryList, ViewChildren, AfterContentInit, AfterViewInit } from '@angular/core';
import { Output, Input, EventEmitter } from '@angular/core';
import { SessionsService } from '../../core/services/sessions/sessions.service'
import { AppConfig } from '../../../environments/environment';

@Component({
  selector: 'app-session-list',
  templateUrl: './session-list.component.html',
  styleUrls: ['./session-list.component.scss']
})
export class SessionListComponent implements OnInit, AfterViewChecked {
  sessions;
  editable = false

  trial = AppConfig.trial

  @ViewChildren(ListItemComponent) private listItems: QueryList<ListItemComponent>;

  @Output() sessionSelected = new EventEmitter()

  selectedSession: ListItemComponent

  constructor(
    private sessionsService: SessionsService
  ) { }

  onSessionSelected(ev: any): void {
    this.editable = ev.payload.editable;

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

  onCreateNewSession(): void {
    this.sessionsService.createSession();
    window.setTimeout(()=>{
      this.onSessionSelected({
        listItem: this.listItems.last,
        payload: this.listItems.last.payload
      })
    })
  }

  ngAfterViewChecked() {
    
  }

  onDeleteSession() {
    let confirm = window.confirm("Are you sure you want to delete this session?")
    if(confirm) {
      this.sessionsService.deleteSession(this.selectedSession.payload.id)
      if(this.selectedSession) {
        this.selectedSession.deselect()
      }
      this.sessionSelected.emit(null)
      this.selectedSession = null
      this.editable = false;
    }
  }
}
