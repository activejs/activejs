import {Configuration} from './configuration';

/**
 * @internal
 * The prefix string for ids of persistent Units, applied when saving/retrieving value to/from persistent storage,
 * This is intended to avoid conflicts with other items in the storage that do not belong to ActiveJS,
 * and to identify items in the storage that belong to ActiveJS for features like {@link clearPersistentStorage} to work as intended.
 */
export const KeyPrefix = '_AJS_UNIT_';

/**
 * To clear persisted values of persistent Units from storage.
 *
 * Note: It does not clear the value of Units, only the persisted value is cleared.
 *
 * See {@link https://docs.activejs.dev/guides/persistence} for more details.
 *
 * @param storage The Storage from where the Units' persisted values need to be removed. \
 * {@link Configuration.storage} is used as storage by default. \
 * You can pass a reference to whichever storage you want to clean up.
 * @category Global
 */
export function clearPersistentStorage(storage: Storage = Configuration.storage): void {
  Object.keys(storage).forEach(key => {
    if (key.startsWith(KeyPrefix)) {
      storage.removeItem(key);
    }
  });
}

/**
 * @internal please do not use.
 */
export function save<T>(key: string, value: T, storage: Storage = Configuration.storage): void {
  let jsonString: string;
  try {
    // wrap the value to later easily determine whether any value has been
    // saved to storage or not.
    // eg: If storage.get('item') is null, it can mean many things,
    // but {value: null} can only mean that the value is null.
    jsonString = JSON.stringify({value});
  } catch (e) {
    /* istanbul ignore next */
    jsonString = JSON.stringify({value: String(value)});
  }
  storage.setItem(KeyPrefix + key, jsonString);
}

/**
 * @internal please do not use.
 */
export function retrieve<T>(
  key: string,
  storage: Storage = Configuration.storage
): {value: T} | null {
  const raw = storage.getItem(KeyPrefix + key);
  try {
    return JSON.parse(raw);
  } catch (e) {
    /* istanbul ignore next */
    return null;
  }
}

/**
 * @internal please do not use.
 */
export function remove<T>(key: string, storage: Storage = Configuration.storage): void {
  storage.removeItem(KeyPrefix + key);
}
