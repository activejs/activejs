import {ChangeDetectorRef, Directive, HostBinding, NgZone} from '@angular/core';
import {FormBuilder} from '@angular/forms';
import {merge, Observable} from 'rxjs';
import {debounceTime} from 'rxjs/operators';

import {
  BoolUnit,
  DictUnit,
  GenericUnit,
  ListUnit,
  NumUnit,
  StringUnit,
  Unit,
  UnitBase,
} from '@activejs/core';
import {ExampleBaseAbstract} from './example-base';
import {environment} from '../../environments/environment';

@Directive()
// tslint:disable-next-line:directive-class-suffix
export abstract class UnitExampleBaseAbstract<
  UnitType extends UnitBase<any>
> extends ExampleBaseAbstract {
  @HostBinding('class.standalone-unit') standaloneUnit = true;

  unit: UnitBase<any> & DictUnit<any> & ListUnit<any> & GenericUnit<any>;
  unitCachedValues = [];
  abstract unitType: string;

  protected constructor(formBuilder: FormBuilder, cdRef: ChangeDetectorRef, ngZone: NgZone) {
    super(formBuilder, cdRef, ngZone);
  }

  configureForm() {
    this.configurationForm = this.formBuilder.group({
      distinctDispatchCheck: [false],
      immutable: [false],
      cacheSize: [this.unit.cacheSize],
      initialValue: [''],
    });
  }

  createInstanceDynamically(configOptions, unitClass) {
    configOptions.cacheSize = this.eval(String(configOptions.cacheSize));
    configOptions.initialValue = this.eval(configOptions.initialValue);

    this.unit = new unitClass(configOptions);

    merge(this.unit, this.unit.events$ as Observable<any>)
      .pipe(debounceTime(200))
      .subscribe(() => {
        if (this.ngZone) {
          this.ngZone.run(() => {
            this.cdRef.markForCheck();
            this.updateCacheIterator();
          });
        }
      });

    // tslint:disable-next-line:no-string-literal
    window['unit'] = this.unit;
    const {colors, commonConsoleStyles} = environment;
    console.clear();
    console.log(
      `%cThe current ${this.unitType} instance has been assigned to global variable "unit". ` +
        `You can use it directly from the console, like this:` +
        `%cunit.clear()`,
      commonConsoleStyles + `margin: 10px;background: #000; color: #fff`,
      commonConsoleStyles + `margin: 10px;background: #000; color: ${colors.successColor};`
    );
  }

  updateCacheIterator() {
    this.unitCachedValues = [...this.unit.cachedValues()];
    this.cacheIteratorLength = this.unit.cachedValuesCount;
    this.cacheIterator = Array(this.cacheIteratorLength).fill(null);
  }
}
