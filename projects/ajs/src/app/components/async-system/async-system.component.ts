import {ChangeDetectorRef, Component, NgZone} from '@angular/core';
import {FormBuilder} from '@angular/forms';
import {merge} from 'rxjs';
import {debounceTime} from 'rxjs/operators';

import {ExampleBaseAbstract} from '../example-base';
import {AsyncSystem, AsyncSystemConfig, BoolUnit, GenericUnit} from '@activejs/core';
import {environment} from '../../../environments/environment';

@Component({
  selector: 'ajs-playground-async-system',
  templateUrl: './async-system.component.html',
})
export class AsyncSystemComponent extends ExampleBaseAbstract {
  asyncSystem: AsyncSystem<any, any, any>;
  queryUnit: GenericUnit<any>;
  dataUnit: GenericUnit<any>;
  errorUnit: GenericUnit<any>;
  pendingUnit: BoolUnit;

  pendingCachedValues = [];
  queryCachedValues = [];
  dataCachedValues = [];
  errorCachedValues = [];

  constructor(formBuilder: FormBuilder, cdRef: ChangeDetectorRef, ngZone: NgZone) {
    super(formBuilder, cdRef, ngZone);
  }

  configureForm() {
    this.configurationForm = this.formBuilder.group({
      freezeQueryWhilePending: [false],

      clearErrorOnData: [true],
      clearErrorOnQuery: [false],

      clearDataOnError: [false],
      clearDataOnQuery: [false],

      autoUpdatePendingValue: [true],
    });

    this.configurationForm.get('clearErrorOnData').valueChanges.subscribe(isOn => {
      if (isOn) {
        this.configurationForm.get('clearErrorOnQuery').setValue(false, {emitEvent: false});
      }
    });
    this.configurationForm.get('clearErrorOnQuery').valueChanges.subscribe(isOn => {
      if (isOn) {
        this.configurationForm.get('clearErrorOnData').setValue(false, {emitEvent: false});
      }
    });

    this.configurationForm.get('clearDataOnError').valueChanges.subscribe(isOn => {
      if (isOn) {
        this.configurationForm.get('clearDataOnQuery').setValue(false, {emitEvent: false});
      }
    });
    this.configurationForm.get('clearDataOnQuery').valueChanges.subscribe(isOn => {
      if (isOn) {
        this.configurationForm.get('clearDataOnError').setValue(false, {emitEvent: false});
      }
    });
  }

  createInstance(configOptions: AsyncSystemConfig<any, any, any>) {
    configOptions.id = 'randomID';
    this.asyncSystem = new AsyncSystem<any, any, any>(configOptions);
    const {queryUnit, dataUnit, errorUnit, pendingUnit} = this.asyncSystem;
    Object.assign(this, {queryUnit, dataUnit, errorUnit, pendingUnit});

    merge(
      this.asyncSystem,
      this.asyncSystem.events$,
      this.queryUnit.events$,
      this.dataUnit.events$,
      this.errorUnit.events$,
      this.pendingUnit.events$
    )
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
    window['asyncSystem'] = this.asyncSystem;
    const {colors, commonConsoleStyles} = environment;
    console.clear();
    console.log(
      `%cThe current AsyncSystem instance has been assigned to global variable "asyncSystem". ` +
        `You can use it directly from the console, like this:` +
        `%casyncSystem.queryUnit.dispatch('Am I Blue?')`,
      commonConsoleStyles + `margin: 10px;background: #000; color: #fff`,
      commonConsoleStyles + `margin: 10px;background: #000; color: ${colors.successColor};`
    );
  }

  updateCacheIterator() {
    this.pendingCachedValues = [...this.pendingUnit.cachedValues()];
    this.queryCachedValues = [...this.queryUnit.cachedValues()];
    this.dataCachedValues = [...this.dataUnit.cachedValues()];
    this.errorCachedValues = [...this.errorUnit.cachedValues()];

    this.cacheIteratorLength = Math.max(
      this.pendingUnit.cachedValuesCount,
      this.queryUnit.cachedValuesCount,
      this.dataUnit.cachedValuesCount,
      this.errorUnit.cachedValuesCount
    );
    this.cacheIterator = Array(this.cacheIteratorLength).fill(null);
  }
}
