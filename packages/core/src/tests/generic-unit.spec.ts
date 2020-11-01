import {Configuration} from '../lib/configuration';
import {GenericUnit} from '../lib/generic-unit';
import {UnitConfig} from '../models/units';
import {randomBoolean, randomNumber, randomValidValue, somewhatValidConfig, times} from './utils';
import {findIndex, findIndexBackwards} from '../utils/funcs';

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
  'GenericUnit',
  times(30, () => {
    beforeAll(() => {
      Configuration.reset();
    });

    describe('basic tests', () => {
      let unit: GenericUnit<any>;
      let emitCount: number;
      let value: any;
      let cachedValues: any[];

      beforeEach(() => {
        unit = new GenericUnit(somewhatValidConfig(configOptions, GenericUnit));

        // dispatch 10 times
        Array(10)
          .fill(null)
          .forEach(() => {
            unit.dispatch(randomValidValue(unit, 1));
          });

        unit.jump(randomNumber(1, unit.cachedValuesCount - 2));

        value = unit.value();
        emitCount = unit.emitCount;
        cachedValues = unit.cachedValues();
      });

      it('checks objectKeys method', () => {
        expect(unit.objectKeys()).toEqual(value == null ? [] : Object.keys(value));

        value = randomValidValue(GenericUnit);
        if (unit.dispatch(value)) {
          expect(unit.objectKeys()).toEqual(value == null ? [] : Object.keys(value));
        }
      });

      it('checks objectEntries method', () => {
        expect(unit.objectEntries()).toEqual(value == null ? [] : Object.entries(value));

        value = randomValidValue(GenericUnit);
        if (unit.dispatch(value)) {
          expect(unit.objectEntries()).toEqual(value == null ? [] : Object.entries(value));
        }
      });

      it('checks objectValues method', () => {
        expect(unit.objectValues()).toEqual(value == null ? [] : Object.values(value));

        value = randomValidValue(GenericUnit);
        if (unit.dispatch(value)) {
          expect(unit.objectValues()).toEqual(value == null ? [] : Object.values(value));
        }
      });

      it('should skipNilValues', () => {
        const direction = randomBoolean() ? 'BACK' : 'FORWARD';
        const nonNilIndex =
          direction === 'BACK'
            ? findIndexBackwards(cachedValues, v => v != null, unit.cacheIndex - 1)
            : findIndex(cachedValues, v => v != null, unit.cacheIndex + 1);

        let navigationWorked: boolean;
        const prevIndex = unit.cacheIndex;

        if (direction === 'BACK') {
          navigationWorked = unit.goBack(true);
        } else {
          navigationWorked = unit.goForward(true);
        }

        if (nonNilIndex >= 0 && nonNilIndex !== prevIndex) {
          expect(navigationWorked).toBe(true);
          expect(unit.value()).toBe(cachedValues[nonNilIndex]);
          expect(unit.emitCount).toBe(emitCount + 1);
        } else {
          expect(navigationWorked).toBe(false);
          expect(unit.emitCount).toBe(emitCount);
        }

        expect(unit.cachedValues()).toEqual(cachedValues);
      });

      it('should freeze', () => {
        unit.freeze();
        const skipNilValues = randomBoolean();

        expect(unit.goBack(skipNilValues)).toBe(false);
        expect(unit.goForward(skipNilValues)).toBe(false);

        expect(unit.isFrozen).toBe(true);
        expect(unit.cachedValues()).toEqual(cachedValues);
        expect(unit.emitCount).toBe(emitCount);
      });
    });
  })
);
