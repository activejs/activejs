import {Observable, Subject} from 'rxjs';
import {
  ClearCacheOptions,
  DispatchFailReason,
  DispatchOptions,
  DispatchValueProducer,
  EventUnitClear,
  EventUnitClearCache,
  EventUnitClearPersistedValue,
  EventUnitClearValue,
  EventUnitDispatch,
  EventUnitDispatchFail,
  EventUnitFreeze,
  EventUnitJump,
  EventUnitReset,
  EventUnitResetValue,
  EventUnitUnfreeze,
  EventUnitUnmute,
  UnitConfig,
  UnitEvents,
  UnitStreamObservableProducer,
} from '../models';
import {Base} from './abstract-base';
import {Configuration} from './configuration';
import {Stream} from './stream';
import {remove, retrieve, save} from './persistence';
import {debounce, deepCopy, deepFreeze, isNumber} from '../utils/funcs';
import {checkSerializability} from '../checks/common';

/**
 * UnitBase serves as the base for all the ActiveJS Units: GenericUnit, BoolUnit, ListUnit, etc.
 * It extends {@link Base}.
 *
 * This is an internal construct, normally you'd never have to use this class directly.
 * However, if you're just reading the documentation, or want to learn more about how ActiveJS works,
 * or want to extend this class to build something on your own, please continue.
 *
 * UnitBase creates the foundation of all the ActiveJS Units.
 * It implements the features like:
 * - dispatching, clearing and resetting the value
 * - caching the dispatched values
 * - navigating through the cached values, by methods like goBack, goForward, jump etc.
 * - observable events to listen to including but not limited to the above mentioned actions
 * - freezing/unfreezing the Unit
 * - muting/unmuting the Unit
 * - persisting and retrieving the value to/from persistent-storage
 * - debouncing the dispatch
 * - resetting the Unit
 * - etc.
 *
 * @category 2. Abstract
 */
export abstract class UnitBase<T> extends Base<T> {
  /**
   * Configured options.
   * Combination of global-options {@link GlobalUnitConfig} and the options passed on instantiation.
   */
  readonly config: Readonly<UnitConfig<T>>;

  // tslint:disable:variable-name

  /**
   * @internal please do not use.
   */
  protected readonly eventsSubject: Subject<UnitEvents<T>>;
  /**
   * On-demand observable events.
   */
  readonly events$: Observable<UnitEvents<T>>;

  /**
   * @internal please do not use.
   */
  private _isFrozen = false;

  /**
   * Indicates whether the Unit is frozen or not.
   * See {@link freeze} for more details.
   *
   * Note: It's not the same as [Object.isFrozen](https://cutt.ly/WyFdzPD).
   */
  get isFrozen(): boolean {
    return this._isFrozen;
  }

  /**
   * @internal please do not use.
   */
  private emitOnUnmute: boolean;

  /**
   * @internal please do not use.
   */
  private _isMuted = false;

  /**
   * Indicates whether the Unit is muted or not.
   * See {@link mute} for more details.
   */
  get isMuted(): boolean {
    return this._isMuted;
  }

  /**
   * Indicates whether the value is undefined or not.
   *
   * It should be preferred if the Unit is configured to be immutable, as it doesn't create a copy.
   */
  get isEmpty(): boolean {
    return this.rawValue() === this.defaultValue();
  }

  /**
   * Size of the cache, dictating how many values can be cached at a given time.
   *
   * @default `2`
   * @minimum `1`
   * @maximum `Infinity`
   */
  readonly cacheSize: number;

  /**
   * @internal please do not use.
   */
  protected readonly _cachedValues: T[] = [];

  /**
   * Count of all the cached values.
   */
  get cachedValuesCount(): number {
    return this._cachedValues.length;
  }

  /**
   * @internal please do not use.
   */
  private _cacheIndex = 0;

  /**
   * Index of the current {@link value} in the {@link UnitBase.cachedValues}
   */
  get cacheIndex(): number {
    return this._cacheIndex;
  }

  /**
   * @internal please do not use.
   */
  private _initialValue: T = undefined;

  /**
   * @internal please do not use.
   */
  protected _value: T;

  /**
   * The initialValue provided on instantiation.
   * Creates a copy if the Unit is configured to be immutable.
   *
   * @category Access Value
   */
  initialValue(): T {
    return this.deepCopyMaybe(this.initialValueRaw());
  }

  /**
   * Current value of the Unit.
   * Creates a copy if the Unit is configured to be immutable.
   *
   * @default
   * BoolUnit: `false` \
   * NumUnit: `0` \
   * StringUnit: `''` \
   * ListUnit: `[]` \
   * DictUnit: `{}` \
   * GenericUnit: `undefined`
   *
   * @category Access Value
   */
  value(): T {
    return this.deepCopyMaybe(this.rawValue()); // apply the fallback and kill reference
  }

  /**
   * If the Unit has a non-primitive value,
   * use it to get access to the current {@link value}, without creating a deep-copy.
   *
   * This can come in handy if the Unit is configured to be immutable, and you want to perform a non-mutating action
   * without creating a deep-copy of the value.
   *
   * @category Access Value
   */
  rawValue(): T {
    return this.applyFallbackValue(this._value);
  }

  /**
   * All the cached values.
   * Creates a copy if the Unit is configured to be immutable.
   *
   * @category Access Value
   */
  cachedValues(): T[] {
    return this._cachedValues.map(value => this.deepCopyMaybe(value));
  }

  /**
   * @internal please do not use.
   */
  private initialValueRaw(): T {
    return this.applyFallbackValue(this._initialValue);
  }

  /**
   * @internal please do not use.
   */
  protected defaultValue(): T {
    return undefined;
  }

  // tslint:enable:variable-name

  /**
   * @internal please do not use.
   */
  protected constructor(config?: UnitConfig<T>) {
    super({
      ...Configuration.UNITS,
      ...config,
    });

    const {
      cacheSize,
      initialValue,
      dispatchDebounce,
      dispatchDebounceMode,
      persistent,
    }: UnitConfig<T> = this.config;

    this.cacheSize = isNumber(cacheSize) ? Math.max(1, cacheSize) : 2; // min 1, default 2

    if (persistent === true) {
      this.restoreValueFromPersistentStorage(initialValue);
    } else {
      this.checkSerializabilityMaybe(initialValue);
      this.dispatchInitialValue(this.deepCopyMaybe(initialValue));
    }

    if (dispatchDebounce === true || isNumber(dispatchDebounce)) {
      this.dispatchMiddleware = debounce(
        this.dispatchMiddleware.bind(this),
        dispatchDebounce as number,
        dispatchDebounceMode
      );
    }
  }

  /**
   * A helper method that creates a stream by subscribing to the Observable returned by the param `observableProducer` callback.
   *
   * Ideally the callback function creates an Observable by applying `Observable.pipe`.
   *
   * Just know that you should catch the error in a sub-pipe (ie: do not let it propagate to the main-pipe), otherwise
   * as usual the stream will stop working, and will not react on any further emissions.
   *
   * @param observableProducer A callback function that should return an Observable.
   *
   * @category Common
   */
  createStream<R>(observableProducer: UnitStreamObservableProducer<this, R>): Stream {
    const observable = observableProducer(this);

    return new Stream(observable);
  }

  /**
   * Given a value, this function determines whether it should be dispatched or not. \
   * The dispatch is denied in following circumstances:
   * - If the Unit is frozen. {@link isFrozen}
   * - If {@link UnitConfig.distinctDispatchCheck} is set to `true`, and the new-value === current-value,
   * - If {@link UnitConfig.customDispatchCheck} returns a `falsy` value.
   *
   * If the Unit is not frozen, you can bypass other dispatch-checks by passing param `force = true`.
   *
   * This function is used internally, when a value is dispatched {@link dispatch}. \
   * Even initialValue {@link UnitConfig.initialValue} dispatch has to pass this check.
   *
   * You can also use it to check if the value will be dispatched or not before dispatching it.
   *
   * @param value The value to be dispatched.
   * @param force Whether dispatch-checks should be bypassed or not.
   * @returns A boolean indicating whether the param `value` would pass the dispatch-checks if dispatched.
   *
   * @category Common Units
   */
  wouldDispatch(value: T, force = false): boolean {
    if (this.isFrozen) {
      return false;
    }
    if (force === true) {
      return true;
    }
    if (
      typeof this.config.customDispatchCheck === 'function' &&
      !this.config.customDispatchCheck(this.rawValue(), value)
    ) {
      return false;
    }
    return this.distinctCheck(value);
  }

  dispatch(value: T, options?: DispatchOptions): boolean | undefined;

  dispatch(
    // tslint:disable-next-line:unified-signatures
    valueProducer: DispatchValueProducer<T>,
    options?: DispatchOptions
  ): boolean | undefined;

  /**
   * Method to dispatch new value by passing the value directly, or \
   * by passing a value-producer-function that produces the value using the current {@link value}.
   *
   * Given a value, it either gets dispatched if it's allowed by {@link wouldDispatch}, \
   * or it gets ignored if not allowed.
   *
   * If the Unit is not configured to be immutable, then \
   * the value-producer-function (param `valueOrProducer`) should not mutate the current {@link value}, \
   * which is provided as an argument to the function.
   *
   * If you mutate the value, then the cached-value might also get mutated, \
   * as the cached-value is saved by reference, which can result in unpredictable state.
   *
   * @param valueOrProducer A new-value, or a pure function that produces a new-value.
   * @param options Dispatch options.
   * @returns `true` if value got dispatched, otherwise `false`.
   * If {@link UnitConfig.dispatchDebounce} is enabled, then it'll return `undefined`.
   *
   * @triggers {@link EventUnitDispatch}, or {@link EventUnitDispatchFail}, depending on the success of dispatch.
   * @category Common Action/Units
   */
  dispatch(
    valueOrProducer: DispatchValueProducer<T> | T,
    options?: DispatchOptions
  ): boolean | undefined {
    if (options?.bypassDebounce === true) {
      return this.dispatchActual(valueOrProducer, options);
    }
    return this.dispatchMiddleware(valueOrProducer, options);
  }

  /**
   * To manually re-emit the last emitted value again. \
   * It doesn't work if the Unit is frozen {@link isFrozen} or muted {@link isMuted}.
   *
   * Note: Even if the Unit is immutable, it does not create a copy of the Unit's value,
   * it merely re-emits the last emitted value.
   *
   * @returns `true` if replayed successfully, otherwise `false`.
   *
   * @triggers {@link EventReplay}
   * @category Common
   */
  replay(): boolean {
    if (this.isFrozen || this.isMuted) {
      return false;
    }

    super.replay();
    return true;
  }

  /**
   * Go back in the cache and re-emit the previous value from the cache, \
   * without creating a new entry in the cache.
   *
   * It can be used as Undo.
   *
   * It doesn't work if the Unit is frozen {@link isFrozen}.
   * It only works if there's a previously dispatched value in the cache. \
   * ie: the {@link cacheIndex} is not 0
   *
   * @returns `true` if the cache-navigation was successful, otherwise `false`.
   *
   * @triggers {@link EventUnitJump}
   * @category Cache Navigation
   */
  goBack(): boolean {
    return this.jump(-1);
  }

  /**
   * After going back in the cache (ie: re-emitting an old value from the cache), \
   * use this method to go to the next value, without creating a new entry in the cache.
   *
   * It can be used as Redo.
   *
   * It doesn't work if the Unit is frozen {@link isFrozen}.
   * It only works if the current {@link value} is not the last value in the cache. \
   * ie: the {@link cacheIndex} is not equal to `cachedValuesCount - 1`
   *
   * @returns `true` if the cache-navigation was successful, otherwise `false`
   *
   * @triggers {@link EventUnitJump}
   * @category Cache Navigation
   */
  goForward(): boolean {
    return this.jump(1);
  }

  /**
   * Use this method to re-emit the first value in the cache, \
   * without creating a new entry in the cache.
   *
   * It doesn't work if the Unit is frozen {@link isFrozen}.
   * It only works if the {@link cacheIndex} is not already at the last value in the cache. \
   * ie: the {@link cacheIndex} is not 0.
   *
   * @returns `true` if the cache-navigation was successful, otherwise `false`
   *
   * @triggers {@link EventUnitJump}
   * @category Cache Navigation
   */
  jumpToStart(): boolean {
    return this.jump(-this.cacheIndex);
  }

  /**
   * After going back in the cache (ie: re-emitting an old value from the cache), \
   * use this method to re-dispatch the last (latest) value in the cache, \
   * without creating a new entry in the cache.
   *
   * It doesn't work if the Unit is frozen {@link isFrozen}.
   * It only works if the {@link cacheIndex} is not already at the last value in the cache.
   *
   * @returns `true` if the cache-navigation was successful, otherwise `false`
   *
   * @triggers {@link EventUnitJump}
   * @category Cache Navigation
   */
  jumpToEnd(): boolean {
    return this.jump(this.cachedValuesCount - 1 - this.cacheIndex);
  }

  /**
   * Use this method to re-emit a value from the cache, by jumping specific steps backwards or forwards, \
   * without creating a new entry in the cache.
   *
   * It doesn't work if the Unit is frozen {@link isFrozen} or `steps` is not a `number`.
   * It only works if the new calculated index is in the bounds of {@link cachedValues}, \
   * ie: the new-index is >= 0, and less than {@link cachedValuesCount}, but \
   * not equal to current {@link cacheIndex}.
   *
   * @param steps Number of steps to jump in the cache, negative to jump backwards, positive to jump forwards
   * @returns `true` if the cache-navigation was successful, otherwise `false`.
   *
   * @triggers {@link EventUnitJump}
   * @category Cache Navigation
   */
  jump(steps: number): boolean {
    if (this.isFrozen || !isNumber(steps)) {
      return false;
    }

    const newIndex = this.cacheIndex + steps;

    // no point going forward
    if (newIndex < 0 || newIndex === this.cacheIndex || newIndex > this.cachedValuesCount - 1) {
      return false;
    }

    this._cacheIndex = newIndex;
    this.updateValueAndCache(this._cachedValues[this.cacheIndex], null, true);

    if (this.eventsSubject && !this.isMuted) {
      this.eventsSubject.next(new EventUnitJump(steps, newIndex));
    }
    return true;
  }

  /**
   * Get cached value at a given index.
   *
   * @param index The index of cached value
   * @returns The cached value if it exists, otherwise undefined
   *
   * @category Common Units
   */
  getCachedValue(index: number): T | undefined {
    return this._cachedValues.hasOwnProperty(index)
      ? this.deepCopyMaybe(this._cachedValues[index])
      : undefined;
  }

  /**
   * Clears the cached values, current {@link value} stays intact, but it gets removed from the cache. \
   * Meaning, if you dispatch a new value you can't {@link goBack}. \
   * To keep the last value in the cache, pass `{leaveLast: true}` in the param `options`.
   *
   * It only works if the Unit is not frozen and there's something left to clear after evaluating the param `options`.
   *
   * Similar to preserving the last value, you can preserve the first value by passing `{leaveFirst: true}`.
   * Or preserve both first and last value by passing both options together.
   *
   * @param options Clear cache options
   * @returns `true` if the cache was cleared, otherwise `false`
   *
   * @triggers {@link EventUnitClearCache}
   * @category Common Units
   */
  clearCache(options?: ClearCacheOptions): boolean {
    const leaveFirst: boolean = options?.leaveFirst === true;
    const leaveLast: boolean = options?.leaveLast === true;

    if (
      this.isFrozen ||
      this.cachedValuesCount === 0 ||
      (this.cachedValuesCount === 1 && (leaveFirst || leaveLast)) ||
      (this.cachedValuesCount === 2 && leaveFirst && leaveLast)
    ) {
      return false;
    }
    const start = leaveFirst ? 1 : 0;
    const deleteCount = this.cachedValuesCount - start - (leaveLast ? 1 : 0);
    this._cachedValues.splice(start, deleteCount);
    this._cacheIndex = Math.max(0, this.cachedValuesCount - 1);

    if (this.eventsSubject && !this.isMuted) {
      this.eventsSubject.next(new EventUnitClearCache(options));
    }
    return true;
  }

  /**
   * Clears the value by dispatching the default value. \
   * It only works if the Unit is not frozen, and {@link emitCount} is not 0, and value is not empty {@link isEmpty}.
   *
   * @returns `true` if the value was cleared, otherwise `false`
   *
   * @triggers {@link EventUnitClearValue}
   * @category Common Units
   */
  clearValue(): boolean {
    if (this.isFrozen || this.emitCount === 0 || this.isEmpty) {
      return false;
    }
    this.updateValueAndCache(this.defaultValue());

    if (this.eventsSubject && !this.isMuted) {
      this.eventsSubject.next(new EventUnitClearValue());
    }
    return true;
  }

  /**
   * Holistically clears the Unit, \
   * unfreezes using {@link unfreeze}, \
   * clears the value using {@link clearValue}, \
   * completely clears cache using {@link clearCache}, \
   * in that specific order.
   *
   * @param options Clear cache options for {@link clearCache}.
   *
   * @triggers {@link EventUnitClear}
   * @category Common Units
   */
  clear(options?: ClearCacheOptions): void {
    this.unfreeze();
    this.clearValue();
    this.clearCache(options);

    if (this.eventsSubject && !this.isMuted) {
      this.eventsSubject.next(new EventUnitClear(options));
    }
  }

  /**
   * Resets the value by dispatching the initial-value, {@link UnitConfig.initialValue} if provided, \
   * otherwise dispatches the default value.
   *
   * It only works if the Unit is not frozen, \
   * and the {@link value} is not equal to the {@link initialValue}.
   *
   * @returns `true` if the reset was successful, otherwise `false`
   *
   * @triggers {@link EventUnitResetValue}
   * @category Common Units
   */
  resetValue(): boolean {
    if (this.isFrozen || this.rawValue() === this.initialValueRaw()) {
      return false;
    }
    this.updateValueAndCache(this.initialValueRaw());

    if (this.eventsSubject && !this.isMuted) {
      this.eventsSubject.next(new EventUnitResetValue());
    }
    return true;
  }

  /**
   * Holistically resets the Unit, \
   * unfreezes using {@link unfreeze}, \
   * resets the value using {@link resetValue}, \
   * clears cache using {@link clearCache} and by default leaves last value; \
   * in that specific order.
   *
   * @param options Clear cache options for {@link clearCache}. default is `{leaveLast: true}`
   *
   * @triggers {@link EventUnitReset}
   * @category Common Units
   */
  reset(options: ClearCacheOptions = {leaveLast: true}): void {
    this.unfreeze();
    this.resetValue();
    this.clearCache(options);

    if (this.eventsSubject && !this.isMuted) {
      this.eventsSubject.next(new EventUnitReset(options));
    }
  }

  /**
   * Temporarily disables most of the functions of the Unit, except {@link unfreeze}, \
   * {@link mute}/{@link unmute}, {@link clear} and {@link reset}.
   *
   * It's not the same as `Object.freeze`.
   *
   * Freezing prevents any new values from getting dispatched, \
   * it disables all the mutating functions. \
   * Which eventually ensures that no event is emitted while the Unit is frozen, \
   * however all the read operations and operations that do not emit a value are allowed.
   *
   * @triggers {@link EventUnitFreeze}
   * @category Common Units
   */
  freeze(): void {
    // tslint:disable-next-line:no-console
    console.trace();
    if (this.isFrozen) {
      return;
    }
    this._isFrozen = true;

    if (this.eventsSubject && !this.isMuted) {
      this.eventsSubject.next(new EventUnitFreeze());
    }
  }

  /**
   * Unfreezes the Unit, and re-enables all the functions disabled by {@link freeze}. \
   * It only works if the Unit is frozen.
   *
   * @triggers {@link EventUnitUnfreeze}
   * @category Common Units
   */
  unfreeze(): void {
    if (!this.isFrozen) {
      return;
    }
    this._isFrozen = false;

    if (this.eventsSubject && !this.isMuted) {
      this.eventsSubject.next(new EventUnitUnfreeze());
    }
  }

  /**
   * Mute the Unit, to stop emitting values as well as events, so that the subscribers are not triggered. \
   * All other functionalities stay unaffected. ie: cache it still updated, value is still updated.
   *
   * Note: If you subscribe to the default Observable while the Unit is muted, \
   * it will replay the last value emitted before muting the Unit, \
   * because new values are not being emitted.
   *
   * @category Common Units
   */
  mute(): void {
    this._isMuted = true;
  }

  /**
   * Unmute the Unit, to resume emitting values, and events. \
   * If a value was dispatched while the Unit was muted, the most recent value immediately gets emitted, \
   * so that subscribers can be in sync again. \
   * However, other {@link events$} are lost, and they will only emit on the next event.
   *
   * It only works if the Unit is muted. \
   * Moreover, it works even if the Unit is frozen, \
   * but no value will be emitted because no values would have been dispatched while the Unit was frozen.
   *
   * @triggers {@link EventUnitUnmute}
   * @category Common Units
   */
  unmute(): void {
    if (!this.isMuted) {
      return;
    }
    this._isMuted = false;
    if (this.emitOnUnmute) {
      this.emit();
      this.emitOnUnmute = null;
    }
    if (this.eventsSubject) {
      this.eventsSubject.next(new EventUnitUnmute());
    }
  }

  /**
   * Clears persisted value from persistent storage. \
   * It doesn't turn off persistence, future values will get persisted again.
   *
   * It only works if the Unit is configured to be persistent. ie: `options.persistent` is true.
   *
   * @returns `true` if the Unit is configured to be persistent, otherwise `false`.
   *
   * @triggers {@link EventUnitClearPersistedValue}
   * @category Common Units
   */
  clearPersistedValue(): boolean {
    if (this.config.persistent === true) {
      remove(this.config.id, this.config.storage);

      if (this.eventsSubject && !this.isMuted) {
        this.eventsSubject.next(new EventUnitClearPersistedValue());
      }

      return true;
    }
    return false;
  }

  /**
   * @internal please do not use.
   */
  protected abstract isValidValue(value: any): boolean;

  /**
   * @internal please do not use.
   */
  protected deepCopyMaybe<U>(o: U): U {
    return this.config.immutable === true ? deepCopy(o) : o;
  }

  /**
   * @internal please do not use.
   */
  protected checkSerializabilityMaybe(o: any): void {
    if (Configuration.ENVIRONMENT.checkSerializability === true) {
      checkSerializability(o);
    }
  }

  /**
   * @internal please do not use.
   */
  protected updateValueAndCache(value: T, options?: DispatchOptions, skipCache = false): void {
    const {cacheReplace}: DispatchOptions = options || {};

    if (Configuration.ENVIRONMENT.checkImmutability === true) {
      deepFreeze(value);
    }

    if (!skipCache) {
      this.updateCache(value, cacheReplace);
    }

    this._value = value;

    if (this.isMuted) {
      this.emitOnUnmute = true;
    } else {
      this.emitOnUnmute = null;
      this.emit();
    }

    this.updateValueInPersistentStorage();
  }

  /**
   * @internal please do not use.
   */
  protected applyFallbackValue(value: T): T {
    return value === undefined ? this.defaultValue() : value;
  }

  /**
   * @internal please do not use.
   */
  private distinctCheck(value: T): boolean {
    return this.config.distinctDispatchCheck !== true || value !== this.rawValue();
  }

  /**
   * @internal please do not use.
   */
  private dispatchMiddleware(
    valueOrProducer: DispatchValueProducer<T> | T,
    options?: DispatchOptions
  ): boolean {
    return this.dispatchActual(valueOrProducer, options);
  }

  /**
   * @internal please do not use.
   */
  private dispatchActual(
    valueOrProducer: DispatchValueProducer<T> | T,
    options?: DispatchOptions
  ): boolean {
    const {force}: DispatchOptions = options || {};
    const value: T =
      typeof valueOrProducer === 'function'
        ? (valueOrProducer as DispatchValueProducer<T>)(this.value())
        : valueOrProducer;

    this.checkSerializabilityMaybe(value);

    if (this.wouldDispatch(value, force)) {
      this.updateValueAndCache(this.deepCopyMaybe(value), options); // clone and dispatch

      if (this.eventsSubject && !this.isMuted) {
        this.eventsSubject.next(new EventUnitDispatch(value, options));
      }
      return true;
    }

    if (this.eventsSubject && !this.isMuted) {
      const failReason: DispatchFailReason =
        (this.isFrozen && DispatchFailReason.FROZEN_UNIT) ||
        (this.isValidValue(value) &&
          (this.distinctCheck(value)
            ? DispatchFailReason.CUSTOM_DISPATCH_CHECK
            : DispatchFailReason.DISTINCT_CHECK)) ||
        DispatchFailReason.INVALID_VALUE;

      this.eventsSubject.next(new EventUnitDispatchFail(value, failReason, options));
    }

    return false;
  }

  /**
   * @internal please do not use.
   */
  private shouldDispatchInitialValue(initialValue: T): boolean {
    // not checking undefined in wouldDispatch to allow undefined values later on (for GenericUnit)
    return initialValue !== undefined && this.isValidValue(initialValue);
  }

  /**
   * @internal please do not use.
   */
  private updateCache(value: T, cacheReplace?: boolean): void {
    if (cacheReplace === true) {
      this._cachedValues[this.cacheIndex] = value;
    } else {
      if (this.cachedValuesCount === 0 || this.cacheIndex === this.cachedValuesCount - 1) {
        this._cachedValues.push(value);
        if (this.cachedValuesCount > this.cacheSize) {
          this._cachedValues.shift();
        }
        this._cacheIndex = this.cachedValuesCount - 1;
      } else {
        this._cachedValues.splice(
          this.cacheIndex + 1,
          this.cachedValuesCount - 1 - this.cacheIndex,
          value
        );
        ++this._cacheIndex;
      }
    }
  }

  /**
   * @internal please do not use.
   */
  private dispatchInitialValue(initialValue) {
    if (this.shouldDispatchInitialValue(initialValue)) {
      this._initialValue = initialValue;
      this.updateValueAndCache(this.initialValueRaw());
    } else {
      this.updateValueAndCache(this.defaultValue());
    }
  }

  /**
   * @internal please do not use.
   */
  private updateValueInPersistentStorage() {
    if (this.config.persistent === true) {
      save(this.config.id, this.rawValue(), this.config.storage);
    }
  }

  /**
   * @internal please do not use.
   */
  private restoreValueFromPersistentStorage(initialValue): void {
    const savedState = retrieve(this.config.id, this.config.storage);

    if (savedState) {
      this.dispatchInitialValue(savedState.value);
    } else {
      this.checkSerializabilityMaybe(initialValue);
      this.dispatchInitialValue(this.deepCopyMaybe(initialValue));
    }
  }
}
