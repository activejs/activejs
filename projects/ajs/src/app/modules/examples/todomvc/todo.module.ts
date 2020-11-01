import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';

import {TodoComponent} from './todo.component';
import {TodoService} from './todo.service';
import {TodoFilter} from './pipes';

@NgModule({
  declarations: [TodoComponent, TodoFilter],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild([
      {
        path: '**',
        component: TodoComponent,
      },
    ]),
  ],
  providers: [TodoService],
})
export class TodoModule {}
