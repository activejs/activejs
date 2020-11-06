import {Observable, Subscription} from 'rxjs';
import {tap} from 'rxjs/operators';
import {
  DispatchFailReason,
  EventReplay,
  EventUnitClear,
  EventUnitClearCache,
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
import {Stream} from '../lib/stream';
import {NonPrimitiveUnitBase} from '../lib/abstract-non-primitive-unit-base';
import {Configuration} from '../lib/configuration';
import {Selection} from '../lib/selection';
import {UnitBase} from '../lib/abstract-unit-base';
import {Base} from '../lib/abstract-base';
import {
  findRandomPath,
  multipleOf,
  numberOrRandomValue,
  randomBoolean,
  randomNumber,
  randomNumOrStr,
  randomString,
  randomUnit,
  randomUnitCtor,
  randomValidValue,
  randomValue,
  randomValues,
  selectRandom,
  somewhatValidConfig,
  times,
  unitsDefaultValue,
} from './utils';
import {isNumber} from '../utils/funcs';
import createSpy = jasmine.createSpy;

const configOptions: Array<keyof UnitConfig<any>> = [
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

describe(
  'Units Common',
  times(30, () => {
    beforeAll(() => {
      Configuration.reset();
    });

    let unitConfig: UnitConfig<any>;
    let unit: UnitBase<any> & NonPrimitiveUnitBase<any>;

    describe('configuration', () => {
      beforeAll(() => {
        Configuration.reset();
      });

      it('should extend UnitBase', () => {
        expect(randomUnit()).toBeInstanceOf(UnitBase);
      });

      it('should extend Base', () => {
        expect(randomUnit()).toBeInstanceOf(Base);
      });

      describe('Inheriting from Global Configuration', () => {
        beforeEach(() => {
          Configuration.reset();
        });

        it('should inherit', () => {
          Configuration.set({UNITS: {cacheSize: 3}});

          unit = randomUnit();

          expect(unit.cacheSize).toBe(3);
        });

        it('should not inherit after instantiation', () => {
          unit = randomUnit();

          Configuration.set({UNITS: {cacheSize: 3}});

          expect(unit.cacheSize).toBe(2);
        });

        it('should prioritize specific Unit type config over common Units config', () => {
          const unitCtor = randomUnitCtor();
          const unitClassKey = unitCtor.name.replace(/(?<!^)([A-Z])/g, '_$1').toUpperCase();

          Configuration.set({
            UNITS: {cacheSize: 3},
            [unitClassKey]: {cacheSize: 4},
          });

          unit = new unitCtor();

          expect(unit.cacheSize).toBe(4);
        });
      });

      describe('Different Configurations', () => {
        beforeAll(() => {
          Configuration.reset();
        });

        beforeEach(() => {
          const unitCtor = randomUnitCtor();
          unitConfig = {
            ...somewhatValidConfig(configOptions, unitCtor),
            initialValue: randomValidValue(unitCtor),
          };
          unit = new unitCtor(unitConfig);
        });

        it('should have events', () => {
          expect(unit.events$).toBeInstanceOf(Observable);
        });

        it('should have valid replay config', () => {
          if (typeof unitConfig.replay === 'boolean') {
            expect(unitConfig.replay).toBe(unit.config.replay);
          } else {
            expect(typeof unitConfig.replay).not.toBe('boolean');
          }
        });

        it('should respect initialValue', () => {
          expect(unit.initialValue()).toEqual(unitConfig.initialValue);
          expect(unit.value()).toEqual(unitConfig.initialValue);
        });

        it('should respect cacheSize', () => {
          const {cacheSize} = unitConfig;
          expect(unit.cacheSize).toBe(isNumber(cacheSize) ? Math.max(1, cacheSize) : 2);
        });

        it('should respect replay-nes', () => {
          unit = randomUnit(unitConfig);

          const callBackSpy = createSpy();
          unit.subscribe(callBackSpy);

          if (unit.config.replay === false) {
            expect(callBackSpy).not.toHaveBeenCalled();
          } else {
            expect(callBackSpy).toHaveBeenCalledWith(unit.value());
          }
        });

        it('should respect dispatch checks', () => {
          const wouldCustomCheckAllow =
            typeof unitConfig.customDispatchCheck !== 'function' ||
            unitConfig.customDispatchCheck(1, 2);
          const wouldDistinctCheckAllow =
            unitConfig.distinctDispatchCheck !== true || unit.value() !== unit.value();

          let event;
          unit.events$.subscribe(e => (event = e));

          const {emitCount} = unit;
          const dispatchOptions = {bypassDebounce: true};
          const didDispatch = unit.dispatch(unit.value(), dispatchOptions);

          if (wouldCustomCheckAllow && wouldDistinctCheckAllow) {
            expect(didDispatch).toBe(true);
            expect(unit.emitCount).toBe(emitCount + 1);
            expect(event).toBeInstanceOf(EventUnitDispatch);
            return;
          }

          expect(didDispatch).toBe(false);
          expect(unit.emitCount).toBe(emitCount);
          expect(event).toBeInstanceOf(EventUnitDispatchFail);
          expect(event).toEqual(
            new EventUnitDispatchFail(
              unit.value(),
              wouldDistinctCheckAllow
                ? DispatchFailReason.CUSTOM_DISPATCH_CHECK
                : DispatchFailReason.DISTINCT_CHECK,
              dispatchOptions
            )
          );
        });

        it('should respect dispatchDebounce and dispatchDebounceMode', () => {
          const {dispatchDebounce, dispatchDebounceMode} = unitConfig;
          const debounceMode = ['START', 'BOTH'].includes(dispatchDebounceMode)
            ? dispatchDebounceMode
            : 'END';
          const didDispatch = unit.dispatch(randomValidValue(unit));

          if (dispatchDebounce === true || isNumber(dispatchDebounce)) {
            expect(didDispatch === undefined).toBe(debounceMode === 'END');
          } else {
            expect(typeof didDispatch === 'boolean').toBe(true);
          }
        });
      });
    });

    describe('basic Tests', () => {
      beforeAll(() => {
        Configuration.reset();
      });

      beforeEach(() => {
        const unitCtor = randomUnitCtor();
        unitConfig = somewhatValidConfig(configOptions, unitCtor);
        unit = new unitCtor(unitConfig);
      });

      it('should be observable', () => {
        expect(unit).toBeInstanceOf(Observable);
        expect(unit.asObservable()).toBeInstanceOf(Observable);
        expect((unit.asObservable() as any).source).toBe((unit as any).source);
      });

      it('should disallow invalid values', () => {
        const unitCtor = randomUnitCtor();
        unit = new unitCtor({
          ...somewhatValidConfig(configOptions, unitCtor),
          initialValue: randomValidValue(unit),
          distinctDispatchCheck: false,
          customDispatchCheck: null,
          dispatchDebounce: null,
        });

        randomValues().forEach(value => {
          const wouldDispatch = unit.wouldDispatch(value);
          let event: UnitEvents<any>;
          unit.events$.subscribe(e => (event = e));

          expect(unit.dispatch(value)).toBe(wouldDispatch);
          expect(event).toBeInstanceOf(wouldDispatch ? EventUnitDispatch : EventUnitDispatchFail);
          if (event instanceof EventUnitDispatchFail) {
            expect(event.reason).toBe(DispatchFailReason.INVALID_VALUE);
          }
        });
      });

      it('should not goBack, goForward, jump, jumpToStart, jumpToEnd', () => {
        const emitCount = unit.emitCount;
        const cachedValues = unit.cachedValues();

        expect(unit.goBack()).toBe(false);
        expect(unit.goForward()).toBe(false);
        expect(unit.jump(0)).toBe(false);
        expect(unit.jump(-2)).toBe(false);
        expect(unit.jump(3)).toBe(false);
        expect(unit.jumpToStart()).toBe(false);
        expect(unit.jumpToEnd()).toBe(false);

        expect(unit.cachedValues()).toEqual(cachedValues);
        expect(unit.emitCount).toBe(emitCount);
      });

      it('should not unmute even without events', () => {
        const emitCount = unit.emitCount;
        unit.mute();
        unit.unmute();
        unit.unmute();
        expect(unit.emitCount).toBe(emitCount);
      });
    });

    describe('medium to advanced tests', () => {
      let emitCount: number;
      let value: any;
      let cachedValues: any[];
      let event: UnitEvents<any>;
      let eventsSubscription: Subscription;

      beforeAll(() => {
        Configuration.reset();
      });

      beforeEach(() => {
        const unitCtor = randomUnitCtor();
        unitConfig = {
          ...somewhatValidConfig(configOptions, unitCtor),
          cacheSize: randomNumber(4, 20),
          dispatchDebounce: null,
          customDispatchCheck: null,
        };
        unit = new unitCtor(unitConfig);

        // dispatch 10 times
        Array(randomNumber(1, 10))
          .fill(null)
          .forEach(() => {
            // without `force` BoolUnit might not have enough cached values
            unit.dispatch(randomValidValue(unit), {force: true});
          });

        value = unit.value();
        emitCount = unit.emitCount;
        cachedValues = unit.cachedValues();

        event = undefined;
        if (eventsSubscription) {
          eventsSubscription.unsubscribe();
        }
        eventsSubscription = unit.events$.subscribe(e => (event = e));
      });

      it('should give rawValue', () => {
        if (unit.config.immutable === true) {
          expect(unit.rawValue()).not.toBe(value);
          expect(unit.rawValue()).toEqual(value);
        } else {
          expect(unit.rawValue()).toBe(value);
        }
      });

      it('should be empty, or not', () => {
        if (unit.isEmpty) {
          expect(unit.value()).toEqual(unitsDefaultValue(unit));
        } else {
          expect(unit.value()).not.toEqual(unitsDefaultValue(unit));
        }
      });

      it('should toJsonString', () => {
        expect(unit.toJsonString()).toBe(JSON.stringify(unit.value()));
      });

      it('should implement toString', () => {
        if (unit.value() == null) {
          expect(unit.toString).toThrow();
        } else {
          expect(unit.toString()).toBe(unit.value().toString());
        }
      });

      it('should implement toLocaleString', () => {
        if (value == null) {
          expect(() => unit.toLocaleString()).toThrowError(TypeError);
        } else {
          expect(unit.toLocaleString()).toBe(value.toLocaleString());
        }
      });

      it('should implement valueOf', () => {
        expect(unit.valueOf()).toBe(unit.rawValue());
      });

      it('should implement toJSON', () => {
        expect(unit.toJSON()).toEqual(unit.rawValue());
      });

      it('should implement propertyIsEnumerable', () => {
        const randString = selectRandom(
          Object.getOwnPropertyNames(value ?? 0).concat(multipleOf(randomString, 3))
        );

        if (value == null) {
          expect(() => unit.propertyIsEnumerable(randString)).toThrowError(TypeError);
        } else {
          expect(unit.propertyIsEnumerable(randString)).toEqual(
            value.propertyIsEnumerable(randString)
          );
        }
      });

      it('should implement hasOwnProperty', () => {
        const randString = selectRandom(
          Object.getOwnPropertyNames(value ?? 0).concat(multipleOf(randomString, 3))
        );

        if (value == null) {
          expect(() => unit.hasOwnProperty(randString)).toThrowError(TypeError);
        } else {
          expect(unit.hasOwnProperty(randString)).toEqual(value.hasOwnProperty(randString));
        }
      });

      it('should dispatch', () => {
        const validValue = randomValidValue(unit);
        const valOrProducer = randomBoolean() ? validValue : () => validValue;

        if (unit.wouldDispatch(validValue)) {
          expect(unit.dispatch(valOrProducer)).toBe(true);
          expect(unit.value()).toEqual(validValue);
        } else {
          expect(unit.dispatch(valOrProducer, {force: true})).toBe(true);
          expect(unit.value()).toEqual(validValue);
        }
      });

      it('should replace cache', () => {
        expect(unit.jump(-randomNumber(1, unit.cachedValuesCount - 1))).toBe(true);
        const validValue = randomValidValue(unit);
        const {cacheIndex} = unit;

        if (unit.wouldDispatch(validValue)) {
          expect(unit.dispatch(validValue, {cacheReplace: true})).toBe(true);
          expect(unit.value()).toEqual(validValue);
          expect(unit.cacheIndex).toEqual(cacheIndex);
        } else {
          expect().nothing();
        }
      });

      it('should behave like browser history', () => {
        expect(unit.jump(-randomNumber(1, unit.cachedValuesCount - 1))).toBe(true);
        const validValue = randomValidValue(unit);

        if (unit.wouldDispatch(validValue)) {
          expect(unit.dispatch(validValue)).toBe(true);
          expect(unit.value()).toEqual(validValue);
          expect(unit.cacheIndex).toEqual(unit.cachedValuesCount - 1);
          expect(unit.goForward()).toEqual(false);
        } else {
          expect().nothing();
        }
      });

      it('should replay', () => {
        expect(unit.replay()).toBe(true);

        expect(unit.value()).toEqual(value);
        expect(unit.emitCount).toBe(emitCount + 1);
        expect(unit.cachedValues()).toEqual(cachedValues);

        expect(event).toBeInstanceOf(EventReplay);
        expect(event).toEqual(new EventReplay(unit.value()));
      });

      it('should goBack', () => {
        expect(unit.jump(-randomNumber(1, unit.cachedValuesCount - 2))).toBe(true);

        if (unit.cacheIndex === 0) {
          expect(unit.goBack()).toBe(false);
          return;
        }

        const {cacheIndex} = unit;
        expect(unit.goBack()).toBe(true);

        expect(unit.value()).toEqual(cachedValues[cacheIndex - 1]);
        expect(unit.cacheIndex).toBe(cacheIndex - 1);
        expect(unit.emitCount).toBe(emitCount + 2);
        expect(unit.cachedValues()).toEqual(cachedValues);

        expect(event).toBeInstanceOf(EventUnitJump);
        expect(event).toEqual(new EventUnitJump(-1, cacheIndex - 1));
      });

      it('should goForward', () => {
        expect(unit.goBack()).toBe(true);
        const cacheIndex = unit.cacheIndex;
        expect(unit.goForward()).toBe(true);

        expect(unit.value()).toEqual(cachedValues[cacheIndex + 1]);
        expect(unit.emitCount).toBe(emitCount + 2);
        expect(unit.cachedValues()).toEqual(cachedValues);

        expect(event).toBeInstanceOf(EventUnitJump);
        expect(event).toEqual(new EventUnitJump(1, cacheIndex + 1));
      });

      it('should jumpToStart', () => {
        const {cacheIndex} = unit;

        unit.jumpToStart();

        expect(unit.value()).toEqual(cachedValues[0]);
        expect(unit.cacheIndex).toBe(0);
        expect(unit.emitCount).toBe(emitCount + 1);

        expect(event).toBeInstanceOf(EventUnitJump);
        expect(event).toEqual(new EventUnitJump(-cacheIndex, 0));
      });

      it('should jumpToEnd', () => {
        const {cachedValuesCount} = unit;

        expect(unit.jump(-randomNumber(1, cachedValuesCount - 1))).toBe(true);
        const {cacheIndex} = unit;
        expect(unit.jumpToEnd()).toBe(true);

        expect(unit.value()).toEqual(unit.getCachedValue(unit.cachedValuesCount - 1));
        expect(unit.emitCount).toBe(emitCount + 2);
        expect(unit.cachedValues()).toEqual(cachedValues);

        expect(event).toBeInstanceOf(EventUnitJump);
        expect(event).toEqual(
          new EventUnitJump(cachedValuesCount - cacheIndex - 1, cachedValuesCount - 1)
        );
      });

      it('should jump back', () => {
        let {cacheIndex} = unit;
        let jumpSteps = -randomNumber(1, cacheIndex);

        expect(unit.jump(jumpSteps)).toBe(true);

        cacheIndex += jumpSteps;
        emitCount++;

        if (cacheIndex > 1) {
          jumpSteps = -randomNumber(1, cacheIndex);
          expect(unit.jump(jumpSteps)).toBe(true);
          cacheIndex += jumpSteps;
          emitCount++;
        }

        expect(unit.value()).toEqual(unit.getCachedValue(cacheIndex));
        expect(unit.emitCount).toBe(emitCount);
        expect(unit.cachedValues()).toEqual(cachedValues);

        expect(event).toBeInstanceOf(EventUnitJump);
        expect(event).toEqual(new EventUnitJump(jumpSteps, cacheIndex));
      });

      it('should jump forward', () => {
        const {cachedValuesCount} = unit;

        expect(unit.jump(-randomNumber(1, cachedValuesCount - 1))).toBe(true);
        const {cacheIndex} = unit;
        const jumpSteps = randomNumber(1, cachedValuesCount - cacheIndex - 1);
        expect(unit.jump(jumpSteps)).toBe(true);

        expect(unit.value()).toEqual(unit.getCachedValue(cacheIndex + jumpSteps));
        expect(unit.emitCount).toBe(emitCount + 2);
        expect(unit.cachedValues()).toEqual(cachedValues);

        expect(event).toBeInstanceOf(EventUnitJump);
        expect(event).toEqual(new EventUnitJump(jumpSteps, cacheIndex + jumpSteps));
      });

      it('should reset value', () => {
        if (unit.value() === unit.initialValue()) {
          expect(unit.resetValue()).toBe(false);
          expect(unit.emitCount).toBe(emitCount);
          expect(event).toBe(undefined);
        } else {
          expect(unit.resetValue()).toBe(true);
          expect(unit.emitCount).toBe(emitCount + 1);
          expect(event).toBeInstanceOf(EventUnitResetValue);
        }

        expect(unit.value()).toEqual(unit.initialValue());
      });

      it('should clear value', () => {
        if (unit.emitCount === 0 || unit.isEmpty) {
          expect(unit.clearValue()).toBe(false);
          expect(unit.emitCount).toBe(emitCount);
          expect(event).toBe(undefined);
        } else {
          expect(unit.clearValue()).toBe(true);
          expect(unit.emitCount).toBe(emitCount + 1);
          expect(event).toBeInstanceOf(EventUnitClearValue);
        }

        expect(unit.value()).toEqual(unitsDefaultValue(unit));
      });

      it('should clear cache', () => {
        expect(unit.clearCache()).toBe(true);

        expect(unit.emitCount).toBe(emitCount);
        expect(unit.cachedValues()).toEqual([]);
        expect(event).toBeInstanceOf(EventUnitClearCache);
      });

      it('should clear cache: leave first value', () => {
        cachedValues = [cachedValues.shift()];

        expect(unit.clearCache({leaveFirst: true})).toBe(true);

        expect(unit.emitCount).toBe(emitCount);
        expect(unit.cachedValues()).toEqual(cachedValues);

        expect(event).toBeInstanceOf(EventUnitClearCache);
        expect(event).toEqual(new EventUnitClearCache({leaveFirst: true}));
      });

      it('should clear cache: leave last value', () => {
        cachedValues = [cachedValues.pop()];
        expect(unit.clearCache({leaveLast: true})).toBe(true);

        expect(unit.emitCount).toBe(emitCount);
        expect(unit.cachedValues()).toEqual(cachedValues);

        expect(event).toBeInstanceOf(EventUnitClearCache);
        expect(event).toEqual(new EventUnitClearCache({leaveLast: true}));
      });

      it('should clear cache: leave first and last values', () => {
        if (cachedValues.length < 3) {
          expect(unit.clearCache({leaveFirst: true, leaveLast: true})).toBe(false);
          return;
        }
        cachedValues = [cachedValues.shift(), cachedValues.pop()];
        expect(unit.clearCache({leaveFirst: true, leaveLast: true})).toBe(true);

        expect(unit.emitCount).toBe(emitCount);
        expect(unit.cachedValues()).toEqual(cachedValues);

        expect(event).toBeInstanceOf(EventUnitClearCache);
        expect(event).toEqual(new EventUnitClearCache({leaveFirst: true, leaveLast: true}));
      });

      it('should getCachedValue', () => {
        const randIndex = numberOrRandomValue();
        expect(unit.getCachedValue(randIndex)).toEqual(cachedValues[randIndex]);
      });

      it('should reset', () => {
        const wouldEmit = unit.value() !== unit.initialValue();

        unit.freeze();
        unit.reset();
        const cachedValuesThatWillRemain = unit.cachedValues().splice(-1);

        expect(unit.isFrozen).toBe(false);
        expect(unit.value()).toEqual(unit.initialValue());
        expect(unit.emitCount).toBe(emitCount + (wouldEmit ? 1 : 0));
        expect(unit.cachedValues()).toEqual(cachedValuesThatWillRemain);

        expect(event).toBeInstanceOf(EventUnitReset);
      });

      it('should clear', () => {
        const wouldEmit = !unit.isEmpty;

        unit.freeze();
        unit.clear();

        expect(unit.isFrozen).toBe(false);
        expect(unit.value()).toEqual(unitsDefaultValue(unit));
        expect(unit.emitCount).toBe(emitCount + (wouldEmit ? 1 : 0));
        expect(unit.cachedValues()).toEqual([]);

        expect(event).toBeInstanceOf(EventUnitClear);
      });

      it('should freeze', () => {
        unit.freeze();
        expect(event).toBeInstanceOf(EventUnitFreeze);
        expect(event).toEqual(new EventUnitFreeze());

        expect(unit.dispatch(randomValidValue(unit), {force: randomBoolean()})).not.toBe(true);
        expect((event as EventUnitDispatchFail<any>).reason).toBe(DispatchFailReason.FROZEN_UNIT);

        expect(unit.goBack()).toBe(false);
        expect(unit.goForward()).toBe(false);
        expect(unit.jump(0)).toBe(false);
        expect(unit.jump(-2)).toBe(false);
        expect(unit.jump(3)).toBe(false);
        expect(unit.jumpToStart()).toBe(false);
        expect(unit.jumpToEnd()).toBe(false);
        expect(unit.resetValue()).toBe(false);
        expect(unit.clearCache()).toBe(false);
        expect(unit.clearValue()).toBe(false);
        expect(unit.replay()).toBe(false);

        expect(unit.isFrozen).toBe(true);
        expect(unit.cachedValues()).toEqual(cachedValues);
        expect(unit.emitCount).toBe(emitCount);
      });

      it('should unfreeze', () => {
        unit.freeze();
        unit.dispatch(randomValidValue(unit), {force: randomBoolean()});

        unit.unfreeze();
        expect(event).toBeInstanceOf(EventUnitUnfreeze);
        expect(event).toEqual(new EventUnitUnfreeze());

        expect(unit.emitCount).toBe(emitCount);
        expect(unit.cachedValues()).toEqual(cachedValues);

        expect(unit.replay()).toBe(true);
        expect(unit.isFrozen).toBe(false);
      });

      it('should not freeze already frozen unit', () => {
        unit.freeze();
        expect(event).toBeInstanceOf(EventUnitFreeze);
        event = undefined;

        unit.freeze();
        expect(event).toBe(undefined);
      });

      it('should not unfreeze already unfrozen unit', () => {
        unit.freeze();
        unit.unfreeze();
        expect(event).toBeInstanceOf(EventUnitUnfreeze);
        event = undefined;

        unit.unfreeze();
        expect(event).toBe(undefined);
      });

      it('should mute', () => {
        unit.mute();

        unit.goBack();
        unit.goForward();
        unit.jump(0);
        unit.jump(-2);
        unit.jump(3);
        unit.jumpToStart();
        unit.jumpToEnd();
        unit.resetValue();
        unit.clearCache();
        unit.dispatch(randomValidValue(unit), {force: true});
        unit.clearValue();
        unit.dispatch(randomValidValue(unit), {force: true});
        unit.replay();
        unit.dispatch(randomValidValue(unit), {force: true});
        unit.clear();
        unit.dispatch(randomValidValue(unit), {force: true});
        unit.reset();
        unit.freeze();
        unit.unfreeze();

        expect(unit.isMuted).toBe(true);
        expect(event).toBe(undefined);
        expect(unit.emitCount).toBe(emitCount);

        expect(event).toBe(undefined);
      });

      it('should unmute', () => {
        unit.mute();
        const validValue = randomValidValue(unit);
        const didDispatch = unit.dispatch(validValue);

        unit.unmute();
        expect(event).toBeInstanceOf(EventUnitUnmute);

        if (didDispatch) {
          expect(unit.value()).toEqual(validValue);
          expect(unit.emitCount).toBe(emitCount + 1);
        } else {
          expect(unit.emitCount).toBe(emitCount);
          expect(unit.cachedValues()).toEqual(cachedValues);
        }

        expect(unit.replay()).toBe(true);
        expect(unit.isMuted).toBe(false);
      });

      it('should not unmute already unmuted unit', () => {
        unit.mute();
        unit.dispatch(randomValidValue(unit));
        unit.unmute();

        event = null;
        emitCount = unit.emitCount;
        unit.unmute();

        expect(unit.emitCount).toBe(emitCount);
        expect(event).not.toBeInstanceOf(EventUnitUnmute);
      });

      it('should not emit on subsequent mute-unmute', () => {
        unit.mute();
        unit.dispatch(randomValidValue(unit));
        unit.unmute();

        emitCount = unit.emitCount;
        unit.mute();
        unit.unmute();

        expect(unit.emitCount).toBe(emitCount);
      });

      it('should createStream', () => {
        const operatorSpy = createSpy('operatorSpy');

        const observableProducer = createSpy<UnitStreamObservableProducer>(
          'observableProducer'
        ).and.callFake(sourceUnit => {
          return sourceUnit.pipe(tap(v => operatorSpy(v)));
        });

        const stream = unit.createStream(observableProducer);

        expect(stream).toBeInstanceOf(Stream);
        expect(observableProducer).toHaveBeenCalledWith(unit);

        if (unit.config.replay === false) {
          expect(operatorSpy).not.toHaveBeenCalled();
        } else {
          expect(operatorSpy).toHaveBeenCalledWith(unit.value());
        }

        operatorSpy.calls.reset();

        if (unit.dispatch(randomValue(1))) {
          expect(operatorSpy).toHaveBeenCalledWith(unit.value());
        } else {
          expect(operatorSpy).not.toHaveBeenCalled();
        }
      });

      it('should return Selection for NonPrimitive Units', () => {
        if (unit instanceof NonPrimitiveUnitBase) {
          let randPath = findRandomPath(unit.value());
          if (!randPath.length) {
            randPath = [randomNumOrStr()];
          }
          const selection = unit.select(...(randPath as [any]));
          expect(selection).toBeInstanceOf(Selection);
        } else {
          expect((unit as any).select).toBe(undefined);
        }
      });
    });
  })
);
