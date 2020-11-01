import {Observable} from 'rxjs';
import {BaseConfig} from './base';
import {UnitBase} from '../lib/abstract-unit-base';
import {BoolUnit} from '../lib/bool-unit';
import {StringUnit} from '../lib/string-unit';
import {NumUnit} from '../lib/num-unit';
import {ListUnit} from '../lib/list-unit';
import {DictUnit} from '../lib/dict-unit';
import {GenericUnit} from '../lib/generic-unit';

/**
 * @param unit The Unit being used as the source observable for creating a new Observable.
 *
 * @category Units
 */
export type UnitStreamObservableProducer<T = UnitBase<any>, R = any> = (unit: T) => Observable<R>;

/**
 * Type of {@link DictUnit}'s value, a dictionary object.
 *
 * @category Units
 */
export type DictValue<T, K extends keyof T = keyof T> = Record<K, T[K]>;

/**
 * Shared configuration options for all the Units.
 *
 * @category Units
 */
export interface SharedUnitConfig<T> {
  /**
   * A flag to control the replay behaviour of a Unit.
   * It decides whether the value should be replayed when you subscribe to the default Observable.
   *
   * @default `true`
   * @category Common
   */
  replay?: boolean;
  /**
   * Optional config option to set the cache size.
   * It can be minimum `1`, and maximum `Infinity`.
   * Otherwise, if it's not provided, or it's not valid, the default cache size `2` will be used.
   *
   * @default `2`
   * @category Units
   */
  cacheSize?: number;
  /**
   * An optional flag to make the Unit's value immutable.
   *
   * @default `false`
   * @category Units
   */
  immutable?: boolean;
  /**
   * An optional flag to make the Unit persistent, using LocalStorage or SessionStorage.
   * An id (see {@link BaseConfig.id}) is mandatory to make it work.
   *
   * @default `false`
   * @category Units
   */
  persistent?: boolean;
  /**
   * The Storage to be used for storing the value if the Unit is persistent. \
   * It can be either `LocalStorage` or `SessionStorage` or any other API,
   * that implements `Storage` API interface.
   *
   * @default {@link Configuration.storage}
   * @category Units
   */
  storage?: Storage;
  /**
   * An optional flag to disable/enable the distinct value check on the dispatched values.
   *
   * @default `false`
   * @category Units
   */
  distinctDispatchCheck?: boolean;
}

/**
 * Configuration options for all the Units.
 *
 * @category Units
 */
export interface UnitConfig<T> extends SharedUnitConfig<T> {
  /**
   * A unique id to identify a Unit.
   * It's required for a Unit to be persistent.
   *
   * @default `undefined`
   */
  id?: string;
  /**
   * The initial value for the Unit to be used instead of the default value.
   * Type T is the type of the Unit's value. i.e. boolean for BoolUnit.
   * If an `initialValue` is not provided or if its invalid, it'll be ignored,
   * and the default value of the Unit will be used instead.
   *
   * @default
   * BoolUnit: `false` \
   * NumUnit: `0` \
   * StringUnit: `''` \
   * ListUnit: `[]` \
   * DictUnit: `{}` \
   * GenericUnit: `undefined`
   * @category Units
   */
  initialValue?: T;
  /**
   * An optional custom check function, if provided, can allow or disallow values from getting through dispatch.
   *
   * @default `undefined`
   * @category Units
   */
  customDispatchCheck?: (currentValue: T, nextValue: T) => boolean;
  /**
   * Set it to `true` to debounce the dispatch method.
   * If set it to `true` the default wait-time is 200ms,
   * otherwise you can pass a `number` as wait-time, which is in ms.
   *
   * @default `false`
   * @category Units
   */
  dispatchDebounce?: boolean | number;
  /**
   * If the dispatchDebounce is enabled, the debounce mode determines on which edge of the wait-time, the call passes through.
   * In a debounce wait-time span,
   * START means only the first call to dispatch gets through.
   * END means only the last call to dispatch gets through.
   * BOTH means both, the first and last dispatch calls get through.
   * The default is `END`.
   *
   * @default `END`
   * @category Units
   */
  dispatchDebounceMode?: 'START' | 'END' | 'BOTH';
}

/**
 * Union type of all the Units.
 *
 * @category Units
 */
export type Unit =
  | BoolUnit
  | StringUnit
  | NumUnit
  | ListUnit<any>
  | DictUnit<any>
  | GenericUnit<any>;

/**
 * @internal please do not use.
 */
export type UnitToValueType<T extends Unit> = T extends NumUnit
  ? number
  : T extends StringUnit
  ? string
  : T extends BoolUnit
  ? boolean
  : T extends GenericUnit<infer X> | DictUnit<infer X> | ListUnit<infer X>
  ? X
  : never;

/**
 * @internal please do not use.
 */
// tslint:disable-next-line:ban-types
export type ValueToUnitType<T> = [T] extends [null | undefined | Function]
  ? GenericUnit<any>
  : T extends boolean
  ? BoolUnit
  : T extends number
  ? NumUnit
  : T extends string
  ? StringUnit
  : T extends any[]
  ? ListUnit<T>
  : T extends DictValue<T>
  ? DictUnit<T>
  : Unit;
