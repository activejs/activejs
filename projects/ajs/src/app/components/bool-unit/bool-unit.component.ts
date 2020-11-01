import {ChangeDetectorRef, Component, NgZone} from '@angular/core';
import {FormBuilder} from '@angular/forms';

import {BoolUnit} from '@activejs/core';
import {UnitExampleBaseAbstract} from '../unit-example-base';

@Component({
  selector: 'ajs-playground-bool-unit',
  templateUrl: '../unit-example.html',
})
export class BoolUnitComponent extends UnitExampleBaseAbstract<BoolUnit> {
  get unitType() {
    return 'BoolUnit';
  }

  constructor(formBuilder: FormBuilder, cdRef: ChangeDetectorRef, ngZone: NgZone) {
    super(formBuilder, cdRef, ngZone);
  }

  createInstance(configOptions) {
    this.createInstanceDynamically(configOptions, BoolUnit);
  }
}
