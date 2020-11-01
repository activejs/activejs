import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {RouterModule, Routes} from '@angular/router';
import {TypeaheadComponent} from './typeahead/typeahead.component';
import {ExamplesComponent} from './examples.component';

const routes: Routes = [
  {
    path: '',
    component: ExamplesComponent,
    children: [
      {
        path: 'typeahead',
        component: TypeaheadComponent,
      },
      {
        path: 'todomvc',
        loadChildren: () => import('./todomvc/todo.module').then(m => m.TodoModule),
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'typeahead',
      },
    ],
  },
];

@NgModule({
  declarations: [ExamplesComponent, TypeaheadComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule.forChild(routes),
  ],
  providers: [],
})
export class ExamplesModule {}
