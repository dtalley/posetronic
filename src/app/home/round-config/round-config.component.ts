import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-round-config',
  templateUrl: './round-config.component.html',
  styleUrls: ['./round-config.component.scss']
})
export class RoundConfigComponent implements OnInit {
  roundData: any = {}
  active = false
  editable = false
  constructor() { }

  loadRound(payload: any):void {
    this.roundData = payload || {}
  }

  configure(newActive, editable) {
    this.active = newActive
    this.editable = editable
  }

  ngOnInit(): void {
  }

}
