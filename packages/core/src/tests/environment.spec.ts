import {
  ALL_CTORS,
  booleanOrRandomValue,
  DICT_UNIT_MUTATION_FNS,
  LIST_UNIT_MUTATION_FNS,
  randomArray,
  randomAsyncSystemConfig,
  randomBoolean,
  randomClusterItems,
  randomConfig,
  randomMutation,
  randomNumber,
  randomNumOrStr,
  randomString,
  randomUnitCtor,
  randomValidValue,
  randomValue,
  selectRandom,
  somewhatValidConfig,
  times,
} from './utils';
import {Configuration} from '../lib/configuration';
import {UnitConfig} from '../models/units';
import {GlobalConfig, LogLevel} from '../models/global-config';
import {Action} from '../lib/action';
import {UnitBase} from '../lib/abstract-unit-base';
import {AsyncSystem} from '../lib/async-system';
import {Cluster} from '../lib/cluster';
import {DictUnit} from '../lib/dict-unit';
import {GenericUnit} from '../lib/generic-unit';
import {ListUnit} from '../lib/list-unit';
import {ClusterItems} from '../models/cluster';
import {AsyncSystemConfig} from '../models/async-system';
import {logInfo, logWarn} from '../utils/logger';
import {isObject, NOOP} from '../utils/funcs';

const unitsConfigOptions: Array<keyof UnitConfig<any>> = [
  'id',
  'immutable',
  'initialValue',
  'cacheSize',
];

const asyncSystemConfigOptions: Array<keyof AsyncSystemConfig<any, any, any>> = [
  'id',
  'autoUpdatePendingValue',
  'freezeQueryWhilePending',
  'clearDataOnError',
  'clearDataOnQuery',
  'clearErrorOnData',
  'clearErrorOnQuery',
  'clearQueryOnData',
  'clearQueryOnError',
  'initialValue',
  'UNITS',
  'QUERY_UNIT',
  'DATA_UNIT',
  'ERROR_UNIT',
  'PENDING_UNIT',
];

const globalConfigOptions: Array<keyof GlobalConfig> = [
  'ENVIRONMENT',
  'ACTION',
  'UNITS',
  'ASYNC_SYSTEM',
  'CLUSTER',
  'BOOL_UNIT',
  'DICT_UNIT',
  'GENERIC_UNIT',
  'LIST_UNIT',
  'NUM_UNIT',
  'STRING_UNIT',
];

describe(
  'Environment',
  times(30, () => {
    beforeAll(() => {
      Configuration.reset();
    });

    describe('dev/prod modes', () => {
      it('should be dev mode by default', () => {
        if (randomBoolean()) {
          Configuration.set(randomConfig(globalConfigOptions));
        }
        expect(Configuration.isDevMode()).toBe(true);
      });

      it('should enable prod mode', () => {
        if (randomBoolean()) {
          Configuration.set(randomConfig(globalConfigOptions));
        }
        Configuration.enableProdMode();
        expect(Configuration.isDevMode()).toBe(false);

        // need to disable it for other tests
        // @ts-ignore
        Configuration._isDevMode = true;
      });

      it('should disallow ENVIRONMENT configuration, when in prod mode', () => {
        const ENVIRONMENT = {
          checkUniqueId: randomBoolean(),
          checkImmutability: randomBoolean(),
          checkSerializability: randomBoolean(),
          logLevel: selectRandom([LogLevel.NONE, LogLevel.INFO, LogLevel.WARN]),
        };
        if (randomBoolean()) {
          Configuration.enableProdMode();
        }
        Configuration.set({ENVIRONMENT});
        if (randomBoolean()) {
          Configuration.enableProdMode();
        }

        if (Configuration.isDevMode()) {
          expect(Configuration.ENVIRONMENT).toEqual(ENVIRONMENT);
        } else {
          expect(Configuration.ENVIRONMENT).toEqual({});
        }

        // need to disable it for other tests
        // @ts-ignore
        Configuration._isDevMode = true;
      });
    });

    describe('checkUniqueId', () => {
      let id: string;
      let clusterItems: ClusterItems;
      const createInstance = c => (c === Cluster ? new c(clusterItems, {id}) : new c({id}));

      beforeEach(() => {
        Configuration.set({ENVIRONMENT: {checkUniqueId: booleanOrRandomValue(0.8)}});
        id = randomString();
        clusterItems = randomClusterItems();
      });

      it('checks unique id', () => {
        const ctor1 = selectRandom(ALL_CTORS);
        const ctor2 = selectRandom(ALL_CTORS);
        createInstance(ctor1);

        if (Configuration.ENVIRONMENT.checkUniqueId === true) {
          expect(() => createInstance(ctor1)).toThrowError();
          expect(() => createInstance(ctor2)).toThrowError();
        } else {
          expect(() => createInstance(ctor1)).not.toThrowError();
          expect(() => createInstance(ctor2)).not.toThrowError();
        }
      });

      it('should not throw if instance created on same location', () => {
        const ctor = selectRandom(ALL_CTORS);

        Array(randomNumber(1, 5))
          .fill(null)
          .forEach(() => {
            expect(() => createInstance(ctor)).not.toThrowError();
          });
      });
    });

    describe('checkImmutability', () => {
      beforeEach(() => {
        Configuration.set({ENVIRONMENT: {checkImmutability: booleanOrRandomValue(0.8)}});
      });

      it('checks Units', () => {
        const unitCtor = randomUnitCtor();
        const unit = new unitCtor(somewhatValidConfig(unitsConfigOptions, unitCtor, 1, 3));
        let emittedValue;
        unit.subscribe(v => (emittedValue = v));

        if (randomBoolean()) {
          unit.dispatch(randomValidValue(unit));
        }

        const nonPrimitiveValue = isObject(unit.value());
        const nonPrimitiveEmittedValue = isObject(emittedValue);

        if (nonPrimitiveValue && Configuration.ENVIRONMENT.checkImmutability === true) {
          if (unit.config.immutable === true) {
            expect(() => randomMutation(unit.value())).not.toThrowError();
            expect(() => randomMutation(unit.rawValue())).toThrowError();
            expect(() => unit.dispatch(v => randomMutation(v))).not.toThrowError();
          } else {
            expect(() => randomMutation(unit.rawValue())).toThrowError();
            expect(() => unit.dispatch(v => randomMutation(v))).toThrowError();
            expect(() => randomMutation(unit.value())).toThrowError();
          }

          if (nonPrimitiveEmittedValue && unit.config.immutable !== true) {
            expect(() => randomMutation(emittedValue)).toThrowError();
          } else {
            expect(() => randomMutation(emittedValue)).not.toThrowError();
          }
        } else {
          expect(() => randomMutation(unit.rawValue())).not.toThrowError();
          expect(() => randomMutation(unit.value())).not.toThrowError();
          expect(() => unit.dispatch(v => randomMutation(v))).not.toThrowError();
          expect(() => randomMutation(emittedValue)).not.toThrowError();
        }
      });

      it('checks Action', () => {
        // Action's config is a subset of GenericUnit's config
        const action = new Action(somewhatValidConfig(unitsConfigOptions, GenericUnit, 1, 3));
        let emittedValue;
        action.subscribe(v => (emittedValue = v));

        if (randomBoolean()) {
          action.dispatch(randomValue());
        }

        const nonPrimitiveValue = isObject(action.value());
        const nonPrimitiveEmittedValue = isObject(emittedValue);

        if (nonPrimitiveValue && Configuration.ENVIRONMENT.checkImmutability === true) {
          expect(() => randomMutation(action.value())).toThrowError();
          expect(() => action.dispatch(v => randomMutation(v))).toThrowError();
          if (nonPrimitiveEmittedValue) {
            expect(() => randomMutation(emittedValue)).toThrowError();
          } else {
            expect(() => randomMutation(emittedValue)).not.toThrowError();
          }
        } else {
          expect(() => randomMutation(action.value())).not.toThrowError();
          expect(() => action.dispatch(v => randomMutation(v))).not.toThrowError();
          expect(() => randomMutation(emittedValue)).not.toThrowError();
        }
      });

      it('checks AsyncSystem', () => {
        // Action's config is a subset of GenericUnit's config
        const system = new AsyncSystem(
          randomAsyncSystemConfig(asyncSystemConfigOptions, unitsConfigOptions, 1, 3)
        );
        const {queryUnit, dataUnit, errorUnit, pendingUnit} = system;
        let emittedValue;
        system.subscribe(v => (emittedValue = v));

        if (randomBoolean()) {
          const unit = selectRandom([queryUnit, dataUnit, errorUnit, pendingUnit]);
          unit.dispatch(randomValidValue(unit));
        }

        if (Configuration.ENVIRONMENT.checkImmutability === true) {
          expect(() => randomMutation(system.value())).toThrowError();
          expect(() => randomMutation(emittedValue)).toThrowError();
        } else {
          expect(() => randomMutation(system.value())).not.toThrowError();
          expect(() => randomMutation(emittedValue)).not.toThrowError();
        }
      });

      it('checks Cluster', () => {
        const cluster = new Cluster(randomClusterItems());
        let emittedValue;
        cluster.subscribe(v => (emittedValue = v));

        if (randomBoolean()) {
          const unit = Object.values(cluster.items).find(o => o instanceof UnitBase) as UnitBase<
            any
          >;
          if (unit) {
            unit.dispatch(randomValidValue(unit));
          }
        }

        if (Configuration.ENVIRONMENT.checkImmutability === true) {
          expect(() => randomMutation(cluster.value())).toThrowError();
          expect(() => randomMutation(emittedValue)).toThrowError();
        } else {
          expect(() => randomMutation(cluster.value())).not.toThrowError();
          expect(() => randomMutation(emittedValue)).not.toThrowError();
        }
      });
    });

    describe('checkSerializability', () => {
      const ctors = [GenericUnit, DictUnit, ListUnit];
      let ctor: new (config?) => DictUnit<any> | ListUnit<any> | GenericUnit<any>;
      let unit: DictUnit<any> | ListUnit<any> | GenericUnit<any>;

      it('should not throw for serializable values', () => {
        Configuration.set({
          ENVIRONMENT: {checkSerializability: booleanOrRandomValue()},
        });
        ctor = selectRandom(ctors);
        unit = new ctor(somewhatValidConfig(unitsConfigOptions, ctor, 1));

        expect(() => unit.dispatch(randomValidValue(ctor))).not.toThrowError();
        expect(() => unit.dispatch(() => randomValidValue(ctor))).not.toThrowError();

        if (unit instanceof DictUnit) {
          expect(() => selectRandom(DICT_UNIT_MUTATION_FNS)(unit)).not.toThrowError();
          expect(() => selectRandom(DICT_UNIT_MUTATION_FNS)(unit)).not.toThrowError();
          expect(() => selectRandom(DICT_UNIT_MUTATION_FNS)(unit)).not.toThrowError();
          expect(() => selectRandom(DICT_UNIT_MUTATION_FNS)(unit)).not.toThrowError();
        } else if (unit instanceof ListUnit) {
          expect(() => selectRandom(LIST_UNIT_MUTATION_FNS)(unit)).not.toThrowError();
          expect(() => selectRandom(LIST_UNIT_MUTATION_FNS)(unit)).not.toThrowError();
          expect(() => selectRandom(LIST_UNIT_MUTATION_FNS)(unit)).not.toThrowError();
          expect(() => selectRandom(LIST_UNIT_MUTATION_FNS)(unit)).not.toThrowError();
        }
      });

      it('should throw for non-serializable values', () => {
        Configuration.set({ENVIRONMENT: {checkSerializability: true}});
        ctor = selectRandom(ctors);
        unit = new ctor({immutable: booleanOrRandomValue()});

        class A {}
        const nonSerializable = selectRandom([new A(), new Date(), new Map(), new Set(), () => {}]);

        if (typeof nonSerializable !== 'function') {
          expect(() => unit.dispatch(nonSerializable)).toThrowError();
        }
        expect(() => unit.dispatch(() => nonSerializable)).toThrowError();

        if (ctor === DictUnit) {
          const u = unit as DictUnit<any>;
          expect(() => u.set(randomNumber(0, 10), nonSerializable)).toThrowError();
          expect(() => u.assign({[randomNumOrStr()]: nonSerializable})).toThrowError();
          return;
        }

        if (ctor === ListUnit) {
          const u = unit as ListUnit<any>;
          expect(() => u.push(nonSerializable)).toThrowError();
          expect(() => u.unshift(nonSerializable)).toThrowError();
          expect(() => u.splice(0, 0, nonSerializable)).toThrowError();
          expect(() => u.set(randomNumber(0, 10), nonSerializable)).toThrowError();
          expect(() => u.insert(randomNumber(0, 10), nonSerializable)).toThrowError();
        }
      });
    });

    describe('logLevel', () => {
      it('should not log anything', () => {
        const randVal = randomValue(1);
        Configuration.set({ENVIRONMENT: {logLevel: randVal > 0 ? LogLevel.NONE : randVal}});

        expect(logInfo(randomValue(1))).toBe(NOOP);
        expect(logWarn(randomValue(1))).toBe(NOOP);
      });

      it('should only log warnings', () => {
        Configuration.set({ENVIRONMENT: {logLevel: LogLevel.WARN}});
        const messages = randomArray(1);
        spyOn(console, 'warn');

        expect(logInfo(randomValue(1))).toBe(NOOP);

        logWarn(...(messages as [any, ...any[]]))();
        expect(console.warn).toHaveBeenCalledWith(...messages);
      });

      it('should log info and warnings', () => {
        Configuration.set({ENVIRONMENT: {logLevel: LogLevel.INFO}});
        const messages = randomArray(1);
        spyOn(console, 'info');
        spyOn(console, 'warn');

        logInfo(...(messages as [any, ...any[]]))();
        logWarn(...(messages as [any, ...any[]]))();

        // tslint:disable-next-line:no-console
        expect(console.info).toHaveBeenCalledWith(...messages);
        expect(console.warn).toHaveBeenCalledWith(...messages);
      });
    });
  })
);
