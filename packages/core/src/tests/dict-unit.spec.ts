import * as Faker from 'faker';
import {DictValue, UnitConfig} from '../models/units';
import {
  booleanOrRandomValue,
  DICT_UNIT_MUTATION_FNS,
  randomBoolean,
  randomDictObject,
  randomKeys,
  randomNumber,
  randomValidValue,
  randomValue,
  randomValuePureFn,
  selectRandom,
  somewhatValidConfig,
  times,
} from './utils';
import {deepCopy, isDict, isObject, IteratorSymbol} from '../utils/funcs';
import {Configuration} from '../lib/configuration';
import {DictUnit} from '../lib/dict-unit';
import {EventDictUnitAssign, EventDictUnitDelete, EventDictUnitSet} from '../models/events';

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
  'DictUnit',
  times(30, () => {
    beforeAll(() => {
      Configuration.reset();
    });

    describe('basic tests', () => {
      let unit: DictUnit<any>;
      let unitValue: DictValue<any>;

      beforeEach(() => {
        unitValue = randomDictObject(1);
        unit = new DictUnit<any>({initialValue: unitValue});
      });

      it('should only allow dictionaries', () => {
        const randValue = randomValue(1);
        const originalUnitValue = unit.value();
        unit.dispatch(randValue);

        if (isDict(randValue)) {
          expect(unit.value()).toEqual(randValue);
        } else {
          expect(unit.value()).toBe(originalUnitValue);
        }
      });

      it('should have valid length', () => {
        expect(unit.length).toBe(isDict(unitValue) ? Object.keys(unitValue).length : 0);

        unitValue = randomDictObject(1);
        unit.dispatch(unitValue);

        expect(unit.length).toBe(Object.keys(unitValue).length);
      });

      it('checks objectKeys method', () => {
        expect(unit.objectKeys()).toEqual(Object.keys(unitValue));

        unitValue = randomDictObject(1);
        unit.dispatch(unitValue);

        expect(unit.objectKeys()).toEqual(Object.keys(unitValue));
      });

      it('checks objectEntries method', () => {
        expect(unit.objectEntries()).toEqual(Object.entries(unitValue));

        unitValue = randomDictObject(1);
        unit.dispatch(unitValue);

        expect(unit.objectEntries()).toEqual(Object.entries(unitValue));
      });

      it('checks objectValues method', () => {
        expect(unit.objectValues()).toEqual(Object.values(unitValue));

        unitValue = randomDictObject(1);
        unit.dispatch(unitValue);

        expect(unit.objectValues()).toEqual(Object.values(unitValue));
      });

      it('should be iterable', () => {
        expect(typeof unit[IteratorSymbol]).toBe('function');
        expect(typeof unit[IteratorSymbol]().next).toBe('function');
        expect([...unit]).toEqual(unit.objectEntries());
        expect(unitValue).toEqual(unit.value());
      });

      it('should not mutate when frozen', () => {
        const length = unit.length;
        const emitCount = unit.emitCount;
        unit.freeze();

        selectRandom(DICT_UNIT_MUTATION_FNS)(unit);
        selectRandom(DICT_UNIT_MUTATION_FNS)(unit);
        selectRandom(DICT_UNIT_MUTATION_FNS)(unit);

        expect(length).toBe(unit.length);
        expect(emitCount).toBe(unit.emitCount);
        expect(unitValue).toEqual(unit.value());
      });

      it('should not emit when muted', () => {
        const emitCount = unit.emitCount;
        unit.mute();

        selectRandom(DICT_UNIT_MUTATION_FNS)(unit);
        selectRandom(DICT_UNIT_MUTATION_FNS)(unit);
        selectRandom(DICT_UNIT_MUTATION_FNS)(unit);

        expect(emitCount).toBe(unit.emitCount);
        expect(unit.isMuted).toBe(true);
      });
    });

    describe('read-only methods', () => {
      let unit: DictUnit<any>;
      let unitValue: DictValue<any>;
      let emitCount: number;
      let dictLength: number;

      beforeEach(() => {
        unit = new DictUnit(somewhatValidConfig(configOptions, DictUnit));
        if (randomBoolean(0.8)) {
          unit.dispatch(randomValidValue(DictUnit, randomNumber(1, 3)));
        }
        unitValue = unit.value();
        emitCount = unit.emitCount;
        dictLength = unit.length;
      });

      it('checks "forEvery" method', () => {
        const callbackSpy = jasmine.createSpy();
        const objectEntries = unit.objectEntries();

        unit.forEvery((val, key, index, entries) => {
          callbackSpy();
          expect(val).toEqual(unitValue[key as any]);
          expect(objectEntries[index]).toEqual(entries[index]);
          expect(objectEntries[index]).toEqual([key, val]);
        });

        expect(callbackSpy).toHaveBeenCalledTimes(dictLength);
      });

      it('checks "get" method', () => {
        const randKey = randomValue(1);
        expect(unit.get(randKey)).toEqual(unitValue[randKey]);
        expect(unit.rawValue()).toEqual(unitValue);
      });

      it('checks "has" method', () => {
        const randKey = randomValue(1);
        expect(unit.has(randKey)).toBe(unitValue.hasOwnProperty(randKey));
        expect(unit.rawValue()).toEqual(unitValue);
      });

      it('checks "findByProp" method', () => {
        const strictEquality = booleanOrRandomValue(0.8);
        const skipStrictEqualityArg = randomBoolean(-0.5);
        const allProps = Object.assign({}, ...Object.values(unitValue));
        const allKeys = Object.keys(allProps);
        const randMatchKey = allKeys[randomNumber(0, allKeys.length - 1)];
        const randMatchValue = allProps[randMatchKey];

        const matches = unit.findByProp(
          randMatchKey,
          randMatchValue,
          ...(skipStrictEqualityArg ? [] : [strictEquality])
        );
        const testMatches = Object.entries(unitValue).filter(
          ([propKey, prop]) =>
            isObject(prop) &&
            (!skipStrictEqualityArg && strictEquality === false
              ? // tslint:disable-next-line:triple-equals
                prop[randMatchKey] == randMatchValue
              : prop[randMatchKey] === randMatchValue)
        );

        expect(matches).toEqual(testMatches);
        expect(unit.rawValue()).toEqual(unitValue);
      });
    });

    describe('mutative methods', () => {
      let unit: DictUnit<any>;
      let normalDictObj: DictValue<any>;
      let emitCount: number;
      let isEmpty: boolean;

      beforeEach(() => {
        unit = new DictUnit(somewhatValidConfig(configOptions, DictUnit));
        if (randomBoolean(0.8)) {
          unit.dispatch(randomValidValue(DictUnit, 1, 10));
        }
        normalDictObj = deepCopy(unit.rawValue());
        emitCount = unit.emitCount;
        isEmpty = unit.isEmpty;
      });

      it('checks "set" method', () => {
        const randKey = randomValue(1) as number;
        const randVal = randomValue(1);

        let event;
        unit.events$.subscribe(e => (event = e));
        unit.set(randKey, randVal);

        if (typeof randKey === 'string' || typeof randKey === 'number') {
          normalDictObj[randKey] = randVal;
          expect(normalDictObj[randKey]).toEqual(unit.get(randKey));
          expect(event).toBeInstanceOf(EventDictUnitSet);
          expect(event).toEqual(new EventDictUnitSet(randKey, randVal));
          expect(unit.emitCount).toBe(emitCount + 1);
        } else {
          expect(event).toBe(undefined);
          expect(unit.emitCount).toBe(emitCount);
        }
        expect(unit.rawValue()).toEqual(normalDictObj);
      });

      it('checks "assign" method', () => {
        const randSources = Array(randomNumber(0, 5))
          .fill(null)
          .map(() => randomDictObject());

        let event: EventDictUnitAssign<any>;
        unit.events$.subscribe(e => (event = e as EventDictUnitAssign<any>));
        unit.assign(...randSources);

        if (randSources.length) {
          expect(unit.value()).toEqual(Object.assign(normalDictObj, ...randSources));
          expect(event).toBeInstanceOf(EventDictUnitAssign);
          expect(event.sources).toEqual(randSources);
          expect(unit.emitCount).toBe(emitCount + 1);
        } else {
          expect(event).toBe(undefined);
          expect(unit.emitCount).toBe(emitCount);
        }
        expect(unit.rawValue()).toEqual(normalDictObj);
      });

      it('checks "delete" method', () => {
        const mixedKeys = [...unit.objectKeys(), ...randomKeys()];
        const randKeys = Faker.helpers
          .shuffle(mixedKeys)
          .slice(randomNumber(0, mixedKeys.length + 1));
        let event;
        unit.events$.subscribe(e => (event = e));

        unit.delete(...randKeys);

        const ownProps = randKeys.filter(key => normalDictObj.hasOwnProperty(key));
        if (!isEmpty && ownProps.length) {
          const removedProps = {};
          ownProps.forEach(key => {
            removedProps[key] = deepCopy(normalDictObj[key]);
            delete normalDictObj[key];
          });

          expect(event).toBeInstanceOf(EventDictUnitDelete);
          expect(event).toEqual(new EventDictUnitDelete(removedProps));
          expect(unit.emitCount).toBe(emitCount + 1);
        } else {
          expect(event).toBe(undefined);
          expect(unit.emitCount).toBe(emitCount);
        }
        expect(unit.rawValue()).toEqual(normalDictObj);
      });

      it('checks "deleteIf" method', () => {
        const predicate = randomValuePureFn();

        let event;
        unit.events$.subscribe(e => (event = e));

        unit.deleteIf((v, k, i) => predicate(i));

        if (!isEmpty && typeof predicate === 'function') {
          const removedProps = {};
          Object.keys(normalDictObj).forEach((key, i) => {
            if (predicate(i)) {
              removedProps[key] = normalDictObj[key];
              delete normalDictObj[key];
            }
          });

          expect(event).toBeInstanceOf(EventDictUnitDelete);
          expect(event).toEqual(new EventDictUnitDelete(removedProps));
          expect(unit.emitCount).toBe(emitCount + 1);
        } else {
          expect(event).toBe(undefined);
          expect(unit.emitCount).toBe(emitCount);
        }
        expect(unit.rawValue()).toEqual(normalDictObj);
      });
    });
  })
);
