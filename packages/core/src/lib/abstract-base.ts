import '../../../../LICENSE';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {BaseConfig, BaseEvents, EventReplay, UnitConfig} from '../models';
import {getLocationId, isFunction, isValidId} from '../utils/funcs';
import {Configuration, UniqueIdsAndLocationIdMap} from './configuration';

/**
 * This is the most basic building block of ActiveJS.
 *
 * Base serves as the base for all fundamental ActiveJS constructs: Units, Systems, Actions and Clusters.
 *
 * This is an internal construct, normally you'd never have to use this class directly.
 * However, if you're just reading the documentation, or want to learn more about how ActiveJS works,
 * or want to extend this class to build something on your own, please continue.
 *
 * It extends RxJS `Observable`.
 * Source of this Observable is either a BehaviorSubject or Subject depending on the {@link BaseConfig.replay} flag.
 * By default, it's a BehaviourSubject for the Units, Systems and Clusters; and a Subject for Actions.
 *
 * There's another non-replaying Observable named `future$` to observe the value, whose source is always a simple Subject,
 * This Subject also serves as the source for default extended Observable when {@link BaseConfig.replay} is `false`.
 *
 * In simple terms Base is an elaborate RxJS Subject like construct, with custom features like replay on demand.
 * Although that's just one aspect of Base.
 *
 * It also implements `Object.prototype` methods
 * to make working with the stored value a bit easier and efficient.
 *
 * Other than that, It also provides functionalities like: On-demand Observable custom-event, to listen to events like manual replay.
 *
 * @category 2. Abstract
 */
export abstract class Base<T> extends Observable<T> {
  // tslint:disable:variable-name

  /**
   * Configured options.
   * Combination of applicable global-options and the options passed on instantiation.
   */
  readonly config: Readonly<BaseConfig>;

  /**
   * @internal please do not use.
   */
  protected readonly sourceSubject: Subject<T> | BehaviorSubject<T>;
  /**
   * @deprecated
   * @internal please do not use.
   */
  readonly source: Observable<T>;

  /**
   * @internal please do not use.
   */
  protected eventsSubject: Subject<BaseEvents<T> | any>;
  /**
   * On-demand observable events.
   * See {@link https://docs.activejs.dev/guides/events} for more details.
   */
  readonly events$: Observable<BaseEvents<T> | any>;

  /**
   * @internal please do not use.
   */
  private _events: Observable<BaseEvents<T>>;

  /**
   * @internal please do not use.
   */
  private readonly futureSubject = new Subject<T>();
  /**
   * An Observable to observe future values,
   * unlike the default Observable it doesn't replay when subscribed to,
   * rather it waits for the next value.
   */
  readonly future$: Observable<T> = this.futureSubject.asObservable();

  /**
   * @internal please do not use.
   */
  protected emittedValue: T;

  /**
   * @internal please do not use.
   */
  private _emitCount = 0;

  /**
   * A counter to keep track of how many times has a Unit, System, Action or Cluster emitted.
   * @returns Number of times a Unit, System, Action or Cluster has emitted.
   */
  get emitCount(): number {
    return this._emitCount;
  }

  /**
   * Current value.
   *
   * @category Access Value
   */
  abstract value(): T;

  /**
   * Current value.
   * Used internally, for operations that don't mutate the value.
   *
   * @internal please do not use.
   *
   * @category Access Value
   */
  protected rawValue(): T {
    return this.value();
  }

  // tslint:enable:variable-name

  protected constructor(config?: BaseConfig) {
    super();

    this.config = {...config};

    if (this.config.id !== undefined) {
      if (!isValidId(this.config.id)) {
        throw new TypeError(
          `Invalid id provided, expected a non-empty string, got ${String(this.config.id)}`
        );
      }
      if (Configuration.ENVIRONMENT.checkUniqueId === true) {
        const locationId = getLocationId(this);
        if (
          UniqueIdsAndLocationIdMap[this.config.id] != null &&
          UniqueIdsAndLocationIdMap[this.config.id] !== locationId
        ) {
          throw new TypeError(
            `Duplicate id "${this.config.id}" detected by "checkUniqueId" check, consider assigning a unique id.`
          );
        }
        UniqueIdsAndLocationIdMap[this.config.id] = locationId;
      }
    } else if ((this.config as UnitConfig<any>).persistent === true) {
      throw new TypeError(`An id is required for persistence to work.`);
    }

    if (this.config.replay === false) {
      this.sourceSubject = this.futureSubject;
      (this as any).source = this.future$;
    } else {
      this.sourceSubject = new BehaviorSubject(undefined);
      (this as any).source = this.sourceSubject.asObservable();
    }

    this.setupEvents();
    Object.freeze(this.config);
  }

  /**
   * Creates a new Observable using the default Observable as source.
   * Use this to conceal other aspects of a Unit, System, Action or Cluster except the Observable part.
   *
   * @returns An Observable with the value of a Unit, System, Action or Cluster.
   *
   * @category Common
   */
  asObservable(): Observable<T> {
    const observable = new Observable<T>();
    (observable as any).source = (this as any).source;
    return observable;
  }

  /**
   * To manually re-emit the last emitted value again.
   *
   * @triggers {@link EventReplay}
   * @category Common
   */
  replay(): void {
    this.emit(this.emittedValue);

    if (this.eventsSubject?.observers.length) {
      this.eventsSubject.next(new EventReplay(this.emittedValue));
    }
  }

  /**
   * Converts the value to JSON string, using `JSON.stringify`.
   *
   * @category Common
   */
  toJsonString(): string {
    return JSON.stringify(this.rawValue());
  }

  /**
   * Returns the {@link rawValue},
   * JavaScript automatically invokes it when encountering an object where a primitive value is expected.
   *
   * @alias {@link rawValue}
   * This method is not intended to be used by developers, use {@link rawValue} instead.
   * It only exists to be used by JavaScript implicitly.
   *
   * @hidden
   * @category Customised Object.prototype
   */
  valueOf(): T {
    return this.rawValue();
  }

  /**
   * Returns the {@link rawValue}.
   * JavaScript automatically invokes it when `JSON.stringify` is invoked on an object.
   *
   * @alias {@link rawValue}
   * This method is not intended to be used by developers, use {@link rawValue} instead.
   * It only exists to be used by `JSON.stringify` implicitly.
   *
   * @hidden
   * @category Common
   */
  toJSON(): T {
    return this.rawValue();
  }

  /**
   * @internal please do not use.
   */
  protected emit(value: T = this.value()): void {
    ++this._emitCount;
    this.emittedValue = value;

    if (this.sourceSubject !== this.futureSubject) {
      this.sourceSubject.next(value);
    }
    this.futureSubject.next(value);
  }

  /**
   * @internal please do not use.
   */
  private setupEvents(): void {
    Object.defineProperty(this, 'events$', {
      get() {
        if (this._events) {
          return this._events;
        }

        this.eventsSubject = new Subject<BaseEvents<T>>();
        this._events = this.eventsSubject.asObservable();

        Object.defineProperty(this, 'eventsSubject', {enumerable: false});
        Object.defineProperty(this, '_events', {enumerable: false});

        return this._events;
      },
      enumerable: false,
    });
  }

  // tslint:disable
  // Overriding inherited properties and methods from RxJS Observable.
  // This hack is essential to reduce API surface area and avoid confusion
  // with our own implementations like `forEvery`.
  /**
   * @deprecated
   * @internal please do not use.
   */
  _isScalar: any;

  /**
   * @deprecated
   * @internal please do not use.
   */
  operator: any;

  /**
   * @deprecated
   * @internal please do not use.
   */
  lift: any;

  /**
   * @deprecated
   * @internal please do not use.
   */
  _trySubscribe: any;

  /**
   * @deprecated
   * @internal please do not use.
   */
  _subscribe: any;

  /**
   * @alias forEvery
   * @deprecated Use {@link forEvery} instead.
   * This `forEach` is not the usual `Array.forEach`.
   * This `forEach` is an RxJS feature, which got inherited due to extending the Observable class,
   * But this is not what you want, most probably you just want to iterate over the items, for that
   * we've implemented the normal `forEach` functionality into `forEvery` method.
   *
   * This `forEach` is marked deprecated to prevent accidental usage, and avoid confusion.
   * You can still use it though, if you want the RxJS feature,
   * see {@link Observable.forEach} for usage.
   * @hidden
   */
  forEach: any;

  /**
   * @deprecated
   * @internal please do not use.
   */
  static create: any;

  /**
   * @deprecated
   * @internal please do not use.
   */
  static if: any;

  /**
   * @deprecated
   * @internal please do not use.
   */
  static throw: any;
  // tslint:enable
}

/**
 * @internal please do not use.
 */
const MethodsNotToImplement = [
  ...Object.getOwnPropertyNames(Observable.prototype),
  ...Object.getOwnPropertyNames(Base.prototype),
];

Object.getOwnPropertyNames(Object.prototype).forEach(method => {
  if (!isFunction(Object.prototype[method]) || MethodsNotToImplement.includes(method)) {
    return;
  }

  Object.defineProperty(Base.prototype, method, {
    value(...args) {
      return this.rawValue()[method](...args);
    },
  });
});
