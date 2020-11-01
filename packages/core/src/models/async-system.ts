import {Observable} from 'rxjs';
import {BoolUnit} from '../lib/bool-unit';
import {SharedUnitConfig, Unit, UnitConfig} from './units';

/**
 * A function that receives upto four Units that are part of an AsyncSystem.
 * @param queryUnit The Unit being used as `queryUnit` in the AsyncSystem.
 * @param dictUnit The Unit being used as `dictUnit` in the AsyncSystem.
 * @param errorUnit The Unit being used as `errorUnit` in the AsyncSystem.
 * @param pendingUnit The Unit being used as `pendingUnit` in the AsyncSystem.
 * @returns An Observable.
 *
 * @category Systems
 */
export type AsyncSystemStreamObservableProducer<
  QueryUnit extends Unit,
  DataUnit extends Unit,
  ErrorUnit extends Unit,
  R = any
> = (
  queryUnit: QueryUnit,
  dataUnit: DataUnit,
  errorUnit: ErrorUnit,
  pendingUnit: BoolUnit
) => Observable<R>;

/**
 * The type of value of an AsyncSystem, that gets derived from its member Units.
 *
 * @category Systems
 */
export interface AsyncSystemValue<Query, Data, Error> {
  /**
   * The value of `queryUnit`.
   */
  query?: Query;
  /**
   * The value of `dataUnit`.
   */
  data?: Data;
  /**
   * The value of `errorUnit`.
   */
  error?: Error;
  /**
   * The value of `pendingUnit`.
   */
  pending?: boolean;
}

/**
 * Shared configuration options for AsyncSystems.
 *
 * @category Systems
 */
export interface SharedAsyncSystemConfig<Query, Data, Error> {
  /**
   * A flag to control the replay behaviour of the AsyncSystem. \
   * It decides whether the value should be replayed when you subscribe to the default Observable.
   *
   * @default `true`
   */
  replay?: boolean;

  /**
   * An option if not set to `false` will make the AsyncSystem trigger `errorUnit.clearValue()`,
   * whenever the `dataUnit` emits a value.
   *
   * Note: It only works if {@link clearErrorOnQuery} is not set to `true`.
   * As only one of them can work at a time.
   *
   * @default `true`
   */
  clearErrorOnData?: boolean;
  /**
   * An option if set to `true` will make the AsyncSystem trigger `errorUnit.clearValue()`,
   * whenever the `queryUnit` emits a value.
   *
   * Note: If set to `true`, it'll turn off {@link clearErrorOnData}.
   * As only one of them can work at a time.
   *
   * @default `false`
   */
  clearErrorOnQuery?: boolean;

  /**
   * An option if set to `true` will make the AsyncSystem trigger `dataUnit.clearValue()`,
   * whenever the `queryUnit` emits a value.
   *
   * Note: If set to `true`, it'll turn off {@link clearDataOnError}.
   * As only one of them can work at a time.
   *
   * @default `false`
   */
  clearDataOnQuery?: boolean;
  /**
   * An option if set to `true` will make the AsyncSystem trigger `dataUnit.clearValue()`,
   * whenever the `errorUnit` emits a value.
   *
   * Note: It only works if {@link clearDataOnQuery} is not set to `true`.
   * As only one of them can work at a time.
   *
   * @default `false`
   */
  clearDataOnError?: boolean;

  /**
   * An option if set to `true` will make the AsyncSystem trigger `queryUnit.clearValue()`,
   * whenever the `dataUnit` emits a value.
   *
   * @default `false`
   */
  clearQueryOnData?: boolean;
  /**
   * An option if set to `true` will make the AsyncSystem trigger `queryUnit.clearValue()`,
   * whenever the `errorUnit` emits a value.
   *
   * @default `false`
   */
  clearQueryOnError?: boolean;

  /**
   * An option if not set to `false` will make the AsyncSystem
   * dispatch `true` or `false` to the `pendingUnit`, \
   * `true` whenever the `queryUnit` emits a value, and \
   * `false` whenever the `dataUnitUnit` or `errorUnit` emit a value.
   *
   * @default `true`
   */
  autoUpdatePendingValue?: boolean;
  /**
   * An option if set to `true` will make the AsyncSystem
   * freeze the `queryUnit`, whenever the `pendingUnit` emits `true`, and \
   * unfreeze the `queryUnit`, whenever the `pendingUnit` emits `false`.
   *
   * @default `false`
   */
  freezeQueryWhilePending?: boolean;
}

/**
 * Configuration options for AsyncSystemBase.
 *
 * @category Systems
 */
export interface AsyncSystemBaseConfig<Query, Data, Error>
  extends SharedAsyncSystemConfig<Query, Data, Error> {
  /**
   * A unique id to identify an instance of AsyncSystemBase.
   *
   * @default `undefined`
   */
  id?: string;
}

/**
 * Configuration options for AsyncSystem.
 *
 * @category Systems
 */
export interface AsyncSystemConfig<Query, Data, Error>
  extends SharedAsyncSystemConfig<Query, Data, Error> {
  /**
   * A unique id for the AsyncSystem and its Units. \
   *
   * This id is used to derive ids for the Units part of the AsyncSystem. \
   * For example the `queryUnit` gets assigned an id like `id + '_QUERY'`, \
   * similarly `dataUnit` gets assigned an id like `id + '_DATA'`, and so on.
   *
   * If an id is already provided for the Unit, the derived id wouldn't override it.
   *
   * @default `undefined`
   */
  id?: string;
  /**
   * The combined initial value that can be used to pass initial values to the AsyncSystem's member Units. \
   * It gets overridden by {@link AsyncSystemConfig.UNITS} or other Units specific configuration like {@link AsyncSystemConfig.QUERY_UNIT}.
   *
   * @default `undefined`
   */
  initialValue?: AsyncSystemValue<Query, Data, Error>;

  /**
   * Common configuration options for the AsyncSystem's member Units.
   *
   * @default `undefined`
   */
  UNITS?: SharedUnitConfig<any>;

  /**
   * Configuration options for the `queryUnit`.
   *
   * @default `undefined`
   */
  QUERY_UNIT?: UnitConfig<any>;
  /**
   * Configuration options for the `dataUnit`.
   *
   * @default `undefined`
   */
  DATA_UNIT?: UnitConfig<any>;
  /**
   * Configuration options for the `errorUnit`.
   *
   * @default `undefined`
   */
  ERROR_UNIT?: UnitConfig<any>;
  /**
   * Configuration options for the `pendingUnit`.
   *
   * @default `undefined`
   */
  PENDING_UNIT?: UnitConfig<any>;
}
