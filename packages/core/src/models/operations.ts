/**
 * Typing for options that can be passed to the dispatch function.
 * @category Units
 */
export interface DispatchOptions {
  /**
   * Set it to `true` to bypass dispatch debounce. \
   * It can be useful if the Unit was configured with {@link UnitConfig.dispatchDebounce}.
   */
  bypassDebounce?: boolean;
  /**
   * Set it to `true` to bypass {@link UnitConfig.distinctDispatchCheck} and {@link UnitConfig.customDispatchCheck}. \
   * It can't bypass a frozen Unit, or Unit's value type check. \
   * e.g. It can't make a `ListUnit` accept a non-array value.
   */
  force?: boolean;
  /**
   * Set it to `true` to replace the value in cached-values at the current {@link UnitConfig.cacheIndex}.
   */
  cacheReplace?: boolean;
}

/**
 * Type for value producer function that is passed to an Action or Unit's dispatch method.
 * @category Action/Units
 */
export type DispatchValueProducer<T> = (value: T) => T;

/**
 * Typings for the options that can be passed to clean-up methods like `clearCache`, `clear` or `reset`.
 * @category Units
 */
export interface ClearCacheOptions {
  /**
   * Set it to `true` to leave the first value in the cache while clearing the cache.
   */
  leaveFirst?: boolean;
  /**
   * Set it to `true` to leave the last value in the cache while clearing the cache.
   */
  leaveLast?: boolean;
}
