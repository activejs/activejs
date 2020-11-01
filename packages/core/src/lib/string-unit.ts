import {Observable} from 'rxjs';
import {UnitConfig} from '../models';
import {Base} from './abstract-base';
import {UnitBase} from './abstract-unit-base';
import {Configuration} from './configuration';
import {isFunction, IteratorSymbol, makeNonEnumerable} from '../utils/funcs';

// tslint:disable-next-line: no-empty-interface
export interface StringUnit extends String {}

/**
 * StringUnit is a reactive storage Unit that emulates `string`.
 *
 * It only accepts `string` data type as its value.
 * It ensures that at any point of time the value would always be `string`.
 *
 * StringUnit implements all the `String.prototype` methods that are available
 * in the environment/browser its running, including polyfills.
 * e.g.: `trim`, `match`, `includes`, etc.
 *
 * Learn more about Units [here](https://docs.activejs.dev/fundamentals/units). \
 * Learn more about StringUnit [here](https://docs.activejs.dev/fundamentals/units/stringunit).
 *
 * Just like every other ActiveJS Unit:
 * - StringUnit extends {@link UnitBase}
 * - Which further extends {@link Base} and `Observable`
 *
 * @category 1. Units
 */
export class StringUnit extends UnitBase<string> {
  /**
   * Length of the string {@link value}.
   */
  get length(): number {
    return this.rawValue().length;
  }

  /**
   * Current value of the Unit.
   * @default `''` (empty string)
   *
   * @category Access Value
   */
  value(): string {
    return this.rawValue();
  }

  /**
   * @internal please do not use.
   */
  protected defaultValue(): string {
    return '';
  }

  constructor(config?: UnitConfig<string>) {
    super({
      ...Configuration.STRING_UNIT,
      ...config,
    });

    makeNonEnumerable(this);
  }

  /**
   * Extends {@link UnitBase.wouldDispatch} and adds additional check for type string,
   * which cannot be bypassed even by using {@link force}.
   *
   * @param value The value to be dispatched.
   * @param force Whether dispatch-checks should be bypassed or not.
   * @returns A boolean indicating whether the param `value` would pass the dispatch-checks if dispatched.
   *
   * @category Common Units
   */
  wouldDispatch(value: string, force?: boolean): boolean {
    return this.isValidValue(value) && super.wouldDispatch(value, force);
  }

  /**
   * @internal please do not use.
   */
  protected isValidValue(value: any): boolean {
    return typeof value === 'string';
  }

  /**
   * @internal please do not use.
   */
  [IteratorSymbol](): IterableIterator<string> {
    return String.prototype[IteratorSymbol].call(this.value());
  }

  /**
   * @deprecated
   * @ignore
   * @internal please do not use.
   */
  static String: any;
}

/**
 * @internal please do not use.
 */
const MethodsNotToImplement = [
  ...Object.getOwnPropertyNames(Observable.prototype),
  ...Object.getOwnPropertyNames(Base.prototype),
  ...Object.getOwnPropertyNames(UnitBase.prototype),
  ...Object.getOwnPropertyNames(StringUnit.prototype),
];
Object.getOwnPropertyNames(String.prototype).forEach(method => {
  if (!isFunction(String.prototype[method]) || MethodsNotToImplement.includes(method)) {
    return;
  }

  Object.defineProperty(StringUnit.prototype, method, {
    value(...args) {
      return String.prototype[method].apply(this.value(), args);
    },
  });
});
