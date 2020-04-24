import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';

import { PageNotFoundComponent } from './components/';
import { WebviewDirective } from './directives/';
import { FormsModule } from '@angular/forms';
import { ListItemComponent } from './components/list-item/list-item.component';

@NgModule({
  declarations: [PageNotFoundComponent, WebviewDirective, ListItemComponent],
  imports: [CommonModule, TranslateModule, FormsModule],
  exports: [TranslateModule, WebviewDirective, FormsModule, ListItemComponent]
})
export class SharedModule {}
