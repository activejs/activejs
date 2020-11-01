import {ChangeDetectorRef, Component, NgZone} from '@angular/core';
import {FormBuilder} from '@angular/forms';

import {GenericUnit} from '@activejs/core';
import {UnitExampleBaseAbstract} from '../unit-example-base';

@Component({
  selector: 'ajs-playground-generic-unit',
  templateUrl: '../unit-example.html',
})
export class GenericUnitComponent extends UnitExampleBaseAbstract<GenericUnit<any>> {
  get unitType() {
    return 'GenericUnit';
  }

  constructor(formBuilder: FormBuilder, cdRef: ChangeDetectorRef, ngZone: NgZone) {
    super(formBuilder, cdRef, ngZone);
  }

  createInstance(configOptions) {
    this.createInstanceDynamically(configOptions, GenericUnit);
  }
}
