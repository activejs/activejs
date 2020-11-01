import {UnitConfig} from '../models';
import {Configuration} from './configuration';
import {UnitBase} from './abstract-unit-base';
import {makeNonEnumerable} from '../utils/funcs';

/**
 * BoolUnit is a reactive storage Unit that stores `boolean` value.
 *
 * It only accepts `boolean` data type as its value.
 * It ensures that at any point of time the value would always be `boolean`.
 *
 * Learn more about Units [here](https://docs.activejs.dev/fundamentals/units). \
 * Learn more about BoolUnit [here](https://docs.activejs.dev/fundamentals/units/boolunit).
 *
 * Just like every other ActiveJS Unit:
 * - BoolUnit extends {@link UnitBase}
 * - Which further extends {@link Base} and `Observable`
 *
 * @category 1. Units
 */
export class BoolUnit extends UnitBase<boolean> {
  /**
   * Current value of the Unit.
   * @default `false` (boolean false)
   *
   * @category Access Value
   */
  value(): boolean {
    return this.rawValue();
  }

  /**
   * @internal please do not use.
   */
  protected defaultValue(): boolean {
    return false;
  }

  constructor(config?: UnitConfig<boolean>) {
    super({
      ...Configuration.BOOL_UNIT,
      ...config,
    });

    makeNonEnumerable(this);
  }

  /**
   * Extends {@link UnitBase.wouldDispatch} and adds additional check for type boolean,
   * which cannot be bypassed even by using param `force`.
   *
   * @param value The value to be dispatched.
   * @param force Whether dispatch-checks should be bypassed or not.
   * @returns A boolean indicating whether the param `value` would pass the dispatch-checks if dispatched.
   *
   * @category Common Units
   */
  wouldDispatch(value: boolean, force?: boolean): boolean {
    return this.isValidValue(value) && super.wouldDispatch(value, force);
  }

  /**
   * @internal please do not use.
   */
  protected isValidValue(value: any): boolean {
    return typeof value === 'boolean';
  }
}
