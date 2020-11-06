import {Observable, Subject} from 'rxjs';
import {Configuration} from './configuration';
import {Base} from './abstract-base';
import {UnitBase} from './abstract-unit-base';
import {NonPrimitiveUnitBase} from './abstract-non-primitive-unit-base';
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
  KOf,
  ListUnitEvents,
  UnitConfig,
} from '../models';
import {
  isFunction,
  isObject,
  isValidIndex,
  IteratorSymbol,
  makeNonEnumerable,
  normalizeIndex,
  sanitizeIndices,
} from '../utils/funcs';

// tslint:disable-next-line:no-empty-interface
export interface ListUnit<Item> extends Array<Item> {}

/**
 * ListUnit is a reactive storage Unit that emulates `array`.
 *
 * ListUnit only accepts `array` data type as its value.
 * It ensures that at any point of time the value would always be an `array`.
 *
 * ListUnit is based on `array`, it implements all the `Array.prototype` methods that are available
 * in the environment/browser its running, including polyfills.
 * e.g.: `find`, `filter`, `includes`, etc.
 *
 * Learn more about Units [here](https://docs.activejs.dev/fundamentals/units). \
 * Learn more about ListUnit [here](https://docs.activejs.dev/fundamentals/units/listunit).
 *
 * Just like every other Non-Primitive ActiveJS Unit:
 * - ListUnit extends {@link NonPrimitiveUnitBase}
 * - Which further extends {@link UnitBase}, {@link Base} and `Observable`
 *
 * @category 1. Units
 */
export class ListUnit<Item> extends NonPrimitiveUnitBase<Item[]> {
  /**
   * @internal please do not use.
   */
  protected readonly eventsSubject: Subject<ListUnitEvents<Item>>;
  /**
   * On-demand observable events.
   */
  readonly events$: Observable<ListUnitEvents<Item>>;

  /**
   * The length of the list-{@link value}.
   */
  get length(): number {
    return this.rawValue().length;
  }

  /**
   * Indicates whether the length of the list-{@link value} is `0` or not.
   */
  get isEmpty(): boolean {
    return this.length === 0;
  }

  /**
   * @internal please do not use.
   */
  protected defaultValue(): Item[] {
    return [];
  }

  constructor(config?: UnitConfig<Item[]>) {
    super({
      ...Configuration.LIST_UNIT,
      ...config,
    });

    makeNonEnumerable(this);
  }

  /**
   * Extends {@link UnitBase.wouldDispatch} and adds additional check for type `array` {@see {@link Array.isArray}}, \
   * which cannot be bypassed even by using {@link force}.
   *
   * @param value The value to be dispatched.
   * @param force Whether dispatch-checks should be bypassed or not.
   * @returns A boolean indicating whether the param `value` would pass the dispatch-checks if dispatched.
   *
   * @category Common Units
   */
  wouldDispatch(value: Item[], force?: boolean): boolean {
    return this.isValidValue(value) && super.wouldDispatch(value, force);
  }

  /**
   * Sets the item on the given index in the list-{@link value}. \
   * Dispatches a new copy of the value, without mutating the current-value.
   *
   * It only works if the Unit is not frozen, and the index is valid-numeric.
   *
   * @param index The index of the item. \
   * A negative index is normalized as following: \
   * - If the index is less than negative of list-{@link length} it's treated as 0.
   * - Otherwise, it's subtracted from the list-{@link length}.
   * eg: If list length is `5`, negative index `-5` will be normalized to `0`, \
   * negative index `-6` will be normalized to `0`, and so on.
   * @param item The item.
   *
   * @triggers {@link EventListUnitSet}
   * @category Custom ListUnit
   */
  set(index: number, item: Item): void {
    if (this.isFrozen || !isValidIndex(index)) {
      return;
    }
    this.checkSerializabilityMaybe(item);

    const listShallowCopy = [...this.rawValue()];
    listShallowCopy[normalizeIndex(index, this.length)] = this.deepCopyMaybe(item);
    this.updateValueAndCache(listShallowCopy);

    if (this.eventsSubject && !this.isMuted) {
      this.eventsSubject.next(new EventListUnitSet(index, item));
    }
  }

  /**
   * Inserts items to the list-{@link value}. \
   * Dispatches a new copy of the value, without mutating the current-value.
   *
   * It only works if the Unit is not frozen and there's at least 1 item to be inserted.
   *
   * @param start The zero-based index in the list from which to start adding items. \
   * A negative index is normalized as following: \
   * - If the index is less than negative of list-{@link length} it's treated as 0.
   * - Otherwise, it's subtracted from the list-{@link length}.
   * eg: If list length is `5`, negative index `-5` will be normalized to `0`, \
   * negative index `-6` will be normalized to `0`, and so on.
   * @param items The items to be insert.
   * @returns The new length of the list.
   *
   * @triggers {@link EventListUnitSplice}
   * @category Custom ListUnit
   */
  insert(start: number, ...items: Item[]): number {
    if (this.isFrozen || !items.length) {
      return this.length;
    }
    this.checkSerializabilityMaybe(items);

    this.splice(start, 0, ...items); // splice also takes care of empty spaces

    return this.length;
  }

  /**
   * Removes items at given indices from the list-{@link value}. \
   * Dispatches a new copy of the value, without mutating the current-value. \
   * It modifies the length of the list as these indices are not deleted,
   * rather removed using `Array.prototype.splice`.
   *
   * It only works if the Unit is not frozen, and
   * the list is not empty, and at least 1 valid-numeric index is provided.
   *
   * Notes:
   * - The indices are removed in descending order.
   * - The indices are deduplicated.
   * - Negative indices are normalized before starting the removal. \
   * A negative index is normalized as following: \
   * - If the index is less than negative of list-{@link length}, it's treated as 0.
   * - Otherwise, it's subtracted from the list-{@link length}.
   * eg: If list length is `5`, negative index `-5` will be normalized to `0`, \
   * negative index `-6` will be normalized to `0`, and so on.
   *
   * @param indices The indices of the items to be removed.
   * @returns The removed items or an empty `array`.
   *
   * @triggers {@link EventListUnitRemove}
   * @category Custom ListUnit
   */
  remove(...indices: number[]): Item[] {
    const listLength = this.length;
    indices = sanitizeIndices(indices, listLength).filter(i => this.hasOwnProperty(i));

    if (this.isFrozen || !indices.length || this.isEmpty) {
      return [];
    }

    indices.sort().reverse();
    const removedItems = [];
    const listShallowCopy = [...this.rawValue()];

    indices.forEach(index => {
      removedItems.push(...this.deepCopyMaybe(listShallowCopy.splice(index, 1)));
    });
    this.updateValueAndCache(listShallowCopy);
    removedItems.reverse();

    if (this.eventsSubject && !this.isMuted) {
      this.eventsSubject.next(new EventListUnitRemove(indices, removedItems));
    }
    return removedItems;
  }

  /**
   * Removes items from the list-{@link value} where the predicate returns `truthy` value. \
   * Dispatches a new copy of the value, without mutating the current-value. \
   * It modifies the length of the list as these indices are not deleted,
   * rather removed using `Array.prototype.splice`.
   *
   * It only works if the Unit is not frozen, and
   * the predicate is a function, and the list is not empty. \
   * It uses {@link remove} internally, for actual removal.
   *
   * @param predicate A callback function that gets called for every item in the list with the item and index as arguments.
   * @returns The removed items or an empty `array`.
   *
   * @triggers {@link EventListUnitRemove}
   * @category Custom ListUnit
   */
  removeIf(predicate: (item: Item, index: number) => boolean): Item[] {
    if (this.isFrozen || typeof predicate !== 'function' || this.isEmpty) {
      return [];
    }

    const indicesToBeRemoved = [];
    this.value().forEach((item, index) => {
      if (predicate(item, index)) {
        indicesToBeRemoved.push(index);
      }
    });
    return this.remove(...(indicesToBeRemoved as [number, ...number[]]));
  }

  /**
   * Deletes items at given indices in the list-{@link value}. \
   * Dispatches a new copy of the value, without mutating the current-value. \
   * It doesn't modify the length of the list as these indices are only deleted, not removed.
   *
   * It only works if the Unit is not frozen, and
   * the list is not empty, and at least 1 valid-numeric index is provided.
   *
   * @param indices The indices of the items to be deleted. \
   * A negative index is normalized as following: \
   * - If the index is less than negative of list-{@link length} it's treated as 0.
   * - Otherwise, it's subtracted from the list-{@link length}.
   * eg: If list length is `5`, negative index `-5` will be normalized to `0`, \
   * negative index `-6` will be normalized to `0`, and so on.
   * @returns The removed items or an empty `array`.
   *
   * @triggers {@link EventListUnitDelete}
   * @category Custom ListUnit
   */
  delete(...indices: number[]): Item[] {
    indices = sanitizeIndices(indices, this.length).filter(i => this.hasOwnProperty(i));

    if (this.isFrozen || indices.length === 0 || this.isEmpty) {
      return [];
    }

    const deletedItems = [];
    const listShallowCopy = [...this.rawValue()];
    indices.forEach(index => {
      deletedItems.push(this.deepCopyMaybe(listShallowCopy[index]));
      delete listShallowCopy[index];
    });
    this.updateValueAndCache(listShallowCopy);

    if (this.eventsSubject && !this.isMuted) {
      this.eventsSubject.next(new EventListUnitDelete(indices, deletedItems));
    }
    return deletedItems;
  }

  /**
   * Deletes items from the list-{@link value} where the predicate returns `true`. \
   * Dispatches a new copy of the value, without mutating the current-value. \
   * It doesn't modify the length of the list as these indices are only deleted, not removed.
   *
   * It only works if the Unit is not frozen, and
   * the predicate is a function, and the list is not empty.
   *
   * @param predicate A callback function that gets called for every item in the list with the item and index as arguments.
   * @returns The removed items or an empty `array`.
   *
   * @triggers {@link EventListUnitDelete}
   * @category Custom ListUnit
   */
  deleteIf(predicate: (item: Item, index: number) => boolean): Item[] {
    if (this.isFrozen || typeof predicate !== 'function' || this.isEmpty) {
      return [];
    }

    const indicesToBeDeleted = [];
    this.value().forEach((item, index) => {
      if (predicate(item, index)) {
        indicesToBeDeleted.push(index);
      }
    });
    return this.delete(...(indicesToBeDeleted as [number, ...number[]]));
  }

  /**
   * Finds items of the list that have a direct child property
   * that matches with `key` and `value` passed as params.
   *
   * @example
   * ```ts
   * const initialValue = [{b: 1}, {b: 1, b2: 2}, {c: 1}, {b: null}];
   * const list = new ListUnit({initialValue});
   * const itemsFound = list.findByProp('b', 1);
   * console.log(itemsFound); // logs [[0, {b: 1}], [1, {b: 1, b2: 2}]]
   * ```
   *
   * @param key The key of the property whose value needs to be matched against param `value`.
   * @param value A value that will be matched against every item's prop-value using equality operator.
   * @param strictEquality A flag governing whether the value be matched using `===` or `==` operator.
   * Default is `true`, ie: strict equality `===`. Pass `false` to use `==` instead.
   * @returns An `array` of key/values of the matched properties, an empty `array` otherwise.
   *
   * @category Custom ListUnit
   */
  findByProp<k extends KOf<Item>>(
    key: k,
    value: string | number | boolean,
    strictEquality = true
  ): [number, Item][] {
    if (this.isEmpty) {
      return [];
    }

    return this.rawValue().reduce((res: [number, Item][], item, index) => {
      const aMatch =
        isObject(item) &&
        (strictEquality === false
          ? // tslint:disable-next-line:triple-equals
            item[key as string | number] == value
          : item[key as string | number] === value);

      if (aMatch) {
        res.push([index, this.deepCopyMaybe(item)]);
      }
      return res;
    }, []);
  }

  /**
   * Returns the item at the given index in the list-{@link value}. \
   * Negative index returns items from the end of the list.
   *
   * @param index The index of the item. \
   * A negative index is normalized as following: \
   * - If the index is less than negative of list-{@link length} it's treated as 0.
   * - Otherwise, it's subtracted from the list-{@link length}.
   * eg: If list length is `5`, negative index `-5` will be normalized to `0`, \
   * negative index `-6` will be normalized to `0`, and so on.
   * @returns The item at the given index.
   *
   * @category Custom ListUnit
   */
  get(index: number): Item | undefined {
    index = normalizeIndex(index, this.length);
    return this.hasOwnProperty(index) ? this.deepCopyMaybe(this.rawValue()[index]) : undefined;
  }

  /**
   * Returns the first item in the list-{@link value}.
   *
   * @returns The first item in the list.
   *
   * @category Custom ListUnit
   */
  first(): Item | undefined {
    return this.get(0);
  }

  /**
   * Returns the last item in the list-{@link value}.
   *
   * @returns The last item in the list.
   *
   * @category Custom ListUnit
   */
  last(): Item | undefined {
    return this.get(-1);
  }

  /**
   * Adds all the items of the list separated by the specified separator string, and
   * all the items are converted into string first using JSON.stringify
   *
   * @param separator A string used to separate one item of the list from the next in the resulting String.
   * If omitted, the list items are separated with a comma.
   * @returns Concatenated `JSON.stringify`d list items.
   *
   * @category Custom ListUnit
   */
  jsonJoin(separator?: string): string {
    return this.rawValue()
      .map(item => JSON.stringify(item))
      .join(separator);
  }

  /**
   * Appends new items to the list-{@link value}. \
   * Dispatches a new copy of the value, without mutating the current-value.
   *
   * It only works if the Unit is not frozen, and at least 1 item is provided.
   *
   * @param items The items to be appended to the list.
   * @returns The new length of the list.
   *
   * @triggers {@link EventListUnitPush}
   * @category Customised Array.prototype
   */
  push(...items: Item[]): number {
    if (this.isFrozen || !items.length) {
      return this.length;
    }
    this.checkSerializabilityMaybe(items);

    const listShallowCopy = [...this.rawValue()];
    const newLength = listShallowCopy.push(...this.deepCopyMaybe(items));
    this.updateValueAndCache(listShallowCopy);

    if (this.eventsSubject && !this.isMuted) {
      this.eventsSubject.next(new EventListUnitPush(items));
    }
    return newLength;
  }

  /**
   * Removes the last item from the list-{@link value} and returns it. \
   * Dispatches a new copy of the value, without mutating the current-value.
   *
   * It only works if the Unit is not frozen, and the list is not empty {@link isEmpty}.
   *
   * @returns The popped item.
   *
   * @triggers {@link EventListUnitPop}
   * @category Customised Array.prototype
   */
  pop(): Item | undefined {
    if (this.isFrozen || this.isEmpty) {
      return;
    }
    const listShallowCopy = [...this.rawValue()];
    const poppedItem = this.deepCopyMaybe(listShallowCopy.pop());
    this.updateValueAndCache(listShallowCopy);

    if (this.eventsSubject && !this.isMuted) {
      this.eventsSubject.next(new EventListUnitPop(poppedItem));
    }
    return poppedItem;
  }

  /**
   * Removes the first item from the list-{@link value} and returns it. \
   * Dispatches a new copy of the value, without mutating the current-value.
   *
   * It only works if the Unit is not frozen, and the list is not empty {@link isEmpty}.
   *
   * @returns The shifted item.
   *
   * @triggers {@link EventListUnitShift}
   * @category Customised Array.prototype
   */
  shift(): Item | undefined {
    if (this.isFrozen || this.isEmpty) {
      return;
    }
    const listShallowCopy = [...this.rawValue()];
    const shiftedItem = this.deepCopyMaybe(listShallowCopy.shift());
    this.updateValueAndCache(listShallowCopy);

    if (this.eventsSubject && !this.isMuted) {
      this.eventsSubject.next(new EventListUnitShift(shiftedItem));
    }
    return shiftedItem;
  }

  /**
   * Inserts new items at the start of the list-{@link value}. \
   * Dispatches a new copy of the value, without mutating the current-value.
   *
   * It only works if the Unit is not frozen, and at least 1 item is provided.
   *
   * @param items The items to be insert at the start of the list
   * @returns The new length of the list.
   *
   * @triggers {@link EventListUnitUnshift}
   * @category Customised Array.prototype
   */
  unshift(...items: Item[]): number {
    if (this.isFrozen || !items.length) {
      return this.length;
    }
    this.checkSerializabilityMaybe(items);

    const listShallowCopy = [...this.rawValue()];
    const newLength = listShallowCopy.unshift(...this.deepCopyMaybe(items));
    this.updateValueAndCache(listShallowCopy);

    if (this.eventsSubject && !this.isMuted) {
      this.eventsSubject.next(new EventListUnitUnshift(items));
    }
    return newLength;
  }

  /**
   * Removes items from the list-{@link value} and, if necessary,
   * inserts new items in their place, returning the deleted items. \
   * Dispatches a new copy of the value, without mutating the current-value.
   *
   * It only works if the Unit is not frozen, and \
   * either deleteCount is not 0 (loose comparison) and the list is not empty {@link isEmpty}, or \
   * there's at least 1 item to be added.
   *
   * @param start The zero-based location in the list from which to start removing items.
   * @param deleteCount The number of items to remove.
   * @param items Items to insert into the list in place of the deleted items.
   * @returns The deleted Items or an empty `array`.
   *
   * @triggers {@link EventListUnitSplice}
   * @category Customised Array.prototype
   */
  splice(start: number, deleteCount: number, ...items: Item[]): Item[] {
    // tslint:disable-next-line:triple-equals
    if (this.isFrozen || ((deleteCount == 0 || this.isEmpty) && !items.length)) {
      return [];
    }
    this.checkSerializabilityMaybe(items);

    const listShallowCopy = [...this.rawValue()];
    const removedItems = this.deepCopyMaybe(
      listShallowCopy.splice(start, deleteCount, ...items.map(item => this.deepCopyMaybe(item)))
    );
    this.updateValueAndCache(listShallowCopy);

    if (this.eventsSubject && !this.isMuted) {
      this.eventsSubject.next(new EventListUnitSplice(start, deleteCount, removedItems, items));
    }
    return removedItems;
  }

  /**
   * Fills a section of the list-{@link value} with provided param `item`. \
   * Dispatches a new copy of the value, without mutating the current-value.
   *
   * It only works if the Unit is not frozen, and the list is not empty {@link isEmpty}.
   *
   * @param item The item to fill the section of ListUnit's value with.
   * @param start The index to start filling the list at. If start is negative, it is treated as
   * length+start where length is the length of the list.
   * @param end The index to stop filling the list at. If end is negative, it is treated as
   * length+end.
   * @returns Nothing, unlike `Array.prototype.fill`
   *
   * @triggers {@link EventListUnitFill}
   * @category Customised Array.prototype
   */
  fill(item: Item, start?: number, end?: number): any {
    if (this.isFrozen || this.isEmpty) {
      return;
    }
    this.checkSerializabilityMaybe(item);

    const listShallowCopy = [...this.rawValue()];
    listShallowCopy.fill(this.deepCopyMaybe(item), start, end);
    this.updateValueAndCache(listShallowCopy);

    if (this.eventsSubject && !this.isMuted) {
      this.eventsSubject.next(new EventListUnitFill(item, start, end));
    }
  }

  /**
   * Copies a section of the current-value identified by param `start` and param `end`
   * to the ListUnit's value starting at position {@link target}. \
   * Dispatches a new copy of the value, without mutating the current-value.
   *
   * It only works if the Unit is not frozen, and the list is not empty {@link isEmpty}.
   *
   * @param target If target is negative, it is treated as length+target where length is the
   * length of the list.
   * @param start If start is negative, it is treated as length+start. If end is negative, it
   * is treated as length+end.
   * @param end If end is not specified, length of the list is used as its default value.
   * @returns Nothing, unlike `Array.prototype.copyWithin`
   *
   * @triggers {@link EventListUnitCopyWithin}
   * @category Customised Array.prototype
   */
  copyWithin(target: number, start: number, end?: number): any {
    if (this.isFrozen || this.isEmpty) {
      return;
    }
    const listShallowCopy = [...this.rawValue()];
    listShallowCopy.copyWithin(target, start, end);
    this.updateValueAndCache(listShallowCopy);

    if (this.eventsSubject && !this.isMuted) {
      this.eventsSubject.next(new EventListUnitCopyWithin(target, start, end));
    }
  }

  /**
   * Reverses the items in the list-{@link value}. \
   * Dispatches a new copy of the value, without mutating the current-value.
   *
   * It only works if the Unit is not frozen, and the list is not empty {@link isEmpty}.
   *
   * @returns Nothing, unlike `Array.prototype.reverse`
   *
   * @triggers {@link EventListUnitReverse}
   * @category Customised Array.prototype
   */
  reverse(): any {
    if (this.isFrozen || this.isEmpty) {
      return;
    }
    const listShallowCopyReversed = [...this.rawValue()].reverse();
    this.updateValueAndCache(listShallowCopyReversed);

    if (this.eventsSubject && !this.isMuted) {
      this.eventsSubject.next(new EventListUnitReverse());
    }
  }

  /**
   * Sorts the list-{@link value}. \
   * Dispatches a new copy of the value, without mutating the current-value.
   *
   * It only works if the Unit is not frozen, and the list is not empty {@link isEmpty}.
   *
   * @param compareFn The name of the function used to determine the order of the items.
   *        If omitted, the items are sorted in ascending, ASCII character order.
   * @returns Nothing, unlike `Array.prototype.sort`
   *
   * @triggers {@link EventListUnitSort}
   * @category Customised Array.prototype
   */
  sort(compareFn?: (a: Item, b: Item) => number): any {
    if (this.isFrozen || this.isEmpty) {
      return;
    }
    const listShallowCopySorted =
      typeof compareFn === 'function'
        ? [...this.value()].sort(compareFn)
        : [...this.rawValue()].sort();
    this.updateValueAndCache(listShallowCopySorted);

    if (this.eventsSubject && !this.isMuted) {
      this.eventsSubject.next(new EventListUnitSort());
    }
  }

  /**
   * Returns a section of the list-{@link value}.
   *
   * @param start The beginning of the specified portion of the list.
   * @param end The end of the specified portion of the list.
   * @returns A section of the list.
   *
   * @category Customised Array.prototype
   */
  slice(start?: number, end?: number): Item[] {
    return this.deepCopyMaybe(this.rawValue().slice(start, end));
  }

  /**
   * Performs the specified action for each item in the list-{@link value}. \
   * It's a drop-in replacement for the `Array.prototype.forEach` method.
   *
   * @param callbackFn A function that accepts up to three arguments.
   * forEvery calls the callbackFn function one time for each element in the list.
   * @param thisArg An object to which this keyword can refer in the callbackFn function.
   * If thisArg is omitted, undefined is used as this value.
   *
   * @category Customised Array.prototype
   */
  forEvery(callbackFn: (item: Item, index: number, array: Item[]) => void, thisArg?: any): void {
    Array.prototype.forEach.apply(this.value(), [callbackFn, thisArg]);
  }

  /**
   * @internal please do not use.
   */
  [IteratorSymbol](): IterableIterator<Item> {
    return Array.prototype[IteratorSymbol].call(this.value());
  }

  /**
   * @internal please do not use.
   */
  protected isValidValue(value: any): boolean {
    return Array.isArray(value);
  }

  /**
   * @alias forEvery
   * @deprecated Use {@link forEvery} instead.
   * This `forEach` is not the usual `Array.forEach`.
   * This `forEach` is an RxJS feature, which got inherited due to extending the Observable class,
   * But this is not what you want, most probably you just want to iterate over the items, for that
   * we've implemented the normal `forEach` functionality into `forEvery` method.
   *
   * This `forEach` is marked deprecated to prevent accidental usage, and avoid confusion.
   * You can still use it though, if you want the RxJS feature,
   * see {@link Observable.forEach} for usage.
   * @hidden
   */
  forEach: any;

  /**
   * @deprecated
   * @ignore
   * @internal please do not use.
   */
  [Symbol.unscopables]: any;

  /**
   * @deprecated
   * @ignore
   * @internal please do not use.
   */
  static Array: any;
}

/**
 * @internal please do not use.
 */
const MethodsWithNoRiskOfMutation = [
  'includes',
  'indexOf',
  'lastIndexOf',
  'join',
  'keys',
  'toLocaleString',
];
MethodsWithNoRiskOfMutation.forEach(methodName => {
  Object.defineProperty(ListUnit.prototype, methodName, {
    value(...args) {
      return Array.prototype[methodName].apply(this.rawValue(), args);
    },
  });
});

/**
 * @internal please do not use.
 */
const MethodsNotToImplement = [
  ...Object.getOwnPropertyNames(Observable.prototype),
  ...Object.getOwnPropertyNames(Base.prototype),
  ...Object.getOwnPropertyNames(UnitBase.prototype),
  ...Object.getOwnPropertyNames(ListUnit.prototype),
  ...MethodsWithNoRiskOfMutation,
];
Object.getOwnPropertyNames(Array.prototype).forEach(method => {
  if (!isFunction(Array.prototype[method]) || MethodsNotToImplement.includes(method)) {
    return;
  }

  Object.defineProperty(ListUnit.prototype, method, {
    value(...args) {
      return Array.prototype[method].apply(this.value(), args);
    },
  });
});
