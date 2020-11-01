import {Unit} from './units';
import {Base} from '../lib/abstract-base';
import {UnitBase} from '../lib/abstract-unit-base';
import {AsyncSystemBase} from '../lib/async-system-base';
import {AsyncSystem} from '../lib/async-system';
import {Action} from '../lib/action';
import {Cluster} from '../lib/cluster';
import {Observable} from 'rxjs';

/**
 * Shared configuration options for Clusters.
 *
 * @category Cluster
 */
export interface SharedClusterConfig {
  /**
   * A flag to control the replay behaviour of a Cluster. \
   * It decides whether the value should be replayed when you subscribe to the default Observable.
   *
   * @default `true`
   */
  replay?: boolean;
}

/**
 * Configuration options for a Cluster.
 *
 * @category Cluster
 */
export interface ClusterConfig extends SharedClusterConfig {
  /**
   * A unique id to identify a Cluster.
   *
   * @default `undefined`
   */
  id?: string;
}

/**
 * Type of dictionary object that a Cluster accepts.
 *
 * @category Cluster
 */
export type ClusterItems = {
  [key in string | number]:
    | Base<any>
    | UnitBase<any>
    | Unit
    | AsyncSystemBase<any, any, any>
    | AsyncSystem<any, any, any>
    | Action<any>
    | Cluster<any>;
};

/**
 * @internal please do not use.
 * @category Cluster
 */
export type InstancesMapToValuesMap<T extends ClusterItems = ClusterItems> = {
  [K in keyof T]: ReturnType<T[K]['value']>;
};

/**
 * @param action The Action being used as the source observable for creating a new Observable.
 *
 * @category Units
 */
export type ClusterStreamObservableProducer<T extends Cluster<any>, R = any> = (
  cluster: T
) => Observable<R>;
