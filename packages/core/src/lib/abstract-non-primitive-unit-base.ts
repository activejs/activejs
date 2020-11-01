import {UnitBase} from './abstract-unit-base';
import {makeNonEnumerable} from '../utils/funcs';
import {KOf, UnitConfig} from '../models';
import {checkPath} from '../checks/common';
import {Selection} from './selection';

/**
 * Base for non-primitive Units.
 *
 * - NonPrimitiveUnitBase extends {@link UnitBase}
 * - Which further extends {@link Base} and `Observable`
 *
 * @category 2. Abstract
 */
export abstract class NonPrimitiveUnitBase<
  T,
  K extends KOf<T> = KOf<T>,
  V extends T[K] = T[K]
> extends UnitBase<T> {
  protected constructor(config?: UnitConfig<T>) {
    super(config);

    makeNonEnumerable(this);
  }

  /**
   * Returns the names of the properties of the current {@link value} using `Object.keys`. \
   *
   * In case of a GenericUnit,
   * if current {@link value} is null or undefined, it returns an empty `array`, \
   * where `Object.keys` would have failed.
   *
   * @category Common List/Dict/Generic Units
   */
  objectKeys(): string[] {
    return this.rawValue() == null ? [] : Object.keys(this.rawValue());
  }

  /**
   * Returns an `array` of key/values of the properties of the current {@link value} using `Object.entries`. \
   *
   * In case of a GenericUnit,
   * if current {@link value} is null or undefined, it returns an empty `array`, \
   * where `Object.entries` would have failed.
   *
   * @category Common List/Dict/Generic Units
   */
  objectEntries(): [string, V][] {
    return this.rawValue() == null ? [] : Object.entries(this.value());
  }

  /**
   * Returns an `array` of values of the properties of the current {@link value} using `Object.values`. \
   *
   * In case of a GenericUnit,
   * if current {@link value} is null or undefined, it returns an empty `array`, \
   * where `Object.values` would have failed.
   *
   * @category Common List/Dict/Generic Units
   */
  objectValues(): V[] {
    return this.rawValue() == null ? [] : Object.values(this.value());
  }

  // tslint:disable:max-line-length
  // prettier-ignore
  select<K1 extends KOf<T>>(k1: K1): Selection<T[K1], this>;
  // prettier-ignore
  select<K1 extends KOf<T>, K2 extends KOf<T[K1]>>(k1: K1, k2: K2): Selection<T[K1][K2], this>;
  // prettier-ignore
  select<K1 extends KOf<T>, K2 extends KOf<T[K1]>, K3 extends KOf<T[K1][K2]>>(k1: K1, k2: K2, k3: K3): Selection<T[K1][K2][K3], this>;
  // using 'keyof' instead of 'KOf' for K4 onwards https://github.com/microsoft/TypeScript/issues/34933
  // prettier-ignore
  select<K1 extends KOf<T>, K2 extends KOf<T[K1]>, K3 extends KOf<T[K1][K2]>, K4 extends keyof T[K1][K2][K3]>(k1: K1, k2: K2, k3: K3, k4: K4): Selection<T[K1][K2][K3][K4], this>;
  // prettier-ignore
  select<K1 extends KOf<T>, K2 extends KOf<T[K1]>, K3 extends KOf<T[K1][K2]>, K4 extends keyof T[K1][K2][K3], K5 extends keyof T[K1][K2][K3][K4]>(k1: K1, k2: K2, k3: K3, k4: K4, k5: K5): Selection<T[K1][K2][K3][K4][K5], this>;
  // prettier-ignore
  select<K1 extends KOf<T>, K2 extends KOf<T[K1]>, K3 extends KOf<T[K1][K2]>, K4 extends keyof T[K1][K2][K3], K5 extends keyof T[K1][K2][K3][K4]>(k1: K1, k2: K2, k3: K3, k4: K4, k5: K5, ...path: (string | number)[]): Selection<any, this>;
  // tslint:enable:max-line-length
  /**
   * Select a nested property at a certain path in the Unit's {@link value}.
   *
   * It can be used to create an Observable to listen to changes in a nested property
   * using {@link Selection.asObservable} method.
   *
   * Other {@link Selection} methods like `set`, `has`, `get` can be helpful
   * when the Unit is configured to be immutable, or in general when you need
   * to update a nested property.
   *
   * @example
   * ```typescript
   * // create a Unit
   * const unit = new DictUnit();
   *
   * // create a selection
   * const selection = unit.select('a', 'b', 0);
   * // create an Observable
   * const selection$ = selection.asObservable();
   * // subscribe to the selector
   * selection.subscribe(value => console.log(value)) // logs undefined immediately
   *
   * // dispatch a value
   * unit.dispatch({a: {b: ['hi', 'there']}});
   * // 'hi' will get logged to the console
   *
   * // update a value on a different path
   * unit.set('c', 'other');
   * // the selector won't be triggered by this
   * ```
   *
   * @param path Property keys and indexes of the path you want to select.
   * @returns The an Observable of value at the selected property or path.
   */
  select(...path: (string | number)[]): Selection<any, this> {
    checkPath(path);
    return new Selection(this, path);
  }
}
