import {FormBuilder, FormGroup} from '@angular/forms';
import {ChangeDetectorRef, Directive, NgZone} from '@angular/core';

import {ClearCacheOptions, DispatchOptions, UnitConfig} from '@activejs/core';

@Directive()
// tslint:disable-next-line:directive-class-suffix
export abstract class ExampleBaseAbstract {
  boolUnitInputValueHelp = `Just a helper to toggle the input value b/w true/false`;

  methodOptionsHelp = `Options passed to dispatch method.<br><br>
Please see API reference or documentation for more details.
`;

  genericEvalInputHelp = `Input is evaluated using <code>eval</code>
to allow all data types like <code>object</code>, <code>array</code>, <code>number</code>, etc.<br><br>

<b>example:</b><br>
<code>4</code> is evaluated as <code>number</code>, to pass string use <code>'4'</code>.<br>
Empty input is equal to <code>undefined</code>.<br><br>

For errors please check console because <code>eval</code> can and will fail.`;

  cacheIteratorLength;
  cacheIterator;

  configurationForm: FormGroup;
  dispatchOptions: DispatchOptions = {};

  collapseOtherMethods = true;
  collapseEventDetails = true;

  protected constructor(
    protected formBuilder: FormBuilder,
    protected cdRef: ChangeDetectorRef,
    protected ngZone: NgZone
  ) {
    this.configure();
    this.configureForm();
  }

  abstract configureForm();

  abstract createInstance(configOptions);

  abstract updateCacheIterator();

  configure() {
    const configOptions: UnitConfig<any> = this.configurationForm
      ? this.configurationForm.value
      : {};

    this.createInstance(configOptions);

    this.dispatchOptions.force = false;
    this.dispatchOptions.cacheReplace = false;

    if (this.configurationForm) {
      this.configurationForm.markAsPristine();
    }
  }

  eval(exp: string) {
    try {
      // tslint:disable-next-line:no-eval
      return eval(typeof exp !== 'string' || exp.trim() === '' ? '' : `(${exp})`);
    } catch (e) {
      alert('Error in eval, see console for more details.\n\n' + e);
      console.error(e);
    }
  }
}
