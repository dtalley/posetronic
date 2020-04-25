import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-round-config',
  templateUrl: './round-config.component.html',
  styleUrls: ['./round-config.component.scss']
})
export class RoundConfigComponent implements OnInit {
  roundData: any = {}
  active = false
  constructor() { }

  loadRound(payload: any):void {
    this.roundData = payload || {}
  }

  setActive() {
    this.active = true
  }

  ngOnInit(): void {
  }

}
