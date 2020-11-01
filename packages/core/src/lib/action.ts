import {Base} from './abstract-base';
import {Configuration} from './configuration';
import {Stream} from './stream';
import {ActionConfig, ActionStreamObservableProducer, DispatchValueProducer} from '../models';
import {deepFreeze, makeNonEnumerable} from '../utils/funcs';

/**
 * An Action is nothing, but an elaborate form of an RxJS Subject. \
 * Or in other words, a simplified form of Unit.
 *
 * Unlike Units, it doesn't perform any checks on dispatch. \
 * All values pass through, just like a Subject.
 *
 * See {@link https://docs.activejs.dev/fundamentals/action} for more details.
 *
 * @category 4. Utility
 */
export class Action<T> extends Base<T> {
  /**
   * Configured options. \
   * Combination of global-options {@link GlobalUnitConfig} and the options passed on instantiation.
   */
  readonly config: Readonly<ActionConfig<T>>;

  // tslint:disable:variable-name
  /**
   * @internal please do not use.
   */
  private _value: T;

  // tslint:enable:variable-name

  /**
   * Current value of the Action, the last dispatched value.
   *
   * @default `undefined`
   * @category Access Value
   */
  value(): T {
    return this._value;
  }

  constructor(config?: ActionConfig<T>) {
    super({
      replay: false,
      ...Configuration.ACTION,
      ...config,
    });

    this.dispatch(this.config.initialValue);

    makeNonEnumerable(this);
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
  createStream<R>(observableProducer: ActionStreamObservableProducer<this, R>): Stream {
    const observable = observableProducer(this);

    return new Stream(observable);
  }

  /**
   * Method to dispatch new value.
   *
   * @param value A value to be dispatched.
   *
   * @category Common Action/Units
   */
  dispatch(value: T): void;

  /**
   * Method to dispatch new value by producing the value using the current {@link value}.
   *
   * @param valueProducer A pure function which produces a new value to be dispatched.
   *
   * @category Basic Action
   */
  // tslint:disable-next-line:unified-signatures
  dispatch(valueProducer: DispatchValueProducer<T>): void;

  dispatch(valueOrProducer: DispatchValueProducer<T> | T): void {
    this._value =
      typeof valueOrProducer === 'function'
        ? (valueOrProducer as DispatchValueProducer<T>)(this.value())
        : valueOrProducer;

    if (Configuration.ENVIRONMENT.checkImmutability === true) {
      deepFreeze(this._value);
    }

    this.emit();
  }
}
