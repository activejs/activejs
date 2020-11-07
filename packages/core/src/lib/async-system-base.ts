import {Base} from './abstract-base';
import {BoolUnit} from './bool-unit';
import {Stream} from './stream';
import {makeNonEnumerable} from '../utils/funcs';
import {
  AsyncSystemBaseConfig,
  AsyncSystemStreamObservableProducer as StreamObservableProducer,
  AsyncSystemValue,
  UnitToValueType,
  Unit,
} from '../models';
import {checkAsyncSystemConfig} from '../checks/common';
import {AsyncSystem} from './async-system';
import {Configuration} from './configuration';

/**
 * Base class for AsyncSystem.
 *
 * It can be used to create custom, {@link AsyncSystem} like Systems.
 *
 * See {@link https://docs.activejs.dev/fundamentals/systems/custom-asyncsystem} for more details.
 *
 * Just like every other ActiveJS construct:
 * - AsyncSystem extends {@link Base}
 * - Which further extends `Observable`
 *
 * @category 3. Systems
 */
export class AsyncSystemBase<
  QueryUnit extends Unit,
  DataUnit extends Unit,
  ErrorUnit extends Unit,
  Query extends UnitToValueType<QueryUnit> = UnitToValueType<QueryUnit>,
  Data extends UnitToValueType<DataUnit> = UnitToValueType<DataUnit>,
  Error extends UnitToValueType<ErrorUnit> = UnitToValueType<ErrorUnit>
> extends Base<AsyncSystemValue<Query, Data, Error>> {
  /**
   * Configured options. \
   * Combination of global-options {@link GlobalAsyncSystemConfig} and the options passed on instantiation.
   */
  readonly config: Readonly<AsyncSystemBaseConfig<Query, Data, Error>>;

  /**
   * @internal please do not use.
   *
   * It works because all our Subjects and operations are synchronous.
   */
  private relationshipsAutoPaused = false;
  private relationshipsManuallyPaused = false;

  /**
   * To check whether the inter-relationships among the member Units are active or not.
   *
   * @default `true`
   */
  get relationshipsWorking(): boolean {
    return !this.relationshipsAutoPaused && !this.relationshipsManuallyPaused;
  }

  /**
   * @internal please do not use.
   */
  private unitsEmitCountsBeforePausing: [number, number, number, number];

  /**
   * Combined value of all the member Units.
   *
   * @category Access Value
   */
  value(): AsyncSystemValue<Query, Data, Error> {
    const val = {
      query: this.queryUnit.value(),
      data: this.dataUnit.value(),
      error: this.errorUnit.value(),
      pending: this.pendingUnit.value(),
    };
    if (Configuration.ENVIRONMENT.checkImmutability === true) {
      Object.freeze(val);
    }
    return val;
  }

  constructor(
    /**
     * The member Unit that is intended to portray the role of `query` aspect of an async task.
     * @category Member Units
     */
    public readonly queryUnit: QueryUnit,
    /**
     * The member Unit that is intended to portray the role of `response` aspect of an async task.
     * @category Member Units
     */
    public readonly dataUnit: DataUnit,
    /**
     * The member Unit that is intended to portray the role of `error` aspect of an async task.
     * @category Member Units
     */
    public readonly errorUnit: ErrorUnit,
    /**
     * The member Unit that is intended to portray the role of `pending-status` of an async task.
     * @category Member Units
     */
    public readonly pendingUnit: BoolUnit,
    config?: AsyncSystemBaseConfig<Query, Data, Error>
  ) {
    super(config);

    checkAsyncSystemConfig(config)();

    this.emit();
    this.createRelationshipsAmongMemberUnits();
    makeNonEnumerable(this);
  }

  /**
   * A helper method that creates a stream by subscribing to the Observable returned by the param `observableProducer` callback.
   *
   * Ideally the callback function creates an Observable by applying `Observable.pipe`
   * on the {@link queryUnit} or `queryUnit.future$` as source Observable.
   *
   * Then, after a successful data flow, dispatch the data to the {@link dataUnit}; \
   * and after a failure, dispatch the error to the {@link errorUnit}, caught by using RxJS' catchError operator.
   *
   * Just know that you should catch the error in a sub-pipe (ie: do not let it propagate to the main-pipe), otherwise
   * as usual the stream will stop working, and will not react on any further emissions.
   *
   * @param observableProducer A callback function that should return an Observable.
   *
   * @category Common
   */
  createStream<R>(
    observableProducer: StreamObservableProducer<QueryUnit, DataUnit, ErrorUnit, R>
  ): Stream {
    const observable = observableProducer(
      this.queryUnit,
      this.dataUnit,
      this.errorUnit,
      this.pendingUnit
    );

    return new Stream(observable);
  }

  /**
   * To pause inter-relationships among the member Units. Also see {@link relationshipsWorking}.
   *
   * When inter-relationships are paused,
   * you can perform any number of operations on the member Units
   * without triggering the automatic relationships like {@link AsyncSystemBaseConfig.clearErrorOnData},
   * {@link AsyncSystemBaseConfig.autoUpdatePendingValue}, etc.
   *
   * This also means that the AsyncSystem stops emitting new values.
   *
   * @category Custom AsyncSystem
   */
  pauseRelationships(): void {
    if (this.relationshipsManuallyPaused === true) {
      return;
    }
    this.relationshipsManuallyPaused = true;
    this.unitsEmitCountsBeforePausing = this.unitsEmitCounts();
  }

  /**
   * To resume inter-relationships among the member Units. Also see {@link relationshipsWorking}.
   *
   * It restores the inter-relationships like {@link AsyncSystemBaseConfig.clearErrorOnData},
   * {@link AsyncSystemBaseConfig.autoUpdatePendingValue}, etc.
   *
   * This also means that the AsyncSystem starts emitting new values. \
   * And if any of the member Units emitted a value while the relationships were paused,
   * the AsyncSystem will emit a new value immediately to bring itself and its subscribers in sync
   * with the member Units.
   *
   * @category Custom AsyncSystem
   */
  resumeRelationships(): void {
    if (this.relationshipsManuallyPaused === false) {
      return;
    }
    this.relationshipsManuallyPaused = false;
    if (this.unitsEmitCountsBeforePausing.join() !== this.unitsEmitCounts().join()) {
      this.emit();
    }
  }

  /**
   * @internal please do not use.
   */
  private unitsEmitCounts(): [number, number, number, number] {
    return [
      this.queryUnit.emitCount,
      this.dataUnit.emitCount,
      this.errorUnit.emitCount,
      this.pendingUnit.emitCount,
    ];
  }

  /**
   * @internal please do not use.
   */
  private createRelationshipsAmongMemberUnits() {
    this.queryUnit.future$.subscribe(() => {
      if (this.relationshipsWorking) {
        this.executeQueryUnitRelationship();
      }
    });

    this.dataUnit.future$.subscribe(() => {
      if (this.relationshipsWorking) {
        this.executeDataUnitRelationship();
      }
    });

    this.errorUnit.future$.subscribe(() => {
      if (this.relationshipsWorking) {
        this.executeErrorUnitRelationship();
      }
    });

    this.pendingUnit.future$.subscribe(isPending => {
      if (!this.relationshipsManuallyPaused) {
        this.toggleQueryUnitFreezeMaybe(isPending);
      }
      if (this.relationshipsWorking) {
        this.emit();
      }
    });
  }

  /**
   * @internal please do not use.
   */
  private executeQueryUnitRelationship() {
    this.relationshipsAutoPaused = true;

    this.autoUpdatePendingValue(true);

    if (this.config.clearDataOnQuery === true) {
      this.dataUnit.clearValue();
    }
    if (this.config.clearErrorOnQuery === true) {
      this.errorUnit.clearValue();
    }

    this.relationshipsAutoPaused = false;
    this.emit();
  }

  /**
   * @internal please do not use.
   */
  private executeDataUnitRelationship() {
    this.relationshipsAutoPaused = true;

    this.autoUpdatePendingValue(false);

    if (this.config.clearErrorOnQuery !== true && this.config.clearErrorOnData !== false) {
      this.errorUnit.clearValue();
    }
    if (this.config.clearQueryOnData === true) {
      this.queryUnit.clearValue();
    }

    this.relationshipsAutoPaused = false;
    this.emit();
  }

  /**
   * @internal please do not use.
   */
  private executeErrorUnitRelationship() {
    this.relationshipsAutoPaused = true;

    this.autoUpdatePendingValue(false);

    if (this.config.clearDataOnQuery !== true && this.config.clearDataOnError === true) {
      this.dataUnit.clearValue();
    }
    if (this.config.clearQueryOnError === true) {
      this.queryUnit.clearValue();
    }

    this.relationshipsAutoPaused = false;
    this.emit();
  }

  /**
   * @internal please do not use.
   */
  private toggleQueryUnitFreezeMaybe(isPending: boolean) {
    if (this.config.freezeQueryWhilePending === true) {
      if (isPending) {
        this.queryUnit.freeze();
      } else {
        this.queryUnit.unfreeze();
      }
    }
  }

  /**
   * @internal please do not use.
   */
  private autoUpdatePendingValue(isPending: boolean) {
    if (this.config.autoUpdatePendingValue !== false) {
      this.pendingUnit.dispatch(isPending, {bypassDebounce: true});
    }
  }

  /**
   * @internal please do not use.
   */
  protected emit(value = this.combinedEmittedValues()) {
    if (Configuration.ENVIRONMENT.checkImmutability === true) {
      Object.freeze(value);
    }
    super.emit(value);
  }

  /**
   * @internal please do not use.
   */
  private combinedEmittedValues(): AsyncSystemValue<Query, Data, Error> {
    // tslint:disable:no-string-literal
    return {
      query: this.queryUnit['emittedValue'],
      data: this.dataUnit['emittedValue'],
      error: this.errorUnit['emittedValue'],
      pending: this.pendingUnit['emittedValue'],
    };
    // tslint:enable:no-string-literal
  }
}
