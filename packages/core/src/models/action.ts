import {Observable} from 'rxjs';
import {Action} from '../lib/action';

/**
 * Shared configuration options for Actions.
 *
 * @category Action
 */
export interface SharedActionConfig {
  /**
   * A flag to control the replay behaviour of an Action.
   * It decides whether the value should be replayed when you subscribe to the default Observable.
   *
   * @default `false`
   */
  replay?: boolean;
}

/**
 * Configuration options for an Action.
 *
 * @category Action
 */
export interface ActionConfig<T> extends SharedActionConfig {
  /**
   * A unique id to identify an Action.
   *
   * @default `undefined`
   */
  id?: string;

  /**
   * The initial value for the Action. \
   * It's probably only useful when the Action is configured to replay the value on subscription. \
   * It'll only be used if it's not `undefined`.
   *
   * @default `undefined`
   */
  initialValue?: T;
}

/**
 * @param action The Action being used as the source observable for creating a new Observable.
 *
 * @category Units
 */
export type ActionStreamObservableProducer<T extends Action<any>, R = any> = (
  action: T
) => Observable<R>;
