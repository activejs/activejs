import {
  EventListUnitCopyWithin,
  EventListUnitDelete,
  EventListUnitFill,
  EventListUnitPop,
  EventListUnitPush,
  EventListUnitRemove,
  EventListUnitReverse,
  EventListUnitSet,
  EventListUnitShift,
  EventListUnitSort,
  EventListUnitSplice,
  EventListUnitUnshift,
} from '../models/events';
import {UnitConfig} from '../models/units';
import {Configuration} from '../lib/configuration';
import {ListUnit} from '../lib/list-unit';
import {
  booleanOrRandomValue,
  LIST_UNIT_MUTATION_FNS,
  multipleOf,
  randomArray,
  randomBoolean,
  randomNumber,
  randomSortPredicate,
  randomValidValue,
  randomValue,
  randomValuePureFn,
  randomWholeNumber,
  selectRandom,
  somewhatValidConfig,
  times,
} from './utils';
import {
  deepCopy,
  isObject,
  isValidIndex,
  IteratorSymbol,
  normalizeIndex,
  sanitizeIndices,
} from '../utils/funcs';

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
  'ListUnit',
  times(30, () => {
    beforeAll(() => {
      Configuration.reset();
    });

    describe('basic tests', () => {
      let unit: ListUnit<any>;
      let unitValue: any[];

      beforeEach(() => {
        unitValue = randomArray(1);
        unit = new ListUnit<any>({initialValue: unitValue});
      });

      it('should only allow arrays', () => {
        const randValue = randomValue(1);
        const originalUnitValue = unit.value();
        unit.dispatch(randValue);

        if (Array.isArray(randValue)) {
          expect(unit.value()).toEqual(randValue);
        } else {
          expect(unit.value()).toBe(originalUnitValue);
        }
      });

      it('should have valid length', () => {
        expect(unit.length).toBe(Array.isArray(unitValue) ? unitValue?.length : 0);

        unitValue = randomArray(1);
        unit.dispatch(unitValue);

        expect(unit.length).toBe(unitValue.length);
      });

      it('checks objectKeys method', () => {
        expect(unit.objectKeys()).toEqual(Object.keys(unitValue));

        unitValue = randomArray(1);
        unit.dispatch(unitValue);

        expect(unit.objectKeys()).toEqual(Object.keys(unitValue));
      });

      it('checks objectEntries method', () => {
        expect(unit.objectEntries()).toEqual(Object.entries(unitValue));

        unitValue = randomArray(1);
        unit.dispatch(unitValue);

        expect(unit.objectEntries()).toEqual(Object.entries(unitValue));
      });

      it('checks objectValues method', () => {
        expect(unit.objectValues()).toEqual(Object.values(unitValue));

        unitValue = randomArray(1);
        unit.dispatch(unitValue);

        expect(unit.objectValues()).toEqual(Object.values(unitValue));
      });

      it('should be iterable', () => {
        expect(typeof unit[IteratorSymbol]).toBe('function');
        expect(typeof unit[IteratorSymbol]().next).toBe('function');
        expect([...unit]).toEqual([...unit.value()]);
        expect(unitValue).toEqual(unit.value());
      });

      it('should not mutate when frozen', () => {
        const length = unit.length;
        const emitCount = unit.emitCount;
        unit.freeze();

        selectRandom(LIST_UNIT_MUTATION_FNS)(unit);
        selectRandom(LIST_UNIT_MUTATION_FNS)(unit);
        selectRandom(LIST_UNIT_MUTATION_FNS)(unit);
        selectRandom(LIST_UNIT_MUTATION_FNS)(unit);
        selectRandom(LIST_UNIT_MUTATION_FNS)(unit);

        expect(length).toBe(unit.length);
        expect(emitCount).toBe(unit.emitCount);
        expect(unitValue).toEqual(unit.value());
      });

      it('should not emit when muted', () => {
        const emitCount = unit.emitCount;
        unit.mute();

        selectRandom(LIST_UNIT_MUTATION_FNS)(unit);
        selectRandom(LIST_UNIT_MUTATION_FNS)(unit);
        selectRandom(LIST_UNIT_MUTATION_FNS)(unit);
        selectRandom(LIST_UNIT_MUTATION_FNS)(unit);
        selectRandom(LIST_UNIT_MUTATION_FNS)(unit);

        expect(emitCount).toBe(unit.emitCount);
        expect(unit.isMuted).toBe(true);
      });
    });

    describe('read-only custom methods', () => {
      let unit: ListUnit<any>;
      let unitValue: any[];
      let emitCount: number;
      let listLength: number;

      beforeEach(() => {
        unit = new ListUnit(somewhatValidConfig(configOptions, ListUnit));
        if (randomBoolean(0.8)) {
          unit.dispatch(randomValidValue(ListUnit, randomNumber(1, 3)));
        }
        unitValue = unit.value();
        emitCount = unit.emitCount;
        listLength = unit.length;
      });

      it('checks "forEvery" method', () => {
        const callbackSpy = jasmine.createSpy();

        unit.forEvery((item, index, array) => {
          callbackSpy();
          expect(item).toBe(unitValue[index]);
          expect(unit.get(index)).toEqual(unitValue[index]);
          expect(unitValue[index]).toEqual(array[index]);
        });

        expect(callbackSpy).toHaveBeenCalledTimes(listLength);

        expect(emitCount).toEqual(unit.emitCount);
        expect(unitValue).toEqual(unit.value());
      });

      it('checks "get" method', () => {
        const randIndex = randomValue(1);
        expect(unit.get(randIndex)).toEqual(unitValue[normalizeIndex(randIndex, unitValue.length)]);
        expect(unit.rawValue()).toEqual(unitValue);

        expect(emitCount).toEqual(unit.emitCount);
        expect(unitValue).toEqual(unit.value());
      });

      it('checks "first" method', () => {
        expect(unit.first()).toEqual(unitValue[0]);
        expect(unit.rawValue()).toEqual(unitValue);

        expect(emitCount).toEqual(unit.emitCount);
        expect(unitValue).toEqual(unit.value());
      });

      it('checks "last" method', () => {
        expect(unit.last()).toEqual(unitValue[listLength - 1]);
        expect(unit.rawValue()).toEqual(unitValue);

        expect(emitCount).toEqual(unit.emitCount);
        expect(unitValue).toEqual(unit.value());
      });

      it('checks "jsonJoin" method', () => {
        const separator = randomValue(1);
        expect(unit.jsonJoin(separator)).toEqual(
          unitValue.map(item => JSON.stringify(item)).join(separator)
        );
        expect(unit.rawValue()).toEqual(unitValue);

        expect(emitCount).toEqual(unit.emitCount);
        expect(unitValue).toEqual(unit.value());
      });

      it('checks "findByProp" method', () => {
        const strictEquality = booleanOrRandomValue();
        const skipStrictEqualityArg = randomBoolean(-0.5);
        const allProps = Object.assign({}, ...unitValue);
        const allKeys = Object.keys(allProps);
        const randMatchKey = selectRandom(allKeys);
        const randMatchValue = allProps[randMatchKey];

        const matches = unit.findByProp(
          randMatchKey,
          randMatchValue,
          ...(skipStrictEqualityArg ? [] : [strictEquality])
        );
        const testMatches = unitValue.reduce((reduced, item, index) => {
          if (
            isObject(item) &&
            (!skipStrictEqualityArg && strictEquality === false
              ? // tslint:disable-next-line:triple-equals
                item[randMatchKey] == randMatchValue
              : item[randMatchKey] === randMatchValue)
          ) {
            reduced.push([index, item]);
          }
          return reduced;
        }, []);

        expect(matches).toEqual(testMatches);
        expect(unit.rawValue()).toEqual(unitValue);

        expect(emitCount).toEqual(unit.emitCount);
        expect(unitValue).toEqual(unit.value());
      });
    });

    describe('read-only Array.prototype methods', () => {
      let unit: ListUnit<any>;
      let unitValue: any[];
      let emitCount: number;

      beforeEach(() => {
        unit = new ListUnit(somewhatValidConfig(configOptions, ListUnit));
        if (randomBoolean(0.8)) {
          unit.dispatch(randomValidValue(ListUnit, randomNumber(1, 3)));
        }
        unitValue = unit.value();
        emitCount = unit.emitCount;
      });

      it('should have Array.prototype.slice', () => {
        const sliceStart = randomNumber();
        const sliceEnd = randomNumber();
        expect(unit.slice(sliceStart, sliceEnd)).toEqual(unit.value().slice(sliceStart, sliceEnd));

        expect(emitCount).toEqual(unit.emitCount);
        expect(unitValue).toEqual(unit.value());
      });

      it('should have Array.prototype.concat', () => {
        const concatItems = randomArray(1);
        expect(unit.concat(...concatItems)).toEqual(unit.value().concat(...concatItems));

        expect(emitCount).toEqual(unit.emitCount);
        expect(unitValue).toEqual(unit.value());
      });

      it('should have Array.prototype.find', () => {
        const findPredicate = randomValuePureFn();
        expect(unit.find(findPredicate)).toEqual(unit.value().find(findPredicate));

        expect(emitCount).toEqual(unit.emitCount);
        expect(unitValue).toEqual(unit.value());
      });

      it('should have Array.prototype.findIndex', () => {
        const findIndexPredicate = randomValuePureFn();
        expect(unit.findIndex(findIndexPredicate)).toEqual(
          unit.value().findIndex(findIndexPredicate)
        );

        expect(emitCount).toEqual(unit.emitCount);
        expect(unitValue).toEqual(unit.value());
      });

      it('should have Array.prototype.entries', () => {
        expect(unit.entries()).toEqual(unit.value().entries());
        expect(unit.entries().toString()).toEqual('[object Array Iterator]');
        expect([...unit.entries()]).toEqual([...unit.value().entries()]);

        expect(emitCount).toEqual(unit.emitCount);
        expect(unitValue).toEqual(unit.value());
      });

      it('should have Array.prototype.values', () => {
        expect(unit.values()).toEqual(unit.value().values());
        expect(unit.values().toString()).toEqual('[object Array Iterator]');
        expect([...unit.values()]).toEqual([...unit.value().values()]);

        expect(emitCount).toEqual(unit.emitCount);
        expect(unitValue).toEqual(unit.value());
      });

      it('should have Array.prototype.keys', () => {
        expect(unit.keys()).toEqual(unit.value().keys());
        expect(unit.keys().toString()).toEqual('[object Array Iterator]');
        expect([...unit.keys()]).toEqual([...unit.value().keys()]);

        expect(emitCount).toEqual(unit.emitCount);
        expect(unitValue).toEqual(unit.value());
      });

      it('should have Array.prototype.filter', () => {
        const filterPredicate = randomValuePureFn();
        expect(unit.filter(filterPredicate)).toEqual(unit.value().filter(filterPredicate));

        expect(emitCount).toEqual(unit.emitCount);
        expect(unitValue).toEqual(unit.value());
      });

      it('should have Array.prototype.flat', () => {
        const flatDepth = randomNumber();
        expect(unit.flat(flatDepth)).toEqual(unit.value().flat(flatDepth));

        expect(emitCount).toEqual(unit.emitCount);
        expect(unitValue).toEqual(unit.value());
      });

      it('should have Array.prototype.flatMap', () => {
        const flatMapPredicate = randomValuePureFn();
        expect(unit.flatMap(flatMapPredicate)).toEqual(unit.value().flatMap(flatMapPredicate));

        expect(emitCount).toEqual(unit.emitCount);
        expect(unitValue).toEqual(unit.value());
      });

      it('should have Array.prototype.map', () => {
        const mapPredicate = randomValuePureFn();
        expect(unit.map(mapPredicate)).toEqual(unit.value().map(mapPredicate));

        expect(emitCount).toEqual(unit.emitCount);
        expect(unitValue).toEqual(unit.value());
      });

      it('should have Array.prototype.some', () => {
        const somePredicate = randomValuePureFn();
        expect(unit.some(somePredicate)).toEqual(unit.value().some(somePredicate));

        expect(emitCount).toEqual(unit.emitCount);
        expect(unitValue).toEqual(unit.value());
      });

      it('should have Array.prototype.every', () => {
        const everyPredicate = randomValuePureFn();
        expect(unit.every(everyPredicate)).toEqual(unit.value().every(everyPredicate));

        expect(emitCount).toEqual(unit.emitCount);
        expect(unitValue).toEqual(unit.value());
      });

      it('should have Array.prototype.reduce', () => {
        const reducePredicatePureFn = randomValuePureFn();
        const reducePredicate = (reduced, item, i) => {
          reduced[i] = reducePredicatePureFn(i) + item;
          return reduced;
        };
        expect(unit.reduce(reducePredicate, {})).toEqual(unit.value().reduce(reducePredicate, {}));

        expect(emitCount).toEqual(unit.emitCount);
        expect(unitValue).toEqual(unit.value());
      });

      it('should have Array.prototype.reduceRight', () => {
        const rightReducePredicatePureFn = randomValuePureFn();
        const reduceRightPredicate = (reduced, item, i) => {
          reduced[i] = rightReducePredicatePureFn(i) + item;
          return reduced;
        };
        expect(unit.reduceRight(reduceRightPredicate, {})).toEqual(
          unit.value().reduceRight(reduceRightPredicate, {})
        );

        expect(emitCount).toEqual(unit.emitCount);
        expect(unitValue).toEqual(unit.value());
      });
    });

    describe('mutative methods', () => {
      let unit: ListUnit<any>;
      let normalArray: any[];
      let emitCount: number;
      let listLength: number;

      beforeEach(() => {
        unit = new ListUnit(somewhatValidConfig(configOptions, ListUnit));
        if (randomBoolean(0.8)) {
          unit.dispatch(randomValidValue(ListUnit, 1));
        }
        normalArray = deepCopy(unit.rawValue());
        emitCount = unit.emitCount;
        listLength = unit.length;
      });

      it('checks "set" method', () => {
        const index = randomBoolean(0.6) ? randomWholeNumber(50) : (randomValue(1) as number);
        const normalIndex = normalizeIndex(index, unit.length);
        const item = randomValue(1);

        let event;
        unit.events$.subscribe(e => (event = e));
        unit.set(index, item);

        if (isValidIndex(index)) {
          normalArray[normalIndex] = item;
          expect(normalArray[normalIndex]).toEqual(unit.get(index));
          expect(event).toBeInstanceOf(EventListUnitSet);
          expect(event).toEqual(new EventListUnitSet(index, item));
          expect(unit.emitCount).toBe(emitCount + 1);
        } else {
          expect(event).toBe(undefined);
          expect(unit.emitCount).toBe(emitCount);
        }
        expect(unit.rawValue()).toEqual(normalArray);
      });

      it('checks "insert" method', () => {
        const startIndex = randomValue(1) as number;
        const newItems = randomArray(1);

        let event: EventListUnitSplice<any>;
        unit.events$.subscribe(e => (event = e as EventListUnitSplice<any>));
        const newLength = unit.insert(startIndex, ...newItems);
        normalArray.splice(startIndex, 0, ...newItems);

        if (newItems.length) {
          const normalStartIndex = normalizeIndex(startIndex, normalArray.length);
          expect(normalArray[normalStartIndex]).toEqual(unit.get(startIndex));
          expect(event).toBeInstanceOf(EventListUnitSplice);
          const normalEvent = new EventListUnitSplice(startIndex, 0, [], newItems);
          expect(event).toEqual(normalEvent);
          expect(unit.emitCount).toBe(emitCount + 1);
        } else {
          expect(event).toBe(undefined);
          expect(unit.emitCount).toBe(emitCount);
        }
        expect(unit.length).toBe(newLength);
        expect(unit.rawValue()).toEqual(normalArray);
      });

      it('checks "push" method', () => {
        const items = randomArray(1);

        let event;
        unit.events$.subscribe(e => (event = e));
        const newLength = unit.push(...items);
        normalArray.push(...items);

        if (items.length) {
          expect(event).toBeInstanceOf(EventListUnitPush);
          expect(event).toEqual(new EventListUnitPush(items));
          expect(unit.emitCount).toBe(emitCount + 1);
        } else {
          expect(event).toBe(undefined);
          expect(unit.emitCount).toBe(emitCount);
        }
        expect(unit.length).toBe(newLength);
        expect(unit.rawValue()).toEqual(normalArray);
      });

      it('checks "unshift" method', () => {
        const items = randomArray(1);

        let event;
        unit.events$.subscribe(e => (event = e));
        const newLength = unit.unshift(...items);
        normalArray.unshift(...items);

        if (items.length) {
          expect(event).toBeInstanceOf(EventListUnitUnshift);
          expect(event).toEqual(new EventListUnitUnshift(items));
          expect(unit.emitCount).toBe(emitCount + 1);
        } else {
          expect(event).toBe(undefined);
          expect(unit.emitCount).toBe(emitCount);
        }
        expect(unit.length).toBe(newLength);
        expect(unit.rawValue()).toEqual(normalArray);
      });

      it('checks "pop" method', () => {
        let event;
        unit.events$.subscribe(e => (event = e));
        unit.pop();
        const poppedItem = normalArray.pop();

        if (listLength) {
          expect(event).toBeInstanceOf(EventListUnitPop);
          expect(event).toEqual(new EventListUnitPop(poppedItem));
          expect(unit.emitCount).toBe(emitCount + 1);
        } else {
          expect(event).toBe(undefined);
          expect(unit.emitCount).toBe(emitCount);
        }
        expect(unit.rawValue()).toEqual(normalArray);
      });

      it('checks "shift" method', () => {
        let event;
        unit.events$.subscribe(e => (event = e));
        unit.shift();
        const shiftedItem = normalArray.shift();

        if (listLength) {
          expect(event).toBeInstanceOf(EventListUnitShift);
          expect(event).toEqual(new EventListUnitShift(shiftedItem));
          expect(unit.emitCount).toBe(emitCount + 1);
        } else {
          expect(event).toBe(undefined);
          expect(unit.emitCount).toBe(emitCount);
        }
        expect(unit.rawValue()).toEqual(normalArray);
      });

      it('checks "reverse" method', () => {
        let event;
        unit.events$.subscribe(e => (event = e));
        unit.reverse();
        normalArray.reverse();

        if (listLength) {
          expect(event).toBeInstanceOf(EventListUnitReverse);
          expect(unit.emitCount).toBe(emitCount + 1);
        } else {
          expect(event).toBe(undefined);
          expect(unit.emitCount).toBe(emitCount);
        }
        expect(unit.rawValue()).toEqual(normalArray);
      });

      it('checks "fill" method', () => {
        const startIndex = randomValue(1) as number;
        const endIndex = randomValue(1) as number;
        const fillValue = randomValue(1);
        let event;
        unit.events$.subscribe(e => (event = e));
        unit.fill(fillValue, startIndex, endIndex);
        normalArray.fill(fillValue, startIndex, endIndex);

        if (listLength) {
          expect(event).toBeInstanceOf(EventListUnitFill);
          expect(event).toEqual(new EventListUnitFill(fillValue, startIndex, endIndex));
          expect(unit.emitCount).toBe(emitCount + 1);
        } else {
          expect(event).toBe(undefined);
          expect(unit.emitCount).toBe(emitCount);
        }
        expect(unit.rawValue()).toEqual(normalArray);
      });

      it('checks "copyWithin" method', () => {
        const startIndex = randomValue(1) as number;
        const endIndex = randomValue(1) as number;
        const targetIndex = randomValue(1) as number;
        let event;
        unit.events$.subscribe(e => (event = e));
        unit.copyWithin(targetIndex, startIndex, endIndex);
        normalArray.copyWithin(targetIndex, startIndex, endIndex);

        if (listLength) {
          expect(event).toBeInstanceOf(EventListUnitCopyWithin);
          expect(event).toEqual(new EventListUnitCopyWithin(targetIndex, startIndex, endIndex));
          expect(unit.emitCount).toBe(emitCount + 1);
        } else {
          expect(event).toBe(undefined);
          expect(unit.emitCount).toBe(emitCount);
        }
        expect(unit.rawValue()).toEqual(normalArray);
      });

      it('checks "sort" method', () => {
        const sortPredicate = randomBoolean() ? randomValuePureFn() : randomSortPredicate();
        let event;
        unit.events$.subscribe(e => (event = e));

        if (randomBoolean(0.7)) {
          unit.sort(sortPredicate);
          normalArray.sort(sortPredicate);
        } else {
          unit.sort();
          normalArray.sort();
        }

        if (listLength) {
          expect(event).toBeInstanceOf(EventListUnitSort);
          expect(unit.emitCount).toBe(emitCount + 1);
        } else {
          expect(event).toBe(undefined);
          expect(unit.emitCount).toBe(emitCount);
        }
        expect(unit.rawValue()).toEqual(normalArray);
      });

      it('checks "splice" method', () => {
        const startIndex = randomValue(1) as number;
        const deleteCount = randomValue(1) as number;
        const newItems = randomArray(1);

        let event;
        unit.events$.subscribe(e => (event = e));
        unit.splice(startIndex, deleteCount, ...newItems);

        const removedItems = normalArray.splice(startIndex, deleteCount, ...newItems);

        // tslint:disable-next-line:triple-equals
        if ((deleteCount != 0 && listLength) || newItems.length) {
          expect(event).toBeInstanceOf(EventListUnitSplice);
          expect(event).toEqual(
            new EventListUnitSplice(startIndex, deleteCount, removedItems, newItems)
          );
          expect(unit.emitCount).toBe(emitCount + 1);
        } else {
          expect(event).toBe(undefined);
          expect(unit.emitCount).toBe(emitCount);
        }
        expect(unit.rawValue()).toEqual(normalArray);
      });

      it('checks "remove" and "removeIf" method', () => {
        const predicate = randomValuePureFn();
        let validIndices;
        let event;
        unit.events$.subscribe(e => (event = e));

        if (randomBoolean()) {
          // for "removeIf" method
          unit.removeIf((item, i) => predicate(i));
          validIndices = [...Array(listLength).keys()].filter(i => predicate(i));
        } else {
          // for "remove" method
          const indices = randomBoolean() ? multipleOf(() => randomNumber(1, 10)) : randomArray(1);
          unit.remove(...indices);
          validIndices = sanitizeIndices(indices, normalArray.length);
        }

        const removedItems = [];
        validIndices
          .sort()
          .reverse()
          .forEach(index => removedItems.push(...normalArray.splice(index, 1)));
        removedItems.reverse();

        if (validIndices.length && listLength) {
          expect(event).toBeInstanceOf(EventListUnitRemove);
          expect(event).toEqual(new EventListUnitRemove(validIndices, removedItems));
          expect(unit.emitCount).toBe(emitCount + 1);
        } else {
          expect(event).toBe(undefined);
          expect(unit.emitCount).toBe(emitCount);
        }
        expect(unit.rawValue()).toEqual(normalArray);
      });

      it('checks "delete" and "deleteIf" method', () => {
        const predicate = randomValuePureFn();
        let validIndices;
        let event;
        unit.events$.subscribe(e => (event = e));

        if (randomBoolean()) {
          // for deleteIf" method
          unit.deleteIf((item, i) => predicate(i));
          validIndices = [...Array(listLength).keys()].filter(i => predicate(i));
        } else {
          // for "remove" method
          const indices = randomArray(1);
          unit.delete(...indices);
          validIndices = sanitizeIndices(indices, normalArray.length);
        }

        const deletedItems = [];
        validIndices.forEach(index => {
          deletedItems.push(normalArray[index]);
          delete normalArray[index];
        });

        if (validIndices.length && listLength) {
          expect(event).toBeInstanceOf(EventListUnitDelete);
          expect(event).toEqual(new EventListUnitDelete(validIndices, deletedItems));
          expect(unit.emitCount).toBe(emitCount + 1);
        } else {
          expect(event).toBe(undefined);
          expect(unit.emitCount).toBe(emitCount);
        }
        expect(unit.rawValue()).toEqual(normalArray);
      });
    });
  })
);
