import {Observable, Subject} from 'rxjs';
import {Configuration} from './configuration';
import {UnitBase} from './abstract-unit-base';
import {NonPrimitiveUnitBase} from './abstract-non-primitive-unit-base';
import {isDict, isObject, isValidKey, IteratorSymbol, makeNonEnumerable} from '../utils/funcs';
import {
  DictUnitEvents,
  DictValue,
  EventDictUnitAssign,
  EventDictUnitDelete,
  EventDictUnitSet,
  KOf,
  UnitConfig,
} from '../models';

/**
 * DictUnit is a reactive storage Unit that is loosely based on `Map`.
 *
 * It only accepts plain dictionary `object` as its value.
 * It ensures that at any point of time the value would always be a dictionary `object`.
 *
 * Learn more about Units [here](https://docs.activejs.dev/fundamentals/units). \
 * Learn more about DictUnit [here](https://docs.activejs.dev/fundamentals/units/dictunit).
 *
 * Just like every other Non-Primitive ActiveJS Unit:
 * - DictUnit extends {@link NonPrimitiveUnitBase}
 * - Which further extends {@link UnitBase}, {@link Base} and `Observable`
 *
 * @category 1. Units
 */
export class DictUnit<
  T extends DictValue<T>,
  K extends keyof T = keyof T,
  V extends T[K] = T[K]
> extends NonPrimitiveUnitBase<T> {
  /**
   * @internal please do not use.
   */
  protected readonly eventsSubject: Subject<DictUnitEvents<T>>;
  /**
   * On-demand observable events.
   */
  readonly events$: Observable<DictUnitEvents<T>>;

  /**
   * The length of keys of the properties in the dictionary {@link value}.
   */
  get length(): number {
    return this.objectKeys().length;
  }

  /**
   * Indicates whether the length of the keys of the properties in the dictionary {@link value} is 0 or not.
   */
  get isEmpty(): boolean {
    return this.length === 0;
  }

  /**
   * @internal please do not use.
   */
  protected defaultValue(): T {
    return {} as T;
  }

  constructor(config?: UnitConfig<T>) {
    super({
      ...(Configuration.DICT_UNIT as UnitConfig<T>),
      ...config,
    });

    makeNonEnumerable(this);
  }

  /**
   * Extends {@link UnitBase.wouldDispatch} and adds additional check for Object dictionary {@link isDict},
   * which cannot be bypassed even by using {@link force}.
   *
   * @param value The value to be dispatched.
   * @param force Whether dispatch-checks should be bypassed or not.
   * @returns A boolean indicating whether the param `value` would pass the dispatch-checks if dispatched.
   *
   * @category Common Units
   */
  wouldDispatch(value: T, force?: boolean): boolean {
    return this.isValidValue(value) && super.wouldDispatch(value, force);
  }

  /**
   * Adds a property by setting given property-value on the given key in the dictionary {@link value}. \
   * Also, dispatches it as new dictionary, without mutating the current {@link value}.
   *
   * It only works if the Unit is not frozen and the `key` is either `string` or `number`.
   *
   * @param key The name of the property.
   * @param value The property-value.
   *
   * @triggers {@link EventDictUnitSet}
   * @category Custom DictUnit
   */
  set<k extends K>(key: k, value: T[k]): void {
    if (this.isFrozen || !isValidKey(key)) {
      return;
    }
    this.checkSerializabilityMaybe(value);

    const dictShallowCopy = {...this.rawValue()};
    dictShallowCopy[key] = this.deepCopyMaybe(value);
    this.updateValueAndCache(dictShallowCopy);

    if (this.eventsSubject && !this.isMuted) {
      this.eventsSubject.next(new EventDictUnitSet(key, value));
    }
  }

  /**
   * Deletes properties with given keys from the dictionary value. See {@link value}. \
   * Deletion is performed on a copy of the value, which is then dispatched, without mutating the current value.
   *
   * It only works if the Unit is not frozen, and the value is not empty, \
   * and at least one of the passed keys exist in the value.
   * ie: at least 1 key value pair exists in the dictionary.
   *
   * @param keys The names of the properties to be removed.
   * @returns The removed properties or an empty `object-literal`.
   *
   * @triggers {@link EventDictUnitDelete}
   * @category Custom DictUnit
   */
  delete<k extends K>(...keys: k[]): {[key in k]: T[k]} {
    keys = keys.filter(key => this.has(key));
    if (this.isFrozen || this.isEmpty || !keys.length) {
      return {} as any;
    }

    const dictShallowCopy: T = {...this.rawValue()};
    const removedProps: {[key in k]: T[k]} = {} as any;

    keys.forEach(key => {
      removedProps[key] = this.deepCopyMaybe(dictShallowCopy[key]);
      delete dictShallowCopy[key];
    });

    this.updateValueAndCache(dictShallowCopy);

    if (this.eventsSubject && !this.isMuted) {
      this.eventsSubject.next(new EventDictUnitDelete(removedProps));
    }
    return removedProps;
  }

  /**
   * Deletes properties from the dictionary {@link value} where the predicate returns `true`. \
   * Also, dispatches it as new dictionary, without mutating the current {@link value}.
   *
   * It only works if the Unit is not frozen, and
   * the predicate is a function, and the dictionary is not empty.
   *
   * @param predicate A callback function that gets called for every property in the dictionary
   * with the property-value and key as arguments.
   * @returns The removed properties, or an empty `object-literal`.
   *
   * @triggers {@link EventDictUnitDelete}
   * @category Custom DictUnit
   */
  deleteIf(predicate: (value: V, key: K, index: number) => boolean): T {
    if (this.isFrozen || typeof predicate !== 'function' || this.isEmpty) {
      return {} as any;
    }

    const dictShallowCopy = {...this.rawValue()};
    const removedProps: T = {} as any;

    (Object.keys(dictShallowCopy) as K[]).forEach((key: K, index) => {
      if (predicate(this.deepCopyMaybe(dictShallowCopy[key]), key, index)) {
        removedProps[key] = dictShallowCopy[key];
        delete dictShallowCopy[key];
      }
    });

    this.updateValueAndCache(dictShallowCopy);

    if (this.eventsSubject && !this.isMuted) {
      this.eventsSubject.next(new EventDictUnitDelete(removedProps));
    }
    return removedProps;
  }

  /**
   * Copy the values of all the enumerable own properties from one or more source objects to the dictionary. \
   * Also, dispatches it as new dictionary, without mutating the current {@link value}.
   *
   * It only works if the Unit is not frozen, and at least 1 source is provided, and it is a non-null object.
   * eg: `array`, `object`
   *
   * @param sources The source objects from which to copy properties.
   *
   * @triggers {@link EventDictUnitAssign}
   * @category Custom DictUnit
   */
  assign(...sources: T[]): void {
    sources = sources.filter(isObject);
    if (this.isFrozen || !sources.length) {
      return;
    }
    this.checkSerializabilityMaybe(sources);

    const dictShallowCopy = {...this.rawValue()};
    const newProps = Object.assign({}, ...sources);
    this.updateValueAndCache(Object.assign(dictShallowCopy, this.deepCopyMaybe(newProps)));

    if (this.eventsSubject && !this.isMuted) {
      this.eventsSubject.next(new EventDictUnitAssign(sources, newProps));
    }
  }

  /**
   * Returns the value of the property with the name equal to the given key in the dictionary {@link value}.
   *
   * It only returns own-properties, e.g.: key 'toString' would return `undefined`.
   *
   * @param key The name of the property.
   *
   * @category Custom DictUnit
   */
  get<k extends K>(key: k): T[k] | undefined {
    return this.hasOwnProperty(key) ? this.deepCopyMaybe(this.rawValue()[key]) : undefined;
  }

  /**
   * Returns whether a property with the given key exists in the dictionary {@link value}.
   *
   * @param key The name of the property.
   *
   * @category Custom DictUnit
   */
  has<k extends K>(key: k): boolean {
    return this.hasOwnProperty(key);
  }

  /**
   * Finds direct properties of the dictionary that have a direct child property
   * that matches with `key` and `value` passed as params.
   *
   * @example
   * ```ts
   * const initialValue = {'first': {b: 1}, 'second': {b: 1, b2: 2}, 'third': {c: 1}, 'fourth': {b: null}};
   * const dict = new DictUnit({initialValue});
   * const itemsFound = dict.findByProp('b', 1);
   * console.log(itemsFound); // logs [['first', {b: 1}], ['second', {b: 1, b2: 2}]]
   * ```
   *
   * @param key The key of the property whose value needs to be matched against param `value`.
   * @param value A primitive value that will be matched against every item's prop-value using equality operator.
   * @param strictEquality A flag governing whether the value be matched using `===` or `==` operator.
   * Default is `true`, ie: strict equality `===`. Pass `false` to use `==` instead.
   * @returns An `array` of key/values of the matched properties, an empty `array` otherwise.
   *
   * @category Custom DictUnit
   */
  findByProp<k extends KOf<V>>(
    key: k,
    value: string | number | boolean,
    strictEquality = true
  ): [K, V][] {
    if (this.isEmpty) {
      return [];
    }

    return this.deepCopyMaybe(
      (Object.entries<V>(this.rawValue()) as [K, V][]).filter(
        ([propKey, prop]) =>
          isObject(prop) &&
          (strictEquality === false
            ? // tslint:disable-next-line:triple-equals
              prop[key as string | number] == value
            : prop[key as string | number] === value)
      )
    );
  }

  /**
   * Performs the specified action for each property in the object value. See {@link value}. \
   * It's a drop-in replacement for the `forEach` method.
   *
   * @param callbackFn A function that accepts up to two arguments.
   * forEvery calls the callbackFn function one time for each property in the object value.
   * @param thisArg An object to which this keyword can refer in the callbackFn function.
   * If thisArg is omitted, undefined is used as this value.
   *
   * @category Custom DictUnit
   */
  forEvery(
    callbackFn: (value: V, key: K, index: number, entries: [K, V][]) => void,
    thisArg?: any
  ): void {
    this.objectEntries().forEach(([key, value], i, valueEntries) =>
      callbackFn.call(thisArg, value, key, i, valueEntries)
    );
  }

  /** Iterator */
  [Symbol.iterator](): Iterator<[string, V]>;
  /**
   * @internal please do not use.
   */
  [IteratorSymbol](): Iterator<[string, V]> {
    let index = 0;
    const items: [string, V][] = this.objectEntries();
    const length: number = items.length;

    return {
      next(): IteratorResult<[string, V]> {
        return {value: items[index++], done: index > length};
      },
    };
  }

  /**
   * @internal please do not use.
   */
  protected isValidValue(value: any): boolean {
    return isDict(value);
  }
}
