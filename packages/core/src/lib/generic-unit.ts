import {Configuration} from './configuration';
import {UnitBase} from './abstract-unit-base';
import {NonPrimitiveUnitBase} from './abstract-non-primitive-unit-base';
import {findIndex, findIndexBackwards, makeNonEnumerable} from '../utils/funcs';
import {KOf, UnitConfig} from '../models';

/**
 * GenericUnit is a reactive storage Unit that doesn't pertain to any specific data type.
 *
 * GenericUnit accepts all data types as its value.
 *
 * Learn more about Units [here](https://docs.activejs.dev/fundamentals/units). \
 * Learn more about GenericUnit [here](https://docs.activejs.dev/fundamentals/units/genericunit).
 *
 * Just like every other ActiveJS Unit:
 * - GenericUnit extends {@link UnitBase}
 * - Which further extends {@link Base} and `Observable`
 *
 * @category 1. Units
 */
export class GenericUnit<
  T,
  K extends KOf<T> = KOf<T>,
  V extends T[K] = T[K]
> extends NonPrimitiveUnitBase<T> {
  constructor(config?: UnitConfig<T>) {
    super({
      ...Configuration.GENERIC_UNIT,
      ...config,
    });

    makeNonEnumerable(this);
  }

  /**
   * The underlying method that makes `skipNilValues` possible for {@link goBack} and {@link goForward}.
   *
   * @param direction The direction to find the non `null` or `undefined` value in.
   *
   * @hidden
   * @category Cache Navigation
   */
  private goToNonNilValue(direction: 'BACK' | 'FORWARD'): boolean {
    if (this.isFrozen) {
      return false;
    }
    const lastNonNilValueIndex =
      direction === 'BACK'
        ? findIndexBackwards(this._cachedValues, v => v != null, this.cacheIndex - 1)
        : findIndex(this._cachedValues, v => v != null, this.cacheIndex + 1);
    if (lastNonNilValueIndex === -1) {
      return false;
    }
    return this.jump(lastNonNilValueIndex - this.cacheIndex);
  }

  /**
   * It extends {@link UnitBase.goBack}, and allows skipping over nil (null or undefined) values. \
   * To skip over nil values pass `true` as `skipNilValues`.
   *
   * @param skipNilValues Should the `null` and `undefined` values be skipped over.
   *
   * @category Cache Navigation
   */
  goBack(skipNilValues = false): boolean {
    if (skipNilValues === true) {
      return this.goToNonNilValue('BACK');
    }

    return super.goBack();
  }

  /**
   * It extends {@link UnitBase.goForward}, and allows skipping over nil (null or undefined) values. \
   * To skip over nil values pass `true` as `skipNilValues`.
   *
   * @param skipNilValues Should the `null` and `undefined` values be skipped over.
   *
   * @category Cache Navigation
   */
  goForward(skipNilValues = false): boolean {
    if (skipNilValues === true) {
      return this.goToNonNilValue('FORWARD');
    }

    return super.goForward();
  }

  /**
   * @internal please do not use.
   */
  protected isValidValue(value: any): boolean {
    return true;
  }
}
