import {SharedAsyncSystemConfig} from './async-system';
import {DictValue, SharedUnitConfig} from './units';
import {SharedActionConfig} from './action';
import {SharedClusterConfig} from './cluster';

/**
 * Shared global config options for Units.
 *
 * @category Global Config
 */
export type GlobalUnitConfig<T> = SharedUnitConfig<T>;

/**
 * Shared global config options for AsyncSystems.
 *
 * It overrides options defined in other Unit specific GlobalConfig,
 * like {@link GlobalConfig.UNITS} or {@link GlobalConfig.GENERIC_UNIT}, etc.
 *
 * @category Global Config
 */
export interface GlobalAsyncSystemConfig extends SharedAsyncSystemConfig<any, any, any> {
  /**
   * Common configuration options for the AsyncSystem's member Units.
   */
  UNITS?: SharedUnitConfig<any>;

  /**
   * Configuration options for the `queryUnit`.
   */
  QUERY_UNIT?: SharedUnitConfig<any>;
  /**
   * Configuration options for the `dataUnit`.
   */
  DATA_UNIT?: SharedUnitConfig<any>;
  /**
   * Configuration options for the `errorUnit`.
   */
  ERROR_UNIT?: SharedUnitConfig<any>;
  /**
   * Configuration options for the `pendingUnit`.
   */
  PENDING_UNIT?: SharedUnitConfig<any>;
}

/**
 * Shared global config options for Actions.
 *
 * @category Global Config
 */
export type GlobalActionConfig = SharedActionConfig;

/**
 * Shared global config options for Clusters.
 *
 * @category Global Config
 */
export type GlobalClusterConfig = SharedClusterConfig;

/**
 * Logging levels enum for {@link EnvironmentConfig.logLevel}.
 */
export const enum LogLevel {
  /**
   * Turns off all the logs. i.e.: `info` and `warn`
   */
  NONE,
  /**
   * Turns off `info` logs.
   */
  WARN,
  /**
   * Turns on all the logs. i.e.: `info` and `warn`
   */
  INFO,
}

/**
 * Development environment options.
 */
export interface EnvironmentConfig {
  /**
   * Logging level for ActiveJS logs,
   * it controls which type of logs get logged to the browser console.
   *
   * It doesn't affect any errors thrown by ActiveJS.
   *
   * @default {@link LogLevel.NONE}
   */
  logLevel?: LogLevel;
  /**
   * Should ActiveJS check and block any attempts of Action and Units' value mutation.
   *
   * When set to true, if a violation is detected, ActiveJS will throw an error
   * to notify the developer about when and where the violation occurred.
   *
   * It doesn't work on immutable Units, since immutable Units can't be mutated.
   *
   * JavaScript's strict mode should be enabled to take full advantage of immutability checks,
   * otherwise some mutation attempts will fail silently.
   *
   * You should disable this check in production builds,
   * and only use it in development environment.
   * e.g.: In Angular it's as easy as assigning `!environment.production` to this flag.
   *
   * @default false
   */
  checkImmutability?: boolean;
  /**
   * Should ActiveJS check the uniqueness of ids assigned to ActiveJS constructs.
   *
   * When set to true, if a violation is detected, ActiveJS will throw an error
   * to notify the developer about when and where the violation occurred.
   *
   * You should disable this check in production builds,
   * and only use it in development environment.
   * e.g.: In Angular it's as easy as assigning `!environment.production` to this flag.
   *
   * @default false
   */
  checkUniqueId?: boolean;
  /**
   * Should ActiveJS check the value of DictUnit, ListUnit and GenericUnit for serializability.
   *
   * When set to true, if a violation is detected, ActiveJS will throw an error
   * to notify the developer about when and where the violation occurred.
   *
   * You should disable this check in production builds,
   * and only use it in development environment.
   * e.g.: In Angular it's as easy as assigning `!environment.production` to this flag.
   *
   * @default false
   */
  checkSerializability?: boolean;
}

/**
 * All the global configuration options for ActiveJS.
 *
 * These configuration options override the default options of all the fundamental constructs,
 * Units, Systems, Action and CLuster.
 *
 * These options are overridden by the options passed to constructs at the time of instantiation.
 *
 * @category Global Config
 */
export interface GlobalConfig {
  /**
   * The Storage to be used for storing the values of persistent Units. \
   * It can be either `LocalStorage` or `SessionStorage` or any other API,
   * that implements `Storage` API interface.
   *
   * @default `localStorage`
   */
  storage?: Storage;
  /**
   * Options for development toolkit.
   */
  ENVIRONMENT?: EnvironmentConfig;
  /**
   * Options for `Actions` that override default options of `Action`.
   */
  ACTION?: GlobalActionConfig;
  /**
   * Options applicable to all the `Units`, that override default options of `Units`.
   */
  UNITS?: GlobalUnitConfig<any>;
  /**
   * Options for `Cluster` that override default options of `Cluster`.
   */
  CLUSTER?: GlobalClusterConfig;
  /**
   * Options for `BoolUnit` that override default options of `BoolUnit`.
   */
  BOOL_UNIT?: GlobalUnitConfig<boolean>;
  /**
   * Options for `NumUnit` that override default options of `NumUnit`.
   */
  NUM_UNIT?: GlobalUnitConfig<number>;
  /**
   * Options for `StringUnit` that override default options of `StringUnit`.
   */
  STRING_UNIT?: GlobalUnitConfig<string>;
  /**
   * Options for `ListUnit` that override default options of `ListUnit`.
   */
  LIST_UNIT?: GlobalUnitConfig<any[]>;
  /**
   * Options for `DictUnit` that override default options of `DictUnit`.
   */
  DICT_UNIT?: GlobalUnitConfig<DictValue<any>>;
  /**
   * Options for `GenericUnit` that override default options of `GenericUnit`.
   */
  GENERIC_UNIT?: GlobalUnitConfig<any>;
  /**
   * Options for `AsyncSystem` that override default options of `AsyncSystem`.
   */
  ASYNC_SYSTEM?: GlobalAsyncSystemConfig;
}
