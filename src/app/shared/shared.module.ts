import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';

import { PageNotFoundComponent } from './components/';
import { WebviewDirective } from './directives/';
import { FormsModule } from '@angular/forms';
import { ListItemComponent } from './components/list-item/list-item.component';
import { CircleTimerComponent } from './components/circle-timer/circle-timer.component';

@NgModule({
  declarations: [PageNotFoundComponent, WebviewDirective, ListItemComponent, CircleTimerComponent],
  imports: [CommonModule, TranslateModule, FormsModule],
  exports: [TranslateModule, WebviewDirective, FormsModule, ListItemComponent, CircleTimerComponent],
  schemas: [NO_ERRORS_SCHEMA]
})
export class SharedModule {}
