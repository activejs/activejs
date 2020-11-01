import {AsyncSystemConfig, ClusterItems} from '../models';
import {Base} from '../lib/abstract-base';
import {isDict, isSerializable, NOOP} from '../utils/funcs';
import {logWarn} from '../utils/logger';

export function checkAsyncSystemConfig(config: AsyncSystemConfig<any, any, any>): () => void {
  if (config) {
    if (config.clearDataOnError === true && config.clearDataOnQuery === true) {
      return logWarn(`When "clearDataOnQuery" is set to true,
"clearDataOnError" stops working, as only one of them can work at a time\n
Consider only setting one at a time.`);
    }
    if (config.clearErrorOnData === true && config.clearErrorOnQuery === true) {
      return logWarn(`When "clearErrorOnQuery" is set to true,
"clearErrorOnData" stops working, as only one of them can work at a time\n
Consider only setting one at a time.`);
    }
  }
  return NOOP;
}

export function checkSerializability<T>(o: T): void {
  const [serializable, nonSerializableVal] = isSerializable(o);
  if (serializable === false) {
    throw new TypeError(
      `Non-serializable value ${String(nonSerializableVal)} of type ${
        nonSerializableVal.constructor.name
      }:${typeof nonSerializableVal} detected by "checkSerializability" check. Consider a serializable alternative.`
    );
  }
}

export function checkClusterItems(items: ClusterItems): void {
  if (!isDict(items) || !Object.values(items).some(item => item instanceof Base)) {
    throw new TypeError(
      `No ActiveJS construct provided; expected at least one Unit, System, Action or Cluster; got ${String(
        items
      )}`
    );
  }
}

export function checkPath(path: (string | number)[]): void {
  if (!path.length) {
    throw new TypeError(`Expected at least one key`);
  }
  const invalidKeyIndex = path.findIndex(key => typeof key !== 'string' && typeof key !== 'number');
  if (invalidKeyIndex > -1) {
    const invalidKey = path[invalidKeyIndex];
    throw new TypeError(
      `Expected numbers and strings, but got ${invalidKey} of type ${typeof invalidKey}`
    );
  }
}
