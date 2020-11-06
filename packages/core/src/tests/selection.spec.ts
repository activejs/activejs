import {Observable} from 'rxjs';
import {pairwise} from 'rxjs/operators';
import {
  Configuration,
  DictUnit,
  GenericUnit,
  ListUnit,
  NonPrimitiveUnitBase,
  Selection,
  UnitBase,
  UnitConfig,
} from '@activejs/core';
import {
  findRandomPath,
  randomBoolean,
  randomMutation,
  randomNumOrStr,
  randomNumsAndStrings,
  randomUnit,
  randomValidValue,
  selectRandom,
  somewhatValidConfig,
  times,
} from './utils';
import {plucker} from '../utils/funcs';
import createSpy = jasmine.createSpy;

const configOptions: Array<keyof UnitConfig<any>> = [
  // 'id', // tests with id  are done separately to keep other tests simple
  'immutable',
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
  'Selection',
  times(30, () => {
    beforeAll(() => {
      Configuration.reset();
    });

    let unitConfig: UnitConfig<any>;
    let unit: UnitBase<any> & NonPrimitiveUnitBase<any>;
    let randVal: any;
    let randPath: (string | number)[];
    let valueAtPath: any;

    const makeUnit = (overrideConfig?: UnitConfig<any>) => {
      const unitCtor = selectRandom([DictUnit, ListUnit, GenericUnit]);
      unitConfig = {
        ...somewhatValidConfig(configOptions, unitCtor),
        ...overrideConfig,
      };
      unit = new unitCtor(unitConfig);
      randPath = findRandomPath(unit.value());
      if (!randPath.length) {
        randPath = [randomNumOrStr()];
      }
    };

    const makeCase = () => {
      randVal = randomValidValue(unit, 4);
      randPath = findRandomPath(randVal);
      if (!randPath.length) {
        randPath = [randomNumOrStr()];
      }
      valueAtPath = plucker(randVal, randPath);
      unit.dispatch(randVal);
    };

    const makeSelection = (path: any[]): Selection<any> => {
      if (randomBoolean()) {
        return unit.select(...(path as [any]));
      } else {
        return new Selection(unit, path);
      }
    };

    it('should throw error for invalid path', () => {
      makeUnit();
      const invalidKey = selectRandom([
        false,
        undefined,
        null,
        [],
        {},
        () => {},
        class A {},
      ]) as string;
      const invalidPath = [...randomNumsAndStrings(), invalidKey];
      const expectedError = `Expected numbers and strings, but got ${invalidKey} of type ${typeof invalidKey}`;

      expect(() => makeSelection([])).toThrowError(`Expected at least one key`);
      expect(() => makeSelection([invalidKey])).toThrowError(expectedError);
      expect(() => makeSelection(invalidPath)).toThrowError(expectedError);
    });

    it('should create Observable', () => {
      makeUnit();
      makeCase();
      const spy = createSpy();
      const selection = makeSelection(randPath);
      const selection$ = selection.asObservable();
      selection$.subscribe(spy);

      expect(selection$).toBeInstanceOf(Observable);

      if (unit.config.replay === false) {
        expect(spy).not.toHaveBeenCalled();
      } else {
        expect(spy).toHaveBeenCalledTimes(1);
      }
    });

    it('should emit distinct values', () => {
      makeUnit();
      makeCase();
      const selection = makeSelection(randPath);
      const selection$ = selection.asObservable();
      const selectorEmitsPairs = [];
      selection$.pipe(pairwise()).subscribe(pair => selectorEmitsPairs.push(pair));

      unit.replay();
      unit.dispatch(value => randomMutation(value));
      unit.dispatch(value => randomMutation(value));
      unit.dispatch(value => randomMutation(value));
      unit.replay();
      unit.dispatch(randomValidValue(unit));
      unit.dispatch(value => randomMutation(value));
      unit.dispatch(value => randomMutation(value));
      unit.dispatch(value => randomMutation(value));

      const allUnique = selectorEmitsPairs.every(([v1, v2]) => v1 !== v2);
      expect(allUnique).toBe(true);
    });

    it('should return the selected property', () => {
      makeUnit();
      makeCase();
      const selection = makeSelection(randPath);
      const selectedValue = plucker(unit.value(), randPath);

      expect(selection.value()).toEqual(selectedValue);
    });
  })
);
