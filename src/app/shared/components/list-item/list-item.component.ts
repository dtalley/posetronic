import { Component, OnInit, HostListener, HostBinding } from '@angular/core';
import { Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'list-item',
  templateUrl: './list-item.component.html',
  styleUrls: ['./list-item.component.scss']
})
export class ListItemComponent implements OnInit {
  @Input() payload: any
  @Output() selected = new EventEmitter();

  @HostBinding('class.selected') isSelected: boolean = false

  constructor() { }

  @HostListener("click") onClick() {
    this.selected.emit({
      listItem: this,
      payload: this.payload
    });
  }

  ngOnInit(): void {
    
  }

  select(): void {
    this.isSelected = true
  }

  deselect(): void {
    this.isSelected = false
  }
}
