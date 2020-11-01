import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {RouterModule, Routes} from '@angular/router';
import {TooltipModule} from 'ng2-tooltip-directive';

import {AsyncSystemComponent} from '../../components/async-system/async-system.component';
import {GenericUnitComponent} from '../../components/generic-unit/generic-unit.component';
import {BoolUnitComponent} from '../../components/bool-unit/bool-unit.component';
import {StringUnitComponent} from '../../components/string-unit/string-unit.component';
import {NumUnitComponent} from '../../components/num-unit/num-unit.component';
import {DictUnitComponent} from '../../components/dict-unit/dict-unit.component';
import {ListUnitComponent} from '../../components/list-unit/list-unit.component';
import {FooterNotesComponent} from '../../components/footer-notes/footer-notes.component';
import {PlaygroundComponent} from './playground.component';
import {RunClassDirective} from '../../directives/run-class.directive';
import {JsonPipe} from '../../pipes/json.pipe';
import {FilterFalsyOptionsPipe} from '../../pipes/filter-falsy-options.pipe';
import {EmptySpaceInArrayVizPipe} from '../../pipes/empty-space-in-array-viz.pipe';
import {AccordionDirective} from '../../directives/accordion';
import {EventNamePipe} from '../../pipes/event-name.pipe';

const routes: Routes = [
  {
    path: '',
    component: PlaygroundComponent,
    children: [
      {
        path: 'genericunit',
        component: GenericUnitComponent,
      },
      {
        path: 'asyncsystem',
        component: AsyncSystemComponent,
      },
      {
        path: 'boolunit',
        component: BoolUnitComponent,
      },
      {
        path: 'numunit',
        component: NumUnitComponent,
      },
      {
        path: 'stringunit',
        component: StringUnitComponent,
      },
      {
        path: 'dictunit',
        component: DictUnitComponent,
      },
      {
        path: 'listunit',
        component: ListUnitComponent,
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'genericunit',
      },
    ],
  },
];

@NgModule({
  declarations: [
    PlaygroundComponent,
    AsyncSystemComponent,
    GenericUnitComponent,
    BoolUnitComponent,
    StringUnitComponent,
    NumUnitComponent,
    DictUnitComponent,
    ListUnitComponent,
    FooterNotesComponent,
    JsonPipe,
    FilterFalsyOptionsPipe,
    RunClassDirective,
    EmptySpaceInArrayVizPipe,
    AccordionDirective,
    EventNamePipe,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule.forChild(routes),
    TooltipModule.forRoot({
      'hide-delay': 0,
      'content-type': 'html',
      'max-width': 500,
      'show-delay': 300,
      placement: 'top',
    }),
  ],
  providers: [],
})
export class PlaygroundModule {}
