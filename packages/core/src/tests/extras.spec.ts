import {checkAsyncSystemConfig} from '../checks/common';
import {
  deDuplicate,
  deepCopy,
  deepFreeze,
  findIndex,
  findIndexBackwards,
  generateAsyncSystemIds,
  getLocationId,
  hashCode,
  isDict,
  makeNonEnumerable,
  plucker,
} from '../utils/funcs';
import {RANDOM_VALUE_PRODUCERS, randomBoolean, randomString, randomValue, times} from './utils';
import {Configuration} from '../lib/configuration';
import {
  BoolUnit,
  createUnit,
  DictUnit,
  GenericUnit,
  ListUnit,
  NumUnit,
  StringUnit,
} from '@activejs/core';

describe('Extras - Fulfilment', () => {
  beforeAll(() => {
    Configuration.reset();
  });

  it('should not do anything', () => {
    expect(checkAsyncSystemConfig(null)()).toBe(undefined);
  });

  it(
    'should auto-id the AsyncSystem Units',
    times(30, () => {
      const randConfig = randomBoolean() ? undefined : randomValue(1);
      if (randConfig) {
        delete randConfig.id;
      }
      const systemId = randomString();
      const ids = generateAsyncSystemIds(systemId, randConfig, randConfig, randConfig, randConfig);
      expect(ids.queryUnitId).toBe(systemId + '_QUERY');
      expect(ids.dataUnitId).toBe(systemId + '_DATA');
      expect(ids.errorUnitId).toBe(systemId + '_ERROR');
      expect(ids.pendingUnitId).toBe(systemId + '_PENDING');
    })
  );

  it('should not try to clone non [object Object]', () => {
    [() => {}, new Map(), new Date(), new Set()].forEach(o => {
      expect(deepCopy(o)).toBe(o);
    });
  });

  it('should find index', () => {
    // indexes = 0, 1, 2, 3, 4, 5, 6, 7, 8, 9,10,11,12,13,14
    const arr = [0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0];
    const predicate = v => v === 0;

    expect(findIndex(arr, predicate)).toBe(0);
    expect(findIndex(arr, predicate, 0)).toBe(0);
    expect(findIndex(arr, predicate, -1)).toBe(0);
    expect(findIndex(arr, predicate, 1)).toBe(7);
    expect(findIndex(arr, predicate, 7)).toBe(7);
    expect(findIndex(arr, predicate, 14)).toBe(14);
    expect(findIndex(arr, predicate, 15)).toBe(14);
    expect(findIndex(arr, predicate, '0' as any)).toBe(0);
    expect(findIndex(arr, predicate, 'a' as any)).toBe(0);
    expect(findIndex(arr, predicate, '1' as any)).toBe(7);

    expect(findIndexBackwards(arr, predicate)).toBe(14);
    expect(findIndexBackwards(arr, predicate, 14)).toBe(14);
    expect(findIndexBackwards(arr, predicate, -1)).toBe(14);
    expect(findIndexBackwards(arr, predicate, 13)).toBe(7);
    expect(findIndexBackwards(arr, predicate, 7)).toBe(7);
    expect(findIndexBackwards(arr, predicate, 0)).toBe(0);
    expect(findIndexBackwards(arr, predicate, 15)).toBe(14);
    expect(findIndexBackwards(arr, predicate, '0' as any)).toBe(0);
    expect(findIndexBackwards(arr, predicate, 'a' as any)).toBe(14);
    expect(findIndexBackwards(arr, predicate, '13' as any)).toBe(7);
  });

  it('should not throw for non-freezable', () => {
    expect(deepFreeze(Date)).toBe(Date);
    expect(deepFreeze(localStorage)).toBe(localStorage);
  });

  it('should not throw for non-objects', () => {
    expect(() => makeNonEnumerable(undefined)).not.toThrowError();
    expect(() => makeNonEnumerable(null)).not.toThrowError();
    expect(() => makeNonEnumerable(randomValue(1))).not.toThrowError();

    expect(() => getLocationId(undefined)).not.toThrowError();
    expect(() => getLocationId(null)).not.toThrowError();
    expect(() => getLocationId(randomValue(1))).not.toThrowError();
  });

  it('should not throw for non-strings', () => {
    expect(() => hashCode(undefined)).not.toThrowError();
    expect(() => hashCode(null)).not.toThrowError();
    expect(() => hashCode('')).not.toThrowError();
    expect(() => hashCode(Date as any)).not.toThrowError();
  });

  it('should not throw', () => {
    expect(() => getLocationId(undefined)).not.toThrowError();
    expect(() => getLocationId({})).not.toThrowError();
    expect(() => getLocationId('hey')).not.toThrowError();
  });

  it('should be able to deDuplicate without Set', () => {
    const set = window.Set;
    window.Set = undefined; // remove Set

    const arr = [false, false, true, true, 0, 0, 1, 1, Infinity, Infinity, set, set, '', ''];
    expect(deDuplicate(arr)).toEqual([...new set(arr)]);

    window.Set = set; // reinstate Set
  });

  it('should return same value, if path is not Array', () => {
    RANDOM_VALUE_PRODUCERS.map(producer => producer(1)).forEach(val => {
      expect(plucker(val, '' as any)).toEqual(val);
    });
  });

  it('should return appropriate Unit', () => {
    RANDOM_VALUE_PRODUCERS.map(producer => producer(1)).forEach(val => {
      const unit = createUnit(val);
      const expectedUnitCtor =
        (typeof val === 'boolean' && BoolUnit) ||
        (typeof val === 'number' && NumUnit) ||
        (typeof val === 'string' && StringUnit) ||
        (Array.isArray(val) && ListUnit) ||
        (isDict(val) && DictUnit) ||
        GenericUnit;

      expect(unit).toBeInstanceOf(expectedUnitCtor);
    });
  });
});
