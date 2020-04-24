import { ListItemComponent } from './../shared/components/list-item/list-item.component';
import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRoutingModule } from './home-routing.module';

import { HomeComponent } from './home.component';
import { SharedModule } from '../shared/shared.module';
import { SessionListComponent } from './session-list/session-list.component';
import { SessionConfigComponent } from './session-config/session-config.component';
import { RoundConfigComponent } from './round-config/round-config.component';

@NgModule({
  declarations: [HomeComponent, SessionListComponent, SessionConfigComponent, RoundConfigComponent],
  imports: [CommonModule, SharedModule, HomeRoutingModule],
  schemas: [NO_ERRORS_SCHEMA]
})
export class HomeModule {}
