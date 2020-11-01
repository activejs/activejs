import {UnitConfig} from '../models';

/**
 * @internal please do not use.
 */
export const NOOP = () => {};

/**
 * @internal please do not use.
 */
export const IteratorSymbol: symbol =
  (typeof Symbol === 'function' && Symbol.iterator) ||
  /* istanbul ignore next */ ('@@iterator' as any);

/**
 * @internal please do not use.
 */
export function isValidId(id: any): id is string {
  return typeof id === 'string' && !!id.trim().length;
}

/**
 * @internal please do not use.
 */
export function isDict(o: any): o is object {
  return Object.prototype.toString.call(o) === '[object Object]';
}

/**
 * @internal please do not use.
 */
export function isObject(o: any): boolean {
  return o != null && typeof o === 'object';
}

/**
 * @internal please do not use.
 */
export function isValidKey(key: any): key is number | string {
  return typeof key === 'string' || typeof key === 'number';
}

/**
 * @internal please do not use.
 */
export function isValidIndex(i: any): i is number | string {
  const a = [];
  a[i] = 1;
  return !!a.length && a[i] === 1;
}

/**
 * @internal please do not use.
 */
export function normalizeIndex(index: number, arrLength: number): number {
  return index < 0 ? (index < -arrLength ? 0 : arrLength + index) : index;
}

/**
 * @internal please do not use.
 */
export function sanitizeIndices(indices: number[], arrLength: number): number[] {
  const sanitizedIndices = [];

  indices.forEach(index => {
    index = normalizeIndex(index, arrLength);

    if (index < arrLength && isValidIndex(index)) {
      sanitizedIndices.push(index);
    }
  });

  return deDuplicate(sanitizedIndices);
}

/**
 * @internal please do not use.
 */
export function isNumber(n: any): n is number {
  return typeof n === 'number' && !isNaN(n);
}

/**
 * @internal please do not use.
 */
// tslint:disable-next-line:ban-types
export function isFunction(fn: any): fn is Function {
  return typeof fn === 'function';
}

/**
 * @internal please do not use.
 */
/*export function isNativeFn(fn: any): fn is () => any {
  return /{\s*?\[native code]\s*?}/.test('' + fn);
}*/

/**
 * Creates a clone of the provided value.\
 * All the primitives are returned as is, since they are immutable.\
 * Non-primitives that this function can clone are array and object-literal.\
 * Other non-primitives are returned as is.
 *
 * This function is also used internally by ActiveJS.
 *
 * @param o The value to be cloned.
 * @returns A clone of the provided value.
 *
 * @category Global
 */
export function deepCopy<T>(o: T): T {
  if (o == null || typeof o !== 'object') {
    return o;
  }
  if (Array.isArray(o)) {
    return (o as any).map(v => deepCopy(v));
  }
  if (isDict(o)) {
    return Object.keys(o).reduce((newO, k) => {
      newO[k] = deepCopy(o[k]);
      return newO;
    }, {} as T);
  }
  return o;
}

/**
 * @internal please do not use.
 */
export function deepFreeze<T>(o: T): T {
  if (!isObject(o)) {
    return o;
  }

  if (Array.isArray(o)) {
    (o as any).forEach(v => deepFreeze(v));
  } else if (isDict(o)) {
    Object.keys(o).forEach(k => deepFreeze(o[k]));
  }

  try {
    return Object.freeze(o);
  } catch (e) {
    return o;
  }
}

/**
 * @internal please do not use.
 */
export function deDuplicate<T extends any[]>(arr: T): T {
  if (typeof Set === 'function') {
    return [...new Set(arr)] as T;
  } else {
    return arr.filter((x, i) => arr.indexOf(x) === i) as T;
  }
}

/**
 * @internal please do not use.
 */
export function isSerializable<T>(o: T): [true] | [false, any] {
  if (o == null || typeof o === 'string' || typeof o === 'boolean' || typeof o === 'number') {
    return [true];
  }

  /*if (typeof o === 'number') {
    return o === Infinity || o === -Infinity ? [false, o] : [true];
  }*/

  if (Array.isArray(o)) {
    let foundPositive: [false, any];

    o.find(v => {
      const testResult = isSerializable(v);
      if (testResult[0] === false) {
        foundPositive = testResult;
        return true;
      }
    });

    return foundPositive || [true];
  } else if (o.constructor === Object) {
    let foundPositive: [false, any];

    Object.keys(o).find(k => {
      const testResult = isSerializable(o[k]);
      if (testResult[0] === false) {
        foundPositive = testResult;
        return true;
      }
    });

    return foundPositive || [true];
  }

  return [false, o];
}

/**
 * @internal please do not use.
 */
export function findIndex<T>(
  array: Array<T>,
  predicate: (value: T, index: number, obj: T[]) => boolean,
  fromIndex?: number
): number {
  let i = isValidIndex(fromIndex) ? Math.max(0, Math.min(fromIndex, array.length - 1)) : 0;
  while (i < array.length) {
    if (predicate(array[i], i, array)) {
      return i;
    }
    ++i;
  }
  return -1;
}

/**
 * @internal please do not use.
 */
export function findIndexBackwards<T>(
  array: Array<T>,
  predicate: (value: T, index: number, obj: T[]) => boolean,
  fromIndex?: number
): number {
  let i = isValidIndex(fromIndex)
    ? Math.max(0, Math.min(fromIndex, array.length - 1))
    : array.length - 1;
  while (i > -1) {
    if (predicate(array[i], i, array)) {
      return i;
    }
    --i;
  }
  return -1;
}

/**
 * @internal please do not use.
 */
export function debounce(
  func: (...args) => any,
  waitTime?,
  callMode?: 'START' | 'END' | 'BOTH'
): any {
  if (!isNumber(waitTime)) {
    waitTime = 200;
  }
  if (!['START', 'END', 'BOTH'].includes(callMode)) {
    callMode = 'END';
  }
  let timeout;

  return function (...args) {
    const context = this;

    const later = () => {
      timeout = null;
      if (callMode !== 'START') {
        return func.apply(context, args);
      }
    };

    const callNow = callMode !== 'END' && !timeout;

    clearTimeout(timeout);
    timeout = setTimeout(later, waitTime);

    if (callNow) {
      return func.apply(context, args);
    }
  };
}

/**
 * @internal please do not use.
 */
export function makeNonEnumerable<T extends object>(o: T): void {
  if (o == null || typeof o !== 'object') {
    return;
  }
  Object.keys(o).forEach(key => {
    Object.defineProperty(o, key, {
      enumerable: false,
    });
  });
}

/**
 * @internal please do not use.
 */
export function generateAsyncSystemIds(
  systemId: string,
  queryConfig: UnitConfig<any>,
  dataConfig: UnitConfig<any>,
  errorConfig: UnitConfig<any>,
  pendingConfig: UnitConfig<boolean>
) {
  const ids = {
    ...(queryConfig?.hasOwnProperty('id') && {queryUnitId: queryConfig.id}),
    ...(dataConfig?.hasOwnProperty('id') && {dataUnitId: dataConfig.id}),
    ...(errorConfig?.hasOwnProperty('id') && {errorUnitId: errorConfig.id}),
    ...(pendingConfig?.hasOwnProperty('id') && {pendingUnitId: pendingConfig.id}),
  };
  if (isValidId(systemId)) {
    ids.queryUnitId = ids.queryUnitId ?? systemId + '_QUERY';
    ids.dataUnitId = ids.dataUnitId ?? systemId + '_DATA';
    ids.errorUnitId = ids.errorUnitId ?? systemId + '_ERROR';
    ids.pendingUnitId = ids.pendingUnitId ?? systemId + '_PENDING';
  }
  return ids;
}

/**
 * @internal please do not use.
 */
export function plucker<T>(o: T, path: (string | number)[]): any {
  const length = Array.isArray(path) ? path.length : 0;
  for (let i = 0; i < length; i++) {
    if (o == null) {
      return undefined;
    }
    o = Object.prototype.hasOwnProperty.call(o, path[i]) ? o[path[i]] : undefined;
  }
  return o;
}

/**
 * @internal please do not use.
 */
export function hashCode(str: string): string {
  // tslint:disable:no-bitwise
  let hash = 0;
  const length = typeof str === 'string' ? str.length : 0;
  if (length === 0) {
    return String(hash);
  }
  for (let i = 0; i < length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  hash = hash >>> 0;
  return Number(hash).toString(32).toUpperCase();
  // tslint:enable:no-bitwise
}

/**
 * @internal please do not use.
 */
export function stackTrace(): string {
  try {
    throw new Error();
  } catch (error) {
    return error.stacktrace || error.stack;
  }
}

/**
 * @internal please do not use.
 */
export function getLocationId(source: any): string {
  if (source == null || typeof source !== 'object') {
    return '';
  }
  source = source.constructor.name;
  const errorTrace = stackTrace();
  const locationMatch = errorTrace.match(
    new RegExp(
      // get two lines beyond ActiveJS scope https://regexr.com/5eb9g
      `new ${source}\\b.+\\n(?:[\\s\\S]+new (?:AsyncSystem|Cluster)\\b.+\\n)?((?:.+\\n?){1,2})`
    )
  );
  return hashCode(locationMatch?.[1] || errorTrace);
}
