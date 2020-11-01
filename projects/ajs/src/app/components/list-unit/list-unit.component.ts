import {ChangeDetectorRef, Component, NgZone} from '@angular/core';
import {FormBuilder} from '@angular/forms';

import {ListUnit} from '@activejs/core';
import {UnitExampleBaseAbstract} from '../unit-example-base';

@Component({
  selector: 'ajs-playground-list-unit',
  templateUrl: '../unit-example.html',
})
export class ListUnitComponent extends UnitExampleBaseAbstract<ListUnit<any>> {
  get unitType() {
    return 'ListUnit';
  }

  constructor(formBuilder: FormBuilder, cdRef: ChangeDetectorRef, ngZone: NgZone) {
    super(formBuilder, cdRef, ngZone);
  }

  createInstance(configOptions) {
    this.createInstanceDynamically(configOptions, ListUnit);
  }
}
