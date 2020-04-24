import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RoundConfigComponent } from './round-config.component';

describe('RoundConfigComponent', () => {
  let component: RoundConfigComponent;
  let fixture: ComponentFixture<RoundConfigComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RoundConfigComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RoundConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
