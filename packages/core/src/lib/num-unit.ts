import {Observable} from 'rxjs';
import {UnitConfig} from '../models';
import {isFunction, isNumber, makeNonEnumerable} from '../utils/funcs';
import {Configuration} from './configuration';
import {UnitBase} from './abstract-unit-base';
import {Base} from './abstract-base';

// tslint:disable-next-line:no-empty-interface
export interface NumUnit extends Number {}

/**
 * NumUnit is a reactive storage Unit that emulates `number`.
 *
 * It only accepts `number` data type as its value.
 * It ensures that at any point of time the value would always be `number`.
 *
 * NumUnit implements all the `Number.prototype` methods that are available
 * in the environment/browser its running, including polyfills.
 * e.g.: `toFixed`, `toPrecision`, etc.
 *
 * Learn more about Units [here](https://docs.activejs.dev/fundamentals/units). \
 * Learn more about NumUnit [here](https://docs.activejs.dev/fundamentals/units/numunit).
 *
 * Just like every other ActiveJS Unit:
 * - NumUnit extends {@link UnitBase}
 * - Which further extends {@link Base} and `Observable`
 *
 * @category 1. Units
 */
export class NumUnit extends UnitBase<number> {
  /**
   * Current value of the Unit.
   * @default `0` (number zero)
   *
   * @category Access Value
   */
  value(): number {
    return this.rawValue();
  }

  /**
   * @internal please do not use.
   */
  protected defaultValue(): number {
    return 0;
  }

  constructor(config?: UnitConfig<number>) {
    super({
      ...Configuration.NUM_UNIT,
      ...config,
    });

    makeNonEnumerable(this);
  }

  /**
   * Extends {@link UnitBase.wouldDispatch} and adds additional check for type number,
   * which cannot be bypassed even by using param `force`.
   *
   * @param value The value to be dispatched.
   * @param force Whether dispatch-checks should be bypassed or not.
   * @returns A boolean indicating whether the param `value` would pass the dispatch-checks if dispatched.
   *
   * @category Common Units
   */
  wouldDispatch(value: number, force?: boolean): boolean {
    return this.isValidValue(value) && super.wouldDispatch(value, force);
  }

  /**
   * @internal please do not use.
   */
  protected isValidValue(value: any): boolean {
    return isNumber(value);
  }

  /**
   * @deprecated
   * @ignore
   * @internal please do not use.
   */
  static Number: any;
}

/**
 * @internal please do not use.
 */
const MethodsNotToImplement = [
  ...Object.getOwnPropertyNames(Observable.prototype),
  ...Object.getOwnPropertyNames(Base.prototype),
  ...Object.getOwnPropertyNames(UnitBase.prototype),
  ...Object.getOwnPropertyNames(NumUnit.prototype),
];
Object.getOwnPropertyNames(Number.prototype).forEach(method => {
  if (!isFunction(Number.prototype[method]) || MethodsNotToImplement.includes(method)) {
    return;
  }

  Object.defineProperty(NumUnit.prototype, method, {
    value(...args) {
      return Number.prototype[method].apply(this.value(), args);
    },
  });
});
