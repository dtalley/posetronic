import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-round-config',
  templateUrl: './round-config.component.html',
  styleUrls: ['./round-config.component.scss']
})
export class RoundConfigComponent implements OnInit {
  roundData: any = {}
  constructor() { }

  loadRound(payload: any):void {
    this.roundData = payload || {}
  }

  ngOnInit(): void {
  }

}
