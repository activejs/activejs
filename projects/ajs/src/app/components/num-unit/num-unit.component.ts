import {ChangeDetectorRef, Component, NgZone} from '@angular/core';
import {FormBuilder} from '@angular/forms';

import {NumUnit} from '@activejs/core';
import {UnitExampleBaseAbstract} from '../unit-example-base';

@Component({
  selector: 'ajs-playground-num-unit',
  templateUrl: '../unit-example.html',
})
export class NumUnitComponent extends UnitExampleBaseAbstract<NumUnit> {
  get unitType() {
    return 'NumUnit';
  }

  constructor(formBuilder: FormBuilder, cdRef: ChangeDetectorRef, ngZone: NgZone) {
    super(formBuilder, cdRef, ngZone);
  }

  createInstance(configOptions) {
    this.createInstanceDynamically(configOptions, NumUnit);
  }
}
