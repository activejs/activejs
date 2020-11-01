import {DictValue} from './units';
import {ClearCacheOptions, DispatchOptions} from './operations';

/**
 * The common events that every fundamental ActiveJS construct (Units, Systems, Action and Cluster) emits.
 * @event
 * @category Common
 */
export type BaseEvents<T> = EventReplay<T>;

/**
 * The common events that are emitted by all the Units.
 * @event
 * @category Common Units
 */
export type UnitEvents<T> =
  | BaseEvents<T>
  | EventUnitDispatch<T>
  | EventUnitDispatchFail<T>
  | EventUnitUnmute
  | EventUnitFreeze
  | EventUnitUnfreeze
  | EventUnitJump
  | EventUnitClearCache
  | EventUnitClearValue
  | EventUnitClear
  | EventUnitResetValue
  | EventUnitReset
  | EventUnitClearPersistedValue;

/**
 * The events that are triggered by a DictUnit.
 * @event
 * @category DictUnit
 */
export type DictUnitEvents<
  T extends DictValue<any>,
  K extends keyof T = keyof T,
  V extends T[K] = T[K]
> = UnitEvents<T> | EventDictUnitSet<K, V> | EventDictUnitDelete<T> | EventDictUnitAssign<T>;

/**
 * The events that are emitted by a ListUnit.
 * @event
 * @category ListUnit
 */
export type ListUnitEvents<Item> =
  | UnitEvents<Item[]>
  | EventListUnitSet<Item>
  | EventListUnitPop<Item>
  | EventListUnitPush<Item>
  | EventListUnitShift<Item>
  | EventListUnitUnshift<Item>
  | EventListUnitDelete<Item>
  | EventListUnitRemove<Item>
  | EventListUnitSplice<Item>
  | EventListUnitFill<Item>
  | EventListUnitCopyWithin<Item>
  | EventListUnitReverse
  | EventListUnitSort;

// ____________________________ Common Events ____________________________ //
// _______________________________________________________________________ //

/**
 * An event that gets emitted on successful replay by using the `replay` method.
 * @event
 * @category Common
 */
export class EventReplay<T> {
  /**
   * @param value The current value that got replayed.
   */
  constructor(public value: T) {}
}

// _________________________ Common Units Events _________________________ //
// _______________________________________________________________________ //

/**
 * An event that gets emitted on successful dispatch by using the Units' `dispatch` method.
 * @event
 * @category Common Units
 */
export class EventUnitDispatch<T> {
  /**
   * @param value The value that was passed to the dispatch method.
   * @param options The options that were passed to the dispatch method.
   */
  constructor(public value: T, public options?: DispatchOptions) {}
}

/**
 * All the reasons for why a Unit dispatch might fail.
 */
export enum DispatchFailReason {
  /**
   * The first reason, if the Unit is frozen.
   */
  FROZEN_UNIT = 'FROZEN_UNIT',
  /**
   * The second reason, if the dispatched value is invalid.
   */
  INVALID_VALUE = 'INVALID_VALUE',
  /**
   * The third reason, if {@link UnitConfig.customDispatchCheck} returns a `falsy` value.
   */
  CUSTOM_DISPATCH_CHECK = 'CUSTOM_DISPATCH_CHECK',
  /**
   * The fourth reason, if {@link UnitConfig.distinctDispatchCheck} is not `false` and the dispatched value is same as current value.
   */
  DISTINCT_CHECK = 'DISTINCT_CHECK',
}

/**
 * An event that gets emitted on failed dispatch using the Units' `dispatch` method.
 * @event
 * @category Common Units
 */
export class EventUnitDispatchFail<T> {
  /**
   * @param value The value that was passed to the dispatch method.
   * @param reason The reason for why the dispatch failed.
   * @param options The options that were passed to the dispatch method.
   */
  constructor(
    public value: T,
    public reason: DispatchFailReason,
    public options?: DispatchOptions
  ) {}
}

/**
 * An event that gets emitted on successful unmute using the Units' `unmute` method.
 * @event
 * @category Common Units
 */
export class EventUnitUnmute {}

/**
 * An event that gets emitted when a Unit gets frozen.
 * @event
 * @category Common Units
 */
export class EventUnitFreeze {}

/**
 * An event that gets emitted when a Unit gets unfrozen after being frozen.
 * @event
 * @category Common Units
 */
export class EventUnitUnfreeze {}

/**
 * An event that gets emitted on successful cache-navigation,
 * using the Units' several cache-navigation methods like `goBack`, `goForward`, `jump`, etc.
 * @event
 * @category Common Units
 */
export class EventUnitJump {
  /**
   * @param steps The number of steps jumped represented as a number,
   * positive for forward navigation and negative for backwards.
   * @param newCacheIndex The new `cacheIndex` of the emitted value.
   */
  constructor(public steps: number, public newCacheIndex: number) {}
}

/**
 * An event that gets emitted on successful execution of Units' `clearCache` method.
 * @event
 * @category Common Units
 */
export class EventUnitClearCache {
  /**
   * @param options The options that were directly or indirectly passed to the `clearCache` method.
   */
  constructor(public options?: ClearCacheOptions) {}
}

/**
 * An event that gets emitted on successful execution of Units' `clearValue` method.
 * @event
 * @category Common Units
 */
export class EventUnitClearValue {}

/**
 * An event that gets emitted on successful execution of Units' `clear` method.
 * @event
 * @category Common Units
 */
export class EventUnitClear {
  /**
   * @param options The options that were passed for the implicitly called `clearCache` method.
   */
  constructor(public options?: ClearCacheOptions) {}
}

/**
 * An event that gets emitted on successful execution of Units' `resetValue` method.
 * @event
 * @category Common Units
 */
export class EventUnitResetValue {}

/**
 * An event that gets emitted on successful execution of Units' `reset` method.
 * @event
 * @category Common Units
 */
export class EventUnitReset {
  /**
   * @param options The options that were passed for the implicitly called `clearCache` method.
   */
  constructor(public options?: ClearCacheOptions) {}
}

/**
 * An event that gets emitted on successful execution of Units' `clearPersistentValue` method.
 * @event
 * @category Common Units
 */
export class EventUnitClearPersistedValue {}

// ____________________________ DictUnit Events ____________________________ //
// _________________________________________________________________________ //

/**
 * An event that gets emitted on successful execution of DictUnit's `set` method.
 * @event
 * @category DictUnit
 */
export class EventDictUnitSet<K, V> {
  /**
   * @param key The name of the property that was passed to the `set` method.
   * @param value The value of the property that was passed to the `set` method.
   */
  constructor(public key: K, public value: V) {}
}

/**
 * An event that gets emitted on successful execution of DictUnit's `assign` method.
 * @event
 * @category DictUnit
 */
export class EventDictUnitAssign<T> {
  /**
   * @param sources The source objects that were passed to the `assign` method.
   * @param newProps The new properties that finally got added to the DictUnit's value.
   */
  constructor(public sources: T[], public newProps: T) {}
}

/**
 * An event that gets emitted on successful execution of DictUnit's `delete` or `deleteIf` method.
 * @event
 * @category DictUnit
 */
export class EventDictUnitDelete<T> {
  /**
   * @param deletedProps The properties that were deleted by the `delete` or `deleteIf` method.
   */
  constructor(public deletedProps: T) {}
}

// ____________________________ ListUnit Events ____________________________ //
// _________________________________________________________________________ //

/**
 * An event that gets emitted on successful execution of ListUnit's `set` method.
 * @event
 * @category ListUnit
 */
export class EventListUnitSet<Item> {
  /**
   * @param index The index for the item passed to the `set` method.
   * @param item The item passed to the `set` method.
   */
  constructor(public index: number, public item: Item) {}
}

/**
 * An event that gets emitted on successful execution of ListUnit's `pop` method.
 * @event
 * @category ListUnit
 */
export class EventListUnitPop<Item> {
  /**
   * @param item The item that got popped from the ListUnit's value.
   */
  constructor(public item: Item) {}
}

/**
 * An event that gets emitted on successful execution of ListUnit's `push` method.
 * @event
 * @category ListUnit
 */
export class EventListUnitPush<Item> {
  /**
   * @param items The items that were passed to the `push` method.
   */
  constructor(public items: Item[]) {}
}

/**
 * An event that gets emitted on successful execution of ListUnit's `shift` method.
 * @event
 * @category ListUnit
 */
export class EventListUnitShift<Item> {
  /**
   * @param item The item that got shifted out.
   */
  constructor(public item: Item) {}
}

/**
 * An event that gets emitted on successful execution of ListUnit's `unshift` method.
 * @event
 * @category ListUnit
 */
export class EventListUnitUnshift<Item> {
  /**
   * @param items The items that were passed to the `unshift` method.
   */
  constructor(public items: Item[]) {}
}

/**
 * An event that gets emitted on successful execution of ListUnit's `delete` or `deleteIf` method.
 * @event
 * @category ListUnit
 */
export class EventListUnitDelete<Item> {
  /**
   * @param indices The indices that were passed to the `delete` method explicitly,
   * or implicitly by `deleteIf` method.
   * @param deletedItems The items that got deleted from the ListUnit's value.
   */
  constructor(public indices: number[], public deletedItems: Item[]) {}
}

/**
 * An event that gets emitted on successful execution of ListUnit's `remove` or `removeIf` method.
 * @event
 * @category ListUnit
 */
export class EventListUnitRemove<Item> {
  /**
   * @param indices The indices that were passed to the `remove` method explicitly,
   * or implicitly by `removeIf` method.
   * @param removedItems The items that got removed from the ListUnit's value.
   */
  constructor(public indices: number[], public removedItems: Item[]) {}
}

/**
 * An event that gets emitted on successful execution of ListUnit's `splice` or `insert` method.
 * @event
 * @category ListUnit
 */
export class EventListUnitSplice<Item> {
  /**
   * @param start The zero-based location that was passed to the `splice` method.
   * @param deleteCount The number of items that were to be removed.
   * @param removedItems The items that got removed.
   * @param addedItems The items that were passed as `items` to be added.
   */
  constructor(
    public start: number,
    public deleteCount: number,
    public removedItems: Item[],
    public addedItems: Item[]
  ) {}
}

/**
 * An event that gets emitted on successful execution of ListUnit's `fill` method.
 * @event
 * @category ListUnit
 */
export class EventListUnitFill<Item> {
  /**
   * @param item The item that was passed to the `fill` method.
   * @param start The starting position where the filling started.
   * @param end The last position where the filling stopped.
   */
  constructor(public item: Item, public start?: number, public end?: number) {}
}

/**
 * An event that gets emitted on successful execution of ListUnit's `copyWithin` method.
 * @event
 * @category ListUnit
 */
export class EventListUnitCopyWithin<Item> {
  /**
   * @param target The target position from where the copied section starts replacing.
   * @param start The starting position of the copied section.
   * @param end The ending position of the copied section.
   */
  constructor(public target: number, public start: number, public end?: number) {}
}

/**
 * An event that gets emitted on successful execution of ListUnit's `reverse` method.
 * @event
 * @category ListUnit
 */
export class EventListUnitReverse {}

/**
 * An event that gets emitted on successful execution of ListUnit's `sort` method.
 * @event
 * @category ListUnit
 */
export class EventListUnitSort {}
