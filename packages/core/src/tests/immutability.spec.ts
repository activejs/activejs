import {
  CUSTOM_MATCHERS,
  DICT_UNIT_MUTATION_FNS,
  LIST_UNIT_MUTATION_FNS,
  randomBoolean,
  randomNumber,
  randomValidValue,
  randomValue,
  selectRandom,
  times,
  UNIT_CACHE_NAVIGATION_FNS,
} from './utils';
import {Action} from '../lib/action';
import {Configuration} from '../lib/configuration';
import {DictUnit} from '../lib/dict-unit';
import {GenericUnit} from '../lib/generic-unit';
import {ListUnit} from '../lib/list-unit';
import {UnitConfig} from '../models/units';
import {isObject} from '../utils/funcs';

declare global {
  namespace jasmine {
    interface Matchers<T> {
      toHaveSharedReferenceIn(expected: Expected<T>, expectationFailOutput?: any): boolean;
    }
  }
}

describe(
  'Immutability',
  times(30, () => {
    beforeAll(() => {
      Configuration.reset();
      jasmine.addMatchers(CUSTOM_MATCHERS);
    });

    it('Action should emit the same value', () => {
      const initialValue = randomValue(1);
      const action = new Action({initialValue});

      expect(initialValue).toBe(action.value());

      const randVal = randomValue(1);

      action.subscribe(val => expect(val).toBe(randVal));
      action.dispatch(randVal);
    });

    describe('Units Common', () => {
      let initialValue: any;
      let unitCtor: new (config?: UnitConfig<any>) =>
        | GenericUnit<any>
        | ListUnit<any>
        | DictUnit<any>;
      let unit: GenericUnit<any> | ListUnit<any> | DictUnit<any>;

      beforeEach(() => {
        unitCtor = selectRandom([GenericUnit, ListUnit, DictUnit]);
        initialValue = randomValidValue(unitCtor, 1);
        unit = new unitCtor({initialValue, immutable: true});
      });

      it(`Mutable Units' should emit the same value`, () => {
        unit = new unitCtor({initialValue});

        expect(initialValue).toBe(unit.value());
        expect(initialValue).toBe(unit.initialValue());

        const randVal = randomValidValue(unit, 1);
        unit.dispatch(randVal);

        unit.subscribe(val => expect(val).toBe(randVal));
      });

      it(`Immutable Units' value should be a copy`, () => {
        expect(unit.value()).toEqual(initialValue);
        expect(unit.value()).not.toHaveSharedReferenceIn(initialValue);
        expect(unit.rawValue()).toEqual(initialValue);
        expect(unit.rawValue()).not.toHaveSharedReferenceIn(initialValue);
        expect(unit.initialValue()).toEqual(initialValue);
        expect(unit.initialValue()).not.toHaveSharedReferenceIn(initialValue);

        const randVal = randomValidValue(unit, 1);
        unit.dispatch(randVal);

        expect(unit.value()).toEqual(randVal);
        expect(unit.value()).not.toHaveSharedReferenceIn(randVal);
        expect(unit.rawValue()).toEqual(randVal);
        expect(unit.rawValue()).not.toHaveSharedReferenceIn(randVal);

        unit.subscribe(value => {
          expect(value).toEqual(randVal);
          expect(value).not.toHaveSharedReferenceIn(randVal);
          expect(value).toEqual(randVal);
          expect(value).not.toHaveSharedReferenceIn(randVal);
        });
      });

      it(`Immutable Units' value should not be same as rawValue by reference`, () => {
        expect(unit.value()).toEqual(unit.rawValue());
        expect(unit.value()).not.toHaveSharedReferenceIn(unit.rawValue());

        const randVal = randomValidValue(unit, 1);
        unit.dispatch(randVal);

        expect(unit.value()).toEqual(unit.rawValue());
        expect(unit.value()).not.toHaveSharedReferenceIn(unit.rawValue());

        unit.subscribe(value => {
          expect(value).toEqual(unit.rawValue());
          expect(value).not.toHaveSharedReferenceIn(unit.rawValue());
        });
      });

      it(`Immutable Units' subscriptions should share the same value`, () => {
        if (randomBoolean()) {
          unit.dispatch(randomValidValue(unit, 1));
        }

        let v1;
        let v2;
        unit.subscribe(value => (v1 = value));
        unit.subscribe(value => (v2 = value));

        expect(v1).toBe(v2);
        expect(v1).toEqual(v2);
        if (isObject(v1) && isObject(v2)) {
          expect(v1).toHaveSharedReferenceIn(v2);
        }
      });

      it(`Immutable Units' value should create a new copy on every call`, () => {
        if (randomBoolean()) {
          unit.dispatch(randomValidValue(unit, 1));
        }

        const v1 = unit.value();
        const v2 = unit.value();

        expect(v1).toEqual(v2);
        expect(v1).not.toHaveSharedReferenceIn(v2);
      });

      it(`Immutable Units' subscribers should have a different copy than the value() call`, () => {
        if (randomBoolean()) {
          unit.dispatch(randomValidValue(unit, 1));
        }

        const v1 = unit.value();
        let v2;
        unit.subscribe(value => (v2 = value));

        expect(v1).toEqual(v2);
        expect(v1).not.toHaveSharedReferenceIn(v2);
      });

      it(`Immutable Units' replay should not create a new copy`, () => {
        if (randomBoolean()) {
          unit.dispatch(randomValidValue(unit, 1));
        }
        const {emitCount} = unit;

        let v1;
        unit.subscribe(value => (v1 = value));

        unit.replay();

        let v2;
        unit.subscribe(value => (v2 = value));

        expect(v1).toBe(v2);
        expect(v1).toEqual(v2);
        if (isObject(v1) && isObject(v2)) {
          expect(v1).toHaveSharedReferenceIn(v2);
        }
        expect(unit.emitCount).toBe(emitCount + 1);
      });

      it(`Immutable Unit should create clone on cache-navigation`, () => {
        Array(randomNumber(1, 8))
          .fill(null)
          .forEach(() => {
            unit.dispatch(randomValidValue(unit, 1));
          });
        const {cachedValuesCount} = unit;
        const cachedValues = unit.cachedValues();

        unit.subscribe(value => {
          expect(value).toEqual(cachedValues[unit.cacheIndex]);
          expect(value).not.toHaveSharedReferenceIn(cachedValues[unit.cacheIndex]);
        });

        selectRandom(UNIT_CACHE_NAVIGATION_FNS)(unit);
        selectRandom(UNIT_CACHE_NAVIGATION_FNS)(unit);
        selectRandom(UNIT_CACHE_NAVIGATION_FNS)(unit);

        expect(cachedValuesCount).toBe(unit.cachedValuesCount);
      });
    });

    it(`Mutable List/Dict Unit should create shallow copy on mutations`, () => {
      const unitCtor: new (config?: UnitConfig<any>) =>
        | ListUnit<any>
        | DictUnit<any> = randomBoolean() ? ListUnit : DictUnit;
      const initialValue = randomValidValue(unitCtor, 1);
      const unit = new unitCtor({initialValue});
      const {emitCount} = unit;

      let prevValue;
      unit.future$.subscribe(value => {
        expect(value).not.toBe(prevValue);
        prevValue = value;
      });

      if (unit instanceof ListUnit) {
        selectRandom(LIST_UNIT_MUTATION_FNS)(unit);
        selectRandom(LIST_UNIT_MUTATION_FNS)(unit);
        selectRandom(LIST_UNIT_MUTATION_FNS)(unit);
      } else {
        selectRandom(DICT_UNIT_MUTATION_FNS)(unit);
        selectRandom(DICT_UNIT_MUTATION_FNS)(unit);
        selectRandom(DICT_UNIT_MUTATION_FNS)(unit);
      }

      if (emitCount === unit.emitCount) {
        expect().nothing();
      }
    });

    it(`Immutable List/Dict Unit should create clone on mutations`, () => {
      const unitCtor: new (config?: UnitConfig<any>) =>
        | ListUnit<any>
        | DictUnit<any> = randomBoolean() ? ListUnit : DictUnit;
      const initialValue = randomValidValue(unitCtor, 1);
      const unit = new unitCtor({initialValue, immutable: true});
      const {emitCount} = unit;

      let prevValue;
      unit.future$.subscribe(value => {
        expect(value).not.toBe(prevValue);
        expect(value).not.toHaveSharedReferenceIn(prevValue);
        prevValue = value;
      });

      if (unit instanceof ListUnit) {
        selectRandom(LIST_UNIT_MUTATION_FNS)(unit);
        selectRandom(LIST_UNIT_MUTATION_FNS)(unit);
        selectRandom(LIST_UNIT_MUTATION_FNS)(unit);
      } else {
        selectRandom(DICT_UNIT_MUTATION_FNS)(unit);
        selectRandom(DICT_UNIT_MUTATION_FNS)(unit);
        selectRandom(DICT_UNIT_MUTATION_FNS)(unit);
      }

      if (emitCount === unit.emitCount) {
        expect().nothing();
      }
    });
  })
);
