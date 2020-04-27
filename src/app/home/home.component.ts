import { RoundConfigComponent } from './round-config/round-config.component';
import { SessionConfigComponent } from './session-config/session-config.component';
import { Component, OnInit } from '@angular/core';
import { ViewChild } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  @ViewChild(SessionConfigComponent) sessionConfig: SessionConfigComponent;
  @ViewChild(RoundConfigComponent) roundConfig: RoundConfigComponent;
  constructor(private router: Router) { }

  onSessionSelected(payload: any): void {
    this.sessionConfig.loadSession(payload)
    this.roundConfig.loadRound(null)
    this.roundConfig.configure(payload!==null, (payload?payload.editable:false))
  }

  onRoundSelected(payload: any): void {
    this.roundConfig.loadRound(payload)
  }

  ngOnInit(): void { }

}
