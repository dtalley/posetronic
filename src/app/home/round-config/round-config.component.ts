import { Component, OnInit } from '@angular/core';
import { SessionsService } from '../../core/services/sessions/sessions.service';

@Component({
  selector: 'app-round-config',
  templateUrl: './round-config.component.html',
  styleUrls: ['./round-config.component.scss']
})
export class RoundConfigComponent implements OnInit {
  roundData: any = {}
  roundIndex = -1
  sessionId: string
  active = false
  editable = false
  roundHours = 0
  roundMinutes = 0
  roundSeconds = 0
  constructor(
    private sessionsService: SessionsService
  ) { }

  loadRound(payload: any):void {
    if(payload && payload.round) {
      this.roundData = payload.round
      this.roundIndex = payload.index
      this.calculateDuration()
    } else {
      this.roundData = {}
    }
  }

  calculateDuration() {
    let duration = this.roundData.duration
    this.roundHours = Math.floor(duration/(60*60))
    duration -= this.roundHours*(60*60)
    this.roundMinutes = Math.floor(duration/60)
    duration -= this.roundMinutes*60
    this.roundSeconds = duration
  }

  configure(sessionId, newActive, editable) {
    this.sessionId = sessionId
    this.active = newActive
    this.editable = editable
  }

  ngOnInit(): void {
  }

  addTime(time) {
    this.sessionsService.addRoundTime(this.sessionId, this.roundIndex, time)
    this.calculateDuration()
  }

  addCount(count) {
    this.sessionsService.addRoundCount(this.sessionId, this.roundIndex, count)
    this.calculateDuration()
  }

  setRoundType(type) {
    this.sessionsService.setRoundType(this.sessionId, this.roundIndex, type)
  }
}
