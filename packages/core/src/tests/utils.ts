import * as Faker from 'faker';
import {
  AsyncSystemConfig,
  AsyncSystemValue,
  BaseConfig,
  ClusterItems,
  SharedAsyncSystemConfig,
  UnitConfig,
} from '../models';
import {KeyValToKeyValProducer} from '../models/utils';
import {NonPrimitiveUnitBase} from '../lib/abstract-non-primitive-unit-base';
import {UnitBase} from '../lib/abstract-unit-base';
import {GenericUnit} from '../lib/generic-unit';
import {BoolUnit} from '../lib/bool-unit';
import {StringUnit} from '../lib/string-unit';
import {NumUnit} from '../lib/num-unit';
import {DictUnit} from '../lib/dict-unit';
import {ListUnit} from '../lib/list-unit';
import {Action} from '../lib/action';
import {AsyncSystem} from '../lib/async-system';
import {Cluster} from '../lib/cluster';
import {isDict, isObject, isNumber, makeNonEnumerable} from '../utils/funcs';

export const UNITS_CTORS = [GenericUnit, BoolUnit, StringUnit, NumUnit, DictUnit, ListUnit];
export const UNITS_CTORS_COUNT = UNITS_CTORS.length;

export const ALL_CTORS = [...UNITS_CTORS, Action, AsyncSystem, Cluster];

const RANDOM_VALUE_PRODUCERS: Array<(nestingLvl?: number) => any> = [
  () => randomBoolean(),
  () => randomString(),
  () => randomString(),
  () => randomWholeNumber(),
  () => randomWholeNumber(),
  randomDictObject,
  randomDictObject,
  randomDictObject,
  randomArray,
  randomArray,
  randomArray,
  // () => NaN, // this will cause "toEqual" and "toBe" to fail
  () => (randomBoolean(0.8) ? 1 : -1) * Infinity,
  () => undefined,
  () => null,
];

export const RANDOM_CONFIG_OPTIONS_VALUE_PRODUCERS: Required<KeyValToKeyValProducer<
  SharedAsyncSystemConfig<any, any, any> & Omit<UnitConfig<any>, 'initialValue'>
>> = {
  // SharedUnitConfig
  replay: (validness?, nestingLvl?) => booleanOrRandomValue(validness, nestingLvl),

  cacheSize: (validness?, nestingLvl?) => numberOrRandomValue(validness, nestingLvl, 0, 20),

  immutable: (validness?, nestingLvl?) => booleanOrRandomValue(validness, nestingLvl),

  persistent: (validness?, nestingLvl?) => booleanOrRandomValue(validness, nestingLvl),

  storage: (validness?, nestingLvl?) =>
    randomBoolean(validness)
      ? selectRandom([localStorage, sessionStorage])
      : randomValue(nestingLvl),

  distinctDispatchCheck: (validness?, nestingLvl?) => booleanOrRandomValue(validness, nestingLvl),

  // UnitConfig
  id: (validness?, nestingLvl?) => stringOrRandomValue(validness, nestingLvl),

  customDispatchCheck: (validness?, nestingLvl?) =>
    randomBoolean(validness) ? randomFn(nestingLvl) : randomValue(1),

  dispatchDebounce: (validness?, nestingLvl?) =>
    randomBoolean(validness)
      ? randomBoolean(0.8)
        ? randomNumber()
        : randomBoolean()
      : randomValue(nestingLvl),

  dispatchDebounceMode: (validness?, nestingLvl?) =>
    randomBoolean(validness)
      ? [undefined, 'START', 'END', 'BOTH'][randomNumber(0, 3)]
      : randomValue(nestingLvl),

  // SharedAsyncSystemConfig
  clearErrorOnData: (validness?, nestingLvl?) => booleanOrRandomValue(validness, nestingLvl),
  clearErrorOnQuery: (validness?, nestingLvl?) => booleanOrRandomValue(validness, nestingLvl),
  clearDataOnError: (validness?, nestingLvl?) => booleanOrRandomValue(validness, nestingLvl),
  clearDataOnQuery: (validness?, nestingLvl?) => booleanOrRandomValue(validness, nestingLvl),
  clearQueryOnData: (validness?, nestingLvl?) => booleanOrRandomValue(validness, nestingLvl),
  clearQueryOnError: (validness?, nestingLvl?) => booleanOrRandomValue(validness, nestingLvl),
  autoUpdatePendingValue: (validness?, nestingLvl?) => booleanOrRandomValue(validness, nestingLvl),
  freezeQueryWhilePending: (validness?, nestingLvl?) => booleanOrRandomValue(validness, nestingLvl),
};

export const LIST_UNIT_MUTATION_FNS = [
  (unit: ListUnit<any>) => unit.dispatch(randomArray(1)),
  (unit: ListUnit<any>) => unit.dispatch(() => randomArray(1)),
  (unit: ListUnit<any>) => unit.push(...randomArray(1)),
  (unit: ListUnit<any>) => unit.pop(),
  (unit: ListUnit<any>) => unit.shift(),
  (unit: ListUnit<any>) => unit.unshift(...randomArray(1)),
  (unit: ListUnit<any>) => unit.splice(randomNumber(), randomNumber(), ...randomArray(1)),
  (unit: ListUnit<any>) => unit.fill(randomValue(1), randomNumber(), randomNumber()),
  (unit: ListUnit<any>) => unit.copyWithin(randomNumber(), randomNumber(), randomNumber()),
  (unit: ListUnit<any>) => unit.reverse(),
  (unit: ListUnit<any>) => unit.sort(randomFn()),
  (unit: ListUnit<any>) => unit.set(randomNumber(), randomValue(1)),
  (unit: ListUnit<any>) => unit.insert(randomNumber(), ...randomArray(1)),
  (unit: ListUnit<any>) => unit.remove(...multipleOf(randomNumber)),
  (unit: ListUnit<any>) => unit.removeIf(randomFn()),
  (unit: ListUnit<any>) => unit.delete(...multipleOf(randomNumber)),
  (unit: ListUnit<any>) => unit.deleteIf(randomFn()),
];

export const DICT_UNIT_MUTATION_FNS = [
  (unit: DictUnit<any>) => unit.dispatch(randomDictObject(1)),
  (unit: DictUnit<any>) => unit.dispatch(() => randomDictObject(1)),
  (unit: DictUnit<any>) => unit.set(randomNumber(), randomValue(1)),
  (unit: DictUnit<any>) =>
    unit.delete(...randomSelectMultiple(unit.objectKeys().concat(randomKeys() as any))),
  (unit: DictUnit<any>) => unit.deleteIf(randomFn()),
  (unit: DictUnit<any>) => unit.assign(...randomArray(2)),
];

export const UNIT_CACHE_NAVIGATION_FNS = [
  (unit: UnitBase<any> | GenericUnit<any>, skipNil = randomBoolean()) => unit.goBack(skipNil),
  (unit: UnitBase<any> | GenericUnit<any>, skipNil = randomBoolean()) => unit.goForward(skipNil),
  (unit: UnitBase<any>) => unit.jump(-randomNumber(1, unit.cacheIndex)),
  (unit: UnitBase<any>) => unit.jump(randomNumber(1, unit.cachedValuesCount - 1 - unit.cacheIndex)),
];

// tslint:disable-next-line:ban-types
export function randomFn(nestingLvl = 1): (...args) => any {
  const randValue = randomValue(nestingLvl);
  return () => randValue;
}

// returns a pure function that returns same random value everytime
// for a specific number argument `n`
export function randomValuePureFn(): (n: number) => any {
  const values = randomValues();
  return (n: number) => values[n % values.length];
}

export function randomSortPredicate(): (a: any, b: any) => number {
  const desc = Faker.random.boolean();

  return (a, b) => {
    if (a > b) {
      return desc ? -1 : 1;
    } else if (a < b) {
      return desc ? 1 : -1;
    }
    return 0;
  };
}

export function randomWholeNumber(max?: number): number {
  return (randomBoolean(0.8) ? 1 : -1) * Faker.random.number(max);
}

export function randomNumber(min?: number, max?: number): number {
  return Faker.random.number({min, max});
}

export function randomString(): string {
  return selectRandom([Faker.random.words, Faker.random.word, Faker.random.alphaNumeric])();
}

export function randomNumOrStr(): string | number {
  return selectRandom([randomNumber, randomString])();
}

export function randomNumsAndStrings(): (string | number)[] {
  return multipleOf(randomNumOrStr);
}

// increased truthiness range: {0, 1}, or negative for decreased truthiness
export function randomBoolean(truthiness = 0): boolean {
  // .5 becomes true, hence divided to provide range {0, 1}
  return !!Math.round(Math.random() + truthiness / 2);
}

export function booleanOrRandomValue(validness = 0.7, nestingLvl = 1) {
  return randomBoolean(validness) ? randomBoolean() : randomValue(nestingLvl);
}

export function stringOrRandomValue(validness = 0.7, nestingLvl = 1) {
  return randomBoolean(validness) ? randomString() : randomValue(nestingLvl);
}

export function numberOrRandomValue(validness = 0.7, nestingLvl = 1, min?: number, max?: number) {
  return randomBoolean(validness) ? randomNumber(min, max) : randomValue(nestingLvl);
}

export function randomArray(nestingLvl = 2, maxLength = 6): any[] {
  if (nestingLvl < 0 || !isNumber(nestingLvl)) {
    return ['END'];
  }

  const isSameType = randomBoolean(-0.7); // less chances
  let randomValueProducer = randomValue;

  if (isSameType) {
    randomValueProducer = selectRandom([
      () => randomWholeNumber(),
      () => randomWholeNumber(),
      () => randomBoolean(),
      () => randomString(),
      () => randomArray(nestingLvl),
      () => randomDictObject(nestingLvl),
    ]);
  }

  return Array(randomNumber(0, maxLength))
    .fill(null)
    .map(() => randomValueProducer(nestingLvl));
}

export function selectRandom(list: any[]) {
  return list[randomNumber(0, list.length - 1)];
}

export function randomSelectMultiple<T extends any[]>(list: T, max = 6): T {
  return Faker.helpers.shuffle(list).slice(Math.min(randomNumber(0, list.length), max)) as T;
}

export function multipleOf<T>(producer: () => T, max = 6, min = 1): T[] {
  return Array(randomNumber(min, max)).fill(null).map(producer);
}

export function randomKeys(max = 3, min = 0) {
  return multipleOf(randomNumOrStr, max, min);
}

export function randomDictObject(nestingLvl = 2, maxKeys = 3) {
  if (nestingLvl < 0 || !isNumber(nestingLvl)) {
    return {END: true};
  }
  return randomKeys(maxKeys).reduce((reduced, key) => {
    reduced[key] = randomValue(nestingLvl);
    return reduced;
  }, {});
}

export function randomValues(nestingLvl = 2) {
  return randomSelectMultiple(RANDOM_VALUE_PRODUCERS).map(gen => gen(nestingLvl));
}

export function randomValue(nestingLvl = 2) {
  --nestingLvl;
  return selectRandom(RANDOM_VALUE_PRODUCERS)(nestingLvl);
}

export function randomValidValue<
  T extends UnitBase<any> | Action<any>,
  C extends BaseConfig | UnitConfig<any>
>(o: (new (config?: C) => T) | T, nestingLvl = 2, maxKeys = 3, maxLength = 5) {
  const isCtor = typeof o === 'function';
  const ctorName = isCtor ? (o as new () => UnitBase<any>).name : o.constructor.name;

  switch (ctorName) {
    case 'BoolUnit':
      return randomBoolean();
    case 'NumUnit':
      return randomWholeNumber();
    case 'StringUnit':
      return randomString();
    case 'ListUnit':
      return randomArray(maxLength);
    case 'DictUnit':
      return randomDictObject(nestingLvl, maxKeys);
    case 'Action':
    case 'GenericUnit':
      return randomValue(nestingLvl);
  }
}

export function unitsDefaultValue<T extends UnitBase<any>>(
  unit: (new (config?: UnitConfig<any>) => T) | T
) {
  const isCtor = typeof unit === 'function';
  const ctorName = isCtor ? (unit as new () => UnitBase<any>).name : unit.constructor.name;

  switch (ctorName) {
    case 'BoolUnit':
      return false;
    case 'NumUnit':
      return 0;
    case 'StringUnit':
      return '';
    case 'ListUnit':
      return [];
    case 'DictUnit':
      return {};
    case 'GenericUnit':
      return undefined;
  }
}

export function differentValue<T extends any>(v: T): T {
  switch (typeof v) {
    case 'boolean':
      return !v as T;
    case 'number':
      return (isFinite(v) ? v + 1 + randomNumber() : randomNumber(0, Number.MAX_SAFE_INTEGER)) as T;
    case 'string':
      return (v + ' ' + randomString()) as T;
    case 'undefined':
      return randomValue(1) || (randomNumber() as T);
    case 'object':
      return (Array.isArray(v)
        ? v.concat(randomArray(1, 5)).concat(1)
        : Object.assign({}, v, randomDictObject(1), {id: (v as any)?.id + 1})) as T;
  }
}

export function times(count: number, callback: (counter: number) => any) {
  return () =>
    Array(count)
      .fill(null)
      .forEach((v, i) => callback(i));
}

export function randomConfig<K extends string>(
  configOptions: K[],
  nestingLvl = 1
): {[key in K]: any} {
  return (
    Faker.helpers
      .shuffle(configOptions) // shuffle the options to pick random options every time
      .slice(0, randomNumber(0, configOptions.length - 1)) // pick some random options
      // generate a config object from options
      .reduce((reduced, option) => {
        // generate a config object from options
        reduced[option as string] = randomValue(nestingLvl);

        return reduced;
      }, {}) as {[key in K]: any}
  );
}

export function somewhatValidConfig(
  configOptions: Array<keyof UnitConfig<any>>,
  o: (new () => UnitBase<any> | Action<any>) | UnitBase<any> | Action<any>,
  validness = 0.7,
  nestingLvl = 1
): UnitConfig<any> {
  return (
    Faker.helpers
      .shuffle(configOptions) // shuffle the options to pick random options every time
      .slice(0, randomNumber(0, configOptions.length - 1)) // pick some random options
      // generate a config object from options
      .reduce((reduced, option) => {
        // generate a config object from options
        switch (option) {
          case 'initialValue':
            reduced[option] = randomInitialValue(o, validness, nestingLvl);
            break;
          default:
            reduced[option] = RANDOM_CONFIG_OPTIONS_VALUE_PRODUCERS[option](validness, nestingLvl);
        }

        return reduced;
      }, {})
  );
}

export function randomAsyncSystemConfig(
  configOptions: Array<keyof AsyncSystemConfig<any, any, any>>,
  unitsConfigOptions: Array<keyof UnitConfig<any>>,
  validness = 0.7,
  nestingLvl = 1
): AsyncSystemConfig<any, any, any> {
  return Faker.helpers
    .shuffle(configOptions) // shuffle the options to pick random options every time
    .slice(0, randomNumber(0, configOptions.length - 1)) // pick some random options
    .reduce((reduced, option) => {
      // generate a config object from options
      switch (option) {
        case 'initialValue':
          reduced[option] = randomAsyncSystemInitialValue(validness, nestingLvl);
          break;
        case 'UNITS':
        case 'QUERY_UNIT':
        case 'DATA_UNIT':
        case 'ERROR_UNIT':
          reduced[option] = somewhatValidConfig(
            unitsConfigOptions,
            GenericUnit,
            validness,
            nestingLvl
          );
          break;
        case 'PENDING_UNIT':
          reduced[option] = somewhatValidConfig(
            unitsConfigOptions,
            BoolUnit,
            validness,
            nestingLvl
          );
          break;
        default:
          reduced[option] = RANDOM_CONFIG_OPTIONS_VALUE_PRODUCERS[option](validness, nestingLvl);
      }

      return reduced;
    }, {});
}

export function randomInitialValue(
  unit: (new () => UnitBase<any> | Action<any>) | UnitBase<any> | Action<any>,
  validness = 0.7,
  nestingLvl = 1
) {
  return randomBoolean(validness) ? randomValidValue(unit) : randomValue(nestingLvl);
}

export function randomAsyncSystemInitialValue(validness = 0.7, nestingLvl = 1) {
  return {
    query: randomInitialValue(GenericUnit, validness, nestingLvl),
    data: randomInitialValue(GenericUnit, validness, nestingLvl),
    error: randomInitialValue(GenericUnit, validness, nestingLvl),
    pending: randomInitialValue(BoolUnit, validness, nestingLvl),
  } as AsyncSystemValue<any, any, any>;
}

export function randomUnitCtor(): new (config?: UnitConfig<any>) => UnitBase<any> &
  NonPrimitiveUnitBase<any> {
  return selectRandom(UNITS_CTORS);
}

export function randomUnit(config?: UnitConfig<any>) {
  const unitCtor = randomUnitCtor();
  return new unitCtor(config);
}

export function randomClusterItems(nestingLvl = 2, maxItems = 5): ClusterItems {
  --nestingLvl;
  const itemsKeys = randomKeys(maxItems, 1);
  const itemsCtors = itemsKeys.map(() => selectRandom(ALL_CTORS));

  return itemsKeys.reduce((reduced, key, index) => {
    if (itemsCtors[index] === Cluster) {
      if (nestingLvl >= 0) {
        const nestedClusterItems = randomClusterItems(nestingLvl, maxItems);
        reduced[key] = new itemsCtors[index](
          // cluster needs at least one item, otherwise it throws error
          Object.keys(nestedClusterItems).length ? nestedClusterItems : {unit: randomUnit()}
        );
      }
    } else {
      reduced[key] = new itemsCtors[index]();
    }
    return reduced;
  }, {});
}

export function randomMutation<T>(o: T): void {
  if (o == null || typeof o !== 'object') {
    return;
  }

  if (Array.isArray(o)) {
    o.forEach(v => randomMutation(v));
    switch (randomNumber(0, 4)) {
      case 0:
        o.splice(randomNumber(0, o.length), randomNumber(0, o.length), randomValue(1));
        break;
      case 1:
        o[randomNumOrStr()] = randomValue(1);
        break;
      case 2:
        o.length ? o.pop() : o.push(randomValue(1));
        break;
      case 3:
        o.length ? o.shift() : o.push(randomValue(1));
        break;
      case 4:
        if (o.length) {
          delete o[selectRandom(Object.keys(o))];
        } else {
          o.push(randomValue(1));
        }
    }
  } else if (isDict(o)) {
    const keys = Object.keys(o);

    keys.forEach(k => randomMutation(o[k]));

    if (!keys.length || randomBoolean()) {
      o[randomNumOrStr()] = randomValue(1);
    } else {
      delete o[selectRandom(keys)];
    }
  }
}

export function safeStringify(
  o: any,
  replacer?: (this: any, key: string, value: any) => any,
  space?: string | number
) {
  try {
    return JSON.stringify(o, replacer, space) || String(o);
  } catch (e1) {
    try {
      return String(o);
    } catch (e2) {
      return '';
    }
  }
}

export function findRandomPath(o: any): (string | number)[] {
  if (!isObject(o) || randomBoolean(-0.6)) {
    return [];
  }
  if (Array.isArray(o)) {
    const randIndex = randomNumber(0, o.length - 1);
    return !o.length ? [] : [randIndex, ...findRandomPath(o[randIndex])];
  }
  const randKey = selectRandom(Object.keys(o));
  return randKey == null ? [] : [randKey, ...findRandomPath(o[randKey])];
}

export function findEqualitiesByReference(A: any, B: any): any[] {
  if (A == null || B == null || typeof A !== 'object' || typeof B !== 'object') {
    return [];
  }
  if (A === B) {
    return [A]; // or [B]
  }

  const deepObjectExtract = (o, r = []) => {
    if (o == null || typeof o !== 'object') {
      return r;
    }

    r.push(o);

    if (!Array.isArray(o)) {
      o = Object.values(o);
    }

    o.forEach(c => deepObjectExtract(c, r));
    return r;
  };

  const AO = deepObjectExtract(A);
  const BO = deepObjectExtract(B);

  return AO.filter(o => BO.includes(o));
}

export const CUSTOM_MATCHERS = {
  toHaveSharedReferenceIn: () => {
    return {
      compare: (actual, expected) => {
        const equalitiesByReference = findEqualitiesByReference(actual, expected);
        const pass = equalitiesByReference.length > 0;

        const message = pass
          ? ''
          : `Expected ${safeStringify(
              actual
            )} to have at least one shared reference with/in ${safeStringify(expected)}.`;

        return {pass, message};
      },
      negativeCompare: (actual, expected) => {
        const equalitiesByReference = findEqualitiesByReference(actual, expected);
        const pass = !isObject(actual) || !isObject(expected) || equalitiesByReference.length === 0;

        const message = pass
          ? ''
          : `Expected ${safeStringify(
              actual
            )} to not have any shared reference with/in ${safeStringify(
              expected
            )}, but found the following: ${safeStringify(equalitiesByReference)}`;

        return {pass, message};
      },
    };
  },
};

export class MockStorage implements Storage {
  private readonly store: {[key: string]: string} = {};

  get length(): number {
    return Object.keys(this.store).length;
  }

  constructor() {
    makeNonEnumerable(this);

    return new Proxy(this, {
      set: (target, prop, value) => Reflect.set(this.store, prop, value),
      get: (target, prop) => {
        return prop !== 'store' &&
          (this.hasOwnProperty(prop) || Object.getPrototypeOf(this).hasOwnProperty(prop))
          ? typeof this[prop] === 'function'
            ? this[prop].bind(this)
            : Reflect.get(this, prop)
          : Reflect.get(this.store, prop);
      },
      has: (target, prop: string) =>
        (prop !== 'store' && Reflect.has(target, prop)) || Reflect.has(this.store, prop),
      deleteProperty: (target, prop) => Reflect.deleteProperty(this.store, prop),
      defineProperty: (target, prop, attributes) =>
        Reflect.defineProperty(this.store, prop, attributes),
      ownKeys: () => Reflect.ownKeys(this.store),
      getOwnPropertyDescriptor: (target, prop) =>
        Reflect.getOwnPropertyDescriptor(this.store, prop),
    });
  }

  setItem(key: string, value: string): void {
    this.store[key] = value + '';
  }

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  key(index: number): string | null {
    return Object.keys(this.store)[index] ?? null;
  }

  clear(): void {
    Object.keys(this.store).forEach(key => {
      delete this.store[key];
    });
  }
}
