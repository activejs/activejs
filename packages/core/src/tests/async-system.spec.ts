import {tap} from 'rxjs/operators';
import * as Faker from 'faker';
import {
  randomAsyncSystemConfig,
  randomBoolean,
  randomSelectMultiple,
  randomValidValue,
  randomValue,
  selectRandom,
  times,
} from './utils';
import {AsyncSystemConfig, AsyncSystemStreamObservableProducer} from '../models/async-system';
import {isValidId} from '../utils/funcs';
import {UnitConfig} from '../models/units';
import {AsyncSystem} from '../lib/async-system';
import {Configuration} from '../lib/configuration';
import {Base} from '../lib/abstract-base';
import {Stream} from '../lib/stream';
import {BoolUnit} from '../lib/bool-unit';
import {GenericUnit} from '../lib/generic-unit';
import {UnitBase} from '../lib/abstract-unit-base';
import createSpy = jasmine.createSpy;

const unitConfigOptions: Array<keyof UnitConfig<any>> = [
  // 'id', // tests with id  are done separately to keep other tests simple
  // 'immutable', // immutability tests are done separately to keep other tests simple
  // 'persistent', // persistence tests are done separately to keep other tests simple
  'replay',
  'initialValue',
  'cacheSize',
  'distinctDispatchCheck',
  'customDispatchCheck',
  'dispatchDebounce',
  'dispatchDebounceMode',
];

const asyncSystemConfigOptions: Array<keyof AsyncSystemConfig<any, any, any>> = [
  // 'id', // tests with id  are done separately to keep other tests simple
  'replay',
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

describe(
  'AsyncSystem',
  times(30, () => {
    beforeAll(() => {
      Configuration.reset();
    });

    describe('configuration', () => {
      let asyncSystem: AsyncSystem<any, any, any>;

      beforeEach(() => {
        Configuration.reset();
      });

      it('should extend Base', () => {
        expect(new AsyncSystem<any, any, any>()).toBeInstanceOf(Base);
      });

      it('should inherit global configuration', () => {
        Configuration.set({
          ASYNC_SYSTEM: randomAsyncSystemConfig(asyncSystemConfigOptions, unitConfigOptions),
        });

        const inlineConfig = randomAsyncSystemConfig(asyncSystemConfigOptions, unitConfigOptions);
        asyncSystem = new AsyncSystem(inlineConfig);

        const globalConfig = Configuration.ASYNC_SYSTEM;
        const {config} = asyncSystem;

        Object.keys(config).forEach(key => {
          if (inlineConfig.hasOwnProperty(key)) {
            expect(config[key]).toEqual(inlineConfig[key]);
          } else {
            expect(config[key]).toEqual(globalConfig[key]);
          }
        });
      });

      it('expect invalid id to throw', () => {
        const systemId = randomValue(1);
        const systemConfig = {
          ...randomAsyncSystemConfig(asyncSystemConfigOptions, unitConfigOptions),
          id: systemId,
        };

        if (systemId === undefined || isValidId(systemId)) {
          asyncSystem = new AsyncSystem(systemConfig);
          expect(asyncSystem.config.id).toBe(systemId);
        } else {
          expect(() => new AsyncSystem(systemConfig)).toThrow(
            new TypeError(
              `Invalid id provided, expected a non-empty string, got ${String(systemId)}`
            )
          );
        }
      });

      it('auto assign derived ids to the units', () => {
        const systemId = Faker.random.alphaNumeric();
        const systemConfig = {
          ...randomAsyncSystemConfig(asyncSystemConfigOptions, unitConfigOptions),
          id: systemId,
        };
        asyncSystem = new AsyncSystem(systemConfig);
        const {queryUnit, dataUnit, errorUnit, pendingUnit} = asyncSystem;

        expect(queryUnit.config.id).toBe(systemId + '_QUERY');
        expect(dataUnit.config.id).toBe(systemId + '_DATA');
        expect(errorUnit.config.id).toBe(systemId + '_ERROR');
        expect(pendingUnit.config.id).toBe(systemId + '_PENDING');
      });

      it('auto-id should not override inline unit id', () => {
        const systemId = randomBoolean() ? Faker.random.alphaNumeric() : undefined;
        const systemConfig: any = {
          ...randomAsyncSystemConfig(asyncSystemConfigOptions, unitConfigOptions),
          id: systemId,
        };
        if (randomBoolean()) {
          // tslint:disable:no-unused-expression
          systemConfig.queryUnit && (systemConfig.queryUnit.id = Faker.random.alphaNumeric());
          systemConfig.dataUnit && (systemConfig.dataUnit.id = Faker.random.alphaNumeric());
          systemConfig.errorUnit && (systemConfig.errorUnit.id = Faker.random.alphaNumeric());
          systemConfig.pendingUnit && (systemConfig.pendingUnit.id = Faker.random.alphaNumeric());
          // tslint:disable:no-unused-expression
        }
        asyncSystem = new AsyncSystem(systemConfig);
        const {queryUnit, dataUnit, errorUnit, pendingUnit} = asyncSystem;

        if (isValidId(systemId)) {
          expect(queryUnit.config.id).toBe(systemConfig.queryUnit?.id ?? systemId + '_QUERY');
          expect(dataUnit.config.id).toBe(systemConfig.dataUnit?.id ?? systemId + '_DATA');
          expect(errorUnit.config.id).toBe(systemConfig.errorUnit?.id ?? systemId + '_ERROR');
          expect(pendingUnit.config.id).toBe(systemConfig.pendingUnit?.id ?? systemId + '_PENDING');
        } else {
          expect(queryUnit.config.id).toBe(systemConfig.queryUnit?.id);
          expect(dataUnit.config.id).toBe(systemConfig.dataUnit?.id);
          expect(errorUnit.config.id).toBe(systemConfig.errorUnit?.id);
          expect(pendingUnit.config.id).toBe(systemConfig.pendingUnit?.id);
        }
      });
    });

    describe('relationships', () => {
      let asyncSystem: AsyncSystem<any, any, any>;
      let queryUnit: GenericUnit<any>;
      let dataUnit: GenericUnit<any>;
      let errorUnit: GenericUnit<any>;
      let pendingUnit: BoolUnit;

      let systemEmitCount: number;
      let queryUnitEmitCount: number;
      let dataUnitEmitCount: number;
      let errorUnitEmitCount: number;
      let pendingUnitEmitCount: number;

      const dispatchRandomValues = (): number => {
        const someUnits = randomSelectMultiple([queryUnit, dataUnit, errorUnit, pendingUnit]);
        return someUnits
          .map(unit => {
            const shouldDispatchDuplicate = randomBoolean();
            return unit.dispatch(shouldDispatchDuplicate ? unit.value() : randomValidValue(unit), {
              bypassDebounce: true,
            });
          })
          .filter(didDispatch => didDispatch).length;
      };

      beforeEach(() => {
        Configuration.reset();

        asyncSystem = new AsyncSystem<any, any, any>(
          randomAsyncSystemConfig(asyncSystemConfigOptions, unitConfigOptions)
        );
        queryUnit = asyncSystem.queryUnit;
        dataUnit = asyncSystem.dataUnit;
        errorUnit = asyncSystem.errorUnit;
        pendingUnit = asyncSystem.pendingUnit;

        if (randomBoolean()) {
          dispatchRandomValues();
        }

        systemEmitCount = asyncSystem.emitCount;
        queryUnitEmitCount = queryUnit.emitCount;
        dataUnitEmitCount = dataUnit.emitCount;
        errorUnitEmitCount = errorUnit.emitCount;
        pendingUnitEmitCount = pendingUnit.emitCount;
      });

      it('should emit when member Units emit', () => {
        const successfulUnitDispatchCount = dispatchRandomValues();
        expect(asyncSystem.emitCount).toBe(systemEmitCount + successfulUnitDispatchCount);
      });

      it('should have combined derived value of units', () => {
        expect(asyncSystem.value()).toEqual({
          query: queryUnit.value(),
          data: dataUnit.value(),
          error: errorUnit.value(),
          pending: pendingUnit.value(),
        });
      });

      it('should auto-toggle pendingUnit', () => {
        // choose a random unit
        const primaryUnit: GenericUnit<any> = selectRandom([queryUnit, dataUnit, errorUnit]);
        // true for query, false for data and error
        const nextPendingValue: boolean = primaryUnit === queryUnit;

        const isAutoToggleOn = asyncSystem.config.autoUpdatePendingValue !== false;
        const wouldPendingUnitDispatch =
          isAutoToggleOn && pendingUnit.wouldDispatch(nextPendingValue);
        const primaryDispatchWorked = primaryUnit.dispatch(randomValue(), {bypassDebounce: true});

        if (primaryDispatchWorked) {
          if (wouldPendingUnitDispatch) {
            expect(pendingUnit.value()).toBe(nextPendingValue);
            expect(pendingUnit.emitCount).toBe(pendingUnitEmitCount + 1);
          } else {
            expect(pendingUnit.emitCount).toBe(pendingUnitEmitCount);
          }
          expect(asyncSystem.emitCount).toBe(systemEmitCount + 1);
        } else {
          expect(pendingUnit.emitCount).toBe(pendingUnitEmitCount);
          expect(asyncSystem.emitCount).toBe(systemEmitCount);
        }
      });

      it('should auto-clear error', () => {
        const primaryUnit: GenericUnit<any> = randomBoolean() ? queryUnit : dataUnit;
        const isAutoClearOn =
          primaryUnit === queryUnit
            ? asyncSystem.config.clearErrorOnQuery === true
            : asyncSystem.config.clearErrorOnQuery !== true &&
              asyncSystem.config.clearErrorOnData !== false;
        const wouldErrorUnitEmit = isAutoClearOn && !errorUnit.isEmpty;
        const primaryDispatchWorked = primaryUnit.dispatch(randomValue(), {bypassDebounce: true});

        if (primaryDispatchWorked) {
          if (isAutoClearOn) {
            expect(errorUnit.value()).toBe(undefined);
            expect(errorUnit.emitCount).toBe(errorUnitEmitCount + (wouldErrorUnitEmit ? 1 : 0));
          } else {
            expect(errorUnit.emitCount).toBe(errorUnitEmitCount);
          }
          expect(asyncSystem.emitCount).toBe(systemEmitCount + 1);
        } else {
          expect(errorUnit.emitCount).toBe(errorUnitEmitCount);
          expect(asyncSystem.emitCount).toBe(systemEmitCount);
        }
      });

      it('should auto-clear data', () => {
        const primaryUnit: GenericUnit<any> = randomBoolean() ? queryUnit : errorUnit;
        const isAutoClearOn =
          primaryUnit === queryUnit
            ? asyncSystem.config.clearDataOnQuery === true
            : asyncSystem.config.clearDataOnQuery !== true &&
              asyncSystem.config.clearDataOnError === true;
        const wouldDataUnitEmit = isAutoClearOn && !dataUnit.isEmpty;
        const primaryDispatchWorked = primaryUnit.dispatch(randomValue(), {bypassDebounce: true});

        if (primaryDispatchWorked) {
          if (isAutoClearOn) {
            expect(dataUnit.value()).toBe(undefined);
            expect(dataUnit.emitCount).toBe(dataUnitEmitCount + (wouldDataUnitEmit ? 1 : 0));
          } else {
            expect(dataUnit.emitCount).toBe(dataUnitEmitCount);
          }
          expect(asyncSystem.emitCount).toBe(systemEmitCount + 1);
        } else {
          expect(dataUnit.emitCount).toBe(dataUnitEmitCount);
          expect(asyncSystem.emitCount).toBe(systemEmitCount);
        }
      });

      it('should auto-clear query', () => {
        const primaryUnit: GenericUnit<any> = randomBoolean() ? dataUnit : errorUnit;
        const isAutoClearOn =
          (!queryUnit.isFrozen || asyncSystem.config.autoUpdatePendingValue !== false) &&
          (primaryUnit === dataUnit
            ? asyncSystem.config.clearQueryOnData === true
            : asyncSystem.config.clearQueryOnError === true);
        const wouldQueryUnitEmit = isAutoClearOn && !queryUnit.isEmpty;
        const primaryDispatchWorked = primaryUnit.dispatch(randomValue(), {bypassDebounce: true});

        if (primaryDispatchWorked) {
          if (isAutoClearOn) {
            expect(queryUnit.value()).toBe(undefined);
            expect(queryUnit.emitCount).toBe(queryUnitEmitCount + (wouldQueryUnitEmit ? 1 : 0));
          } else {
            expect(queryUnit.emitCount).toBe(queryUnitEmitCount);
          }
          expect(asyncSystem.emitCount).toBe(systemEmitCount + 1);
        } else {
          expect(queryUnit.emitCount).toBe(queryUnitEmitCount);
          expect(asyncSystem.emitCount).toBe(systemEmitCount);
        }
      });

      it('should toggle-freeze query on pending', () => {
        if (randomBoolean()) {
          queryUnit.freeze();
        }

        const originalFrozenState = queryUnit.isFrozen;
        const randomUnit: UnitBase<any> = selectRandom([
          queryUnit,
          dataUnit,
          errorUnit,
          pendingUnit,
        ]);
        randomUnit.dispatch(randomValidValue(randomUnit), {
          bypassDebounce: true,
        });
        const pendingUnitEmitted = pendingUnit.emitCount > pendingUnitEmitCount;

        if (asyncSystem.config.freezeQueryWhilePending === true && pendingUnitEmitted) {
          expect(queryUnit.isFrozen).toBe(pendingUnit.value());
        } else {
          expect(queryUnit.isFrozen).toBe(originalFrozenState);
        }
      });

      it('should createStream', () => {
        const operatorSpy = createSpy('operatorSpy');

        const observableProducer = createSpy<AsyncSystemStreamObservableProducer<any, any, any>>(
          'observableProducer'
        ).and.callFake((qU, dU, eU, pU) => {
          return qU.pipe(tap(v => operatorSpy(v)));
        });

        const stream = asyncSystem.createStream(observableProducer);

        expect(stream).toBeInstanceOf(Stream);
        expect(observableProducer).toHaveBeenCalledWith(
          queryUnit,
          dataUnit,
          errorUnit,
          pendingUnit
        );

        if (queryUnit.config.replay === false) {
          expect(operatorSpy).not.toHaveBeenCalled();
        } else {
          expect(operatorSpy).toHaveBeenCalledWith(queryUnit.value());
        }

        operatorSpy.calls.reset();

        if (queryUnit.dispatch(randomValue(1), {bypassDebounce: true})) {
          expect(operatorSpy).toHaveBeenCalledWith(queryUnit.value());
        } else {
          expect(operatorSpy).not.toHaveBeenCalled();
        }
      });

      it('should pause relationships', () => {
        if (randomBoolean()) {
          queryUnit.freeze();
        }
        asyncSystem.pauseRelationships();
        expect(asyncSystem.relationshipsWorking).toBe(false);
        asyncSystem.pauseRelationships(); // this should have no effect

        const wasQueryUnitFrozen = queryUnit.isFrozen;
        dispatchRandomValues();

        expect(queryUnit.isFrozen).toBe(wasQueryUnitFrozen);
        expect(asyncSystem.emitCount).toBe(systemEmitCount);
        expect(asyncSystem.relationshipsWorking).toBe(false);
      });

      it('should resume relationships', () => {
        asyncSystem.pauseRelationships();
        expect(asyncSystem.relationshipsWorking).toBe(false);

        const someDidDispatch: boolean = dispatchRandomValues() !== 0;

        asyncSystem.resumeRelationships();
        expect(asyncSystem.relationshipsWorking).toBe(true);
        asyncSystem.resumeRelationships(); // this should have no effect

        if (someDidDispatch) {
          expect(asyncSystem.emitCount).toBe(systemEmitCount + 1);
        } else {
          expect(asyncSystem.emitCount).toBe(systemEmitCount);
        }
      });
    });
  })
);
