import {merge} from 'rxjs';
import {Base} from './abstract-base';
import {Configuration} from './configuration';
import {Stream} from './stream';
import {
  ClusterConfig,
  ClusterItems,
  ClusterStreamObservableProducer,
  InstancesMapToValuesMap,
} from '../models';
import {checkClusterItems} from '../checks/common';
import {IteratorSymbol, makeNonEnumerable} from '../utils/funcs';

/**
 * A Cluster is just a wrapper, a group, of two or more ActiveJS fundamental constructs, `Units`, `Systems`, `Actions`, or even `Clusters`.
 *
 * It creates a master `Observable` of the combined value of its members by merging all the provided Observable constructs.
 * Whenever any of these wrapped constructs emits a value, `Cluster` emits a new combined-value.
 *
 * See {@link https://docs.activejs.dev/fundamentals/cluster} for more details.
 *
 * @category 4. Utility
 */
export class Cluster<
  T extends ClusterItems = ClusterItems,
  K extends keyof T = keyof T,
  V = InstancesMapToValuesMap<T>
> extends Base<V> {
  // tslint:disable:variable-name

  /**
   * Configured options. \
   * Combination of global-options {@link GlobalUnitConfig} and the options passed on instantiation.
   */
  readonly config: Readonly<ClusterConfig>;

  /**
   * @internal please do not use.
   */
  private itemsKeys: K[];

  /**
   * The items part of this cluster, stored as key-value pairs.
   */
  readonly items: Readonly<T> = {} as any;

  /**
   * @internal please do not use.
   */
  private _itemsCount: number;

  /**
   * The count of items part of this cluster.
   */
  get itemsCount(): number {
    return this._itemsCount;
  }

  // tslint:enable:variable-name

  /**
   * Combined value of the items part of this Cluster.
   *
   * @category Access Value
   */
  value() {
    const val = this.itemsKeys.reduce((reduced, key) => {
      reduced[key] = this.items[key].value();
      return reduced;
    }, {} as any) as V;
    if (Configuration.ENVIRONMENT.checkImmutability === true) {
      Object.freeze(val);
    }
    return val;
  }

  constructor(items: T, config?: ClusterConfig) {
    super({
      ...Configuration.CLUSTER,
      ...config,
    });

    checkClusterItems(items);

    this.extractItems(items);
    this.startListeningAndEmitting();

    makeNonEnumerable(this);
    Object.freeze(this.items);
  }

  /**
   * A helper method that creates a stream by subscribing to the Observable returned by the param `observableProducer` callback.
   *
   * Ideally the callback function creates an Observable by applying `Observable.pipe`.
   *
   * Just know that you should catch the error in a sub-pipe (ie: do not let it propagate to the main-pipe), otherwise
   * as usual the stream will stop working, and will not react on any further emissions.
   *
   * @param observableProducer A callback function that should return an Observable.
   *
   * @category Common
   */
  createStream<R>(observableProducer: ClusterStreamObservableProducer<this, R>): Stream {
    const observable = observableProducer(this);

    return new Stream(observable);
  }

  /**
   * Select a child by providing its key.
   *
   * @param key The key of the child.
   *
   * @category Custom Cluster
   */
  select<k extends K>(key: k): T[k] {
    return this.items[key];
  }

  /**
   * Performs the specified action for each child of the Cluster {@link items}. \
   * It's a drop-in replacement for the `forEach` method.
   *
   * @param callbackFn A function that accepts up to three arguments.
   * forEvery calls the callbackFn function one time for each element in the list.
   * @param thisArg An object to which this keyword can refer in the callbackFn function.
   * If thisArg is omitted, undefined is used as this value.
   *
   * @category Custom Cluster
   */
  forEvery(
    callbackFn: (item: T[K], key: K, index: number, entries: [K, T[K]][]) => void,
    thisArg?: any
  ): void {
    Object.entries(this.items).forEach(([key, item], i, itemsAsEntries) =>
      callbackFn.call(thisArg, item, key, i, itemsAsEntries)
    );
  }

  /** Iterator */
  [Symbol.iterator](): Iterator<[K, T[K]]>;
  /**
   * @internal please do not use.
   */
  [IteratorSymbol](): Iterator<[K, T[K]]> {
    let index = 0;
    const items = Object.entries(this.items) as [K, T[K]][];
    const length: number = items.length;

    return {
      next(): IteratorResult<[K, T[K]]> {
        return {value: items[index++], done: index > length};
      },
    };
  }

  /**
   * @internal please do not use.
   */
  private extractItems(items: T): void {
    this.itemsKeys = Object.keys(items).filter(key => items[key] instanceof Base) as K[];
    this._itemsCount = this.itemsKeys.length;

    this.itemsKeys.forEach(key => {
      (this.items as T)[key] = items[key];
    });
  }

  /**
   * @internal please do not use.
   */
  private startListeningAndEmitting(): void {
    this.emit();
    merge(...Object.values(this.items).map(item => item.future$)).subscribe(() => this.emit());
  }

  /**
   * @internal please do not use.
   */
  protected emit(value = this.combinedEmittedValues()): void {
    if (Configuration.ENVIRONMENT.checkImmutability === true) {
      Object.freeze(value);
    }
    super.emit(value);
  }

  /**
   * @internal please do not use.
   */
  private combinedEmittedValues() {
    return this.itemsKeys.reduce((reduced, key) => {
      // tslint:disable-next-line:no-string-literal
      reduced[key] = this.items[key]['emittedValue'];
      return reduced;
    }, {} as any) as V;
  }
}
