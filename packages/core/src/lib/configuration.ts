import {
  DictValue,
  EnvironmentConfig,
  GlobalActionConfig,
  GlobalAsyncSystemConfig,
  GlobalClusterConfig,
  GlobalConfig,
  GlobalUnitConfig,
} from '../models';
import {Cluster} from './cluster';
import {Action} from './action';
import {DictUnit} from './dict-unit';
import {ListUnit} from './list-unit';
import {StringUnit} from './string-unit';
import {NumUnit} from './num-unit';
import {BoolUnit} from './bool-unit';
import {GenericUnit} from './generic-unit';
import {AsyncSystem} from './async-system';

/**
 * @internal please do not use.
 */
export const UniqueIdsAndLocationIdMap: {[id: string]: string} = {};
/**
 * @internal please do not use.
 */
const FrozenObj = Object.freeze({});

/**
 * The Global configuration for all ActiveJS constructs, Units, Systems, Action and Cluster.
 *
 * See {@link https://docs.activejs.dev/guides/configuration} for more details.
 *
 * @category 4. Utility
 */
export class Configuration {
  // tslint:disable:variable-name

  /**
   * @internal please do not use.
   */
  private static _isDevMode = true;
  /**
   * @internal please do not use.
   */
  private static _storage: Storage;
  /**
   * @internal please do not use.
   */
  private static _ENVIRONMENT: EnvironmentConfig = FrozenObj;
  /**
   * @internal please do not use.
   */
  private static _ACTION: GlobalActionConfig = FrozenObj;
  /**
   * @internal please do not use.
   */
  private static _CLUSTER: GlobalClusterConfig = FrozenObj;
  /**
   * @internal please do not use.
   */
  private static _UNITS: GlobalUnitConfig<any> = FrozenObj;
  /**
   * @internal please do not use.
   */
  private static _BOOL_UNIT: GlobalUnitConfig<boolean> = FrozenObj;
  /**
   * @internal please do not use.
   */
  private static _NUM_UNIT: GlobalUnitConfig<number> = FrozenObj;
  /**
   * @internal please do not use.
   */
  private static _STRING_UNIT: GlobalUnitConfig<string> = FrozenObj;
  /**
   * @internal please do not use.
   */
  private static _LIST_UNIT: GlobalUnitConfig<any[]> = FrozenObj;
  /**
   * @internal please do not use.
   */
  private static _DICT_UNIT: GlobalUnitConfig<DictValue<any>> = FrozenObj;
  /**
   * @internal please do not use.
   */
  private static _GENERIC_UNIT: GlobalUnitConfig<any> = FrozenObj;
  /**
   * @internal please do not use.
   */
  private static _ASYNC_SYSTEM: GlobalAsyncSystemConfig = FrozenObj;

  // tslint:enable:variable-name

  /**
   * The default Storage API being used for storing the values of persistent Units.
   *
   * @default `localStorage`
   */
  static get storage(): Readonly<Storage> {
    return Configuration._storage || localStorage;
  }

  /**
   * Global ActiveJS environment configurations options.
   */
  static get ENVIRONMENT(): Readonly<EnvironmentConfig> {
    if (this.isDevMode()) {
      return Configuration._ENVIRONMENT;
    }
    return Object.freeze({});
  }

  /**
   * Configuration options applied to all the Actions. {@link Action}
   */
  static get ACTION(): Readonly<GlobalActionConfig> {
    return Configuration._ACTION;
  }

  /**
   * Configuration options applied to all the Clusters. {@link Cluster}
   */
  static get CLUSTER(): Readonly<GlobalClusterConfig> {
    return Configuration._CLUSTER;
  }

  /**
   * Configuration options applied to all the Units. {@link Unit}
   */
  static get UNITS(): Readonly<GlobalUnitConfig<any>> {
    return Configuration._UNITS;
  }

  /**
   * Configuration options applied to all the BoolUnits. {@link BoolUnit}
   */
  static get BOOL_UNIT(): Readonly<GlobalUnitConfig<boolean>> {
    return Configuration._BOOL_UNIT;
  }

  /**
   * Configuration options applied to all the NumUnits. {@link NumUnit}
   */
  static get NUM_UNIT(): Readonly<GlobalUnitConfig<number>> {
    return Configuration._NUM_UNIT;
  }

  /**
   * Configuration options applied to all the StringUnits. {@link StringUnit}
   */
  static get STRING_UNIT(): Readonly<GlobalUnitConfig<string>> {
    return Configuration._STRING_UNIT;
  }

  /**
   * Configuration options applied to all the ListUnits. {@link ListUnit}
   */
  static get LIST_UNIT(): Readonly<GlobalUnitConfig<any[]>> {
    return Configuration._LIST_UNIT;
  }

  /**
   * Configuration options applied to all the DictUnits. {@link DictUnit}
   */
  static get DICT_UNIT(): Readonly<GlobalUnitConfig<DictValue<any>>> {
    return Configuration._DICT_UNIT;
  }

  /**
   * Configuration options applied to all the GenericUnits. {@link GenericUnit}
   */
  static get GENERIC_UNIT(): Readonly<GlobalUnitConfig<any>> {
    return Configuration._GENERIC_UNIT;
  }

  /**
   * Configuration options applied to all the AsyncSystems. {@link AsyncSystem}
   */
  static get ASYNC_SYSTEM(): Readonly<GlobalAsyncSystemConfig> {
    return Configuration._ASYNC_SYSTEM;
  }

  /**
   * Sets and overrides default configurations. \
   * These configurations can still be overridden at the time of instantiation.
   *
   * It should only be called once in the whole app.
   * Calling it second time doesn't merge the new configuration,
   * it simply rewrites it.
   *
   * However, the defaults are not affected by this behavior, \
   * they have to be overridden specifically every time.
   *
   * @param config The configuration options.
   */
  static set(config: GlobalConfig): void {
    const {
      storage,
      ENVIRONMENT,
      ACTION,
      UNITS,
      CLUSTER,
      BOOL_UNIT,
      NUM_UNIT,
      STRING_UNIT,
      LIST_UNIT,
      DICT_UNIT,
      GENERIC_UNIT,
      ASYNC_SYSTEM,
    }: GlobalConfig = {...config};

    Configuration._storage = storage;
    Configuration._ENVIRONMENT = Object.freeze({...ENVIRONMENT});
    Configuration._ACTION = Object.freeze({...ACTION});
    Configuration._CLUSTER = Object.freeze({...CLUSTER});
    Configuration._UNITS = Object.freeze({...UNITS});
    Configuration._BOOL_UNIT = Object.freeze({...BOOL_UNIT});
    Configuration._NUM_UNIT = Object.freeze({...NUM_UNIT});
    Configuration._STRING_UNIT = Object.freeze({...STRING_UNIT});
    Configuration._LIST_UNIT = Object.freeze({...LIST_UNIT});
    Configuration._DICT_UNIT = Object.freeze({...DICT_UNIT});
    Configuration._GENERIC_UNIT = Object.freeze({...GENERIC_UNIT});
    Configuration._ASYNC_SYSTEM = Object.freeze({
      ...ASYNC_SYSTEM,
      UNITS: {...ASYNC_SYSTEM?.UNITS},
      QUERY_UNIT: {...ASYNC_SYSTEM?.QUERY_UNIT},
      DATA_UNIT: {...ASYNC_SYSTEM?.DATA_UNIT},
      ERROR_UNIT: {...ASYNC_SYSTEM?.ERROR_UNIT},
      PENDING_UNIT: {...ASYNC_SYSTEM?.PENDING_UNIT},
    });

    if (Configuration.ENVIRONMENT.checkUniqueId === true) {
      Object.keys(UniqueIdsAndLocationIdMap).forEach(k => {
        delete UniqueIdsAndLocationIdMap[k];
      });
    }
  }

  /**
   * Resets all global configurations to their default/empty state. \
   * It doesn't affect any currently existing instances, it's only applicable to the instances created after this.
   */
  static reset(): void {
    Configuration.set(null);
  }

  /**
   * It sets the {@link ENVIRONMENT} to it's default configuration, \
   * i.e: it turns off all the checks declared in {@link ENVIRONMENT} and \
   * also, disables the extra logs.
   */
  static enableProdMode(): void {
    this._isDevMode = false;
  }

  /**
   * To check whether the production mode has been enabled or not.
   */
  static isDevMode(): boolean {
    return this._isDevMode;
  }
}
