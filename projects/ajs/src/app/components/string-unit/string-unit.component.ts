import {ChangeDetectorRef, Component, NgZone} from '@angular/core';
import {FormBuilder} from '@angular/forms';

import {StringUnit} from '@activejs/core';
import {UnitExampleBaseAbstract} from '../unit-example-base';

@Component({
  selector: 'ajs-playground-string-unit',
  templateUrl: '../unit-example.html',
})
export class StringUnitComponent extends UnitExampleBaseAbstract<StringUnit> {
  get unitType() {
    return 'StringUnit';
  }

  constructor(formBuilder: FormBuilder, cdRef: ChangeDetectorRef, ngZone: NgZone) {
    super(formBuilder, cdRef, ngZone);
  }

  createInstance(configOptions) {
    this.createInstanceDynamically(configOptions, StringUnit);
  }
}
