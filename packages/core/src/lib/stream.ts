import {Observable, Subscription} from 'rxjs';
import {makeNonEnumerable} from '../utils/funcs';

/**
 * A wrapper on RxJS Subscription.
 *
 * Stream is a simple construct that adds the ability to re-subscribe to the provided Observable.
 * Given an Observable, it immediately gets subscribed, and the subscription instance is saved as Stream's property.
 * The Stream keeps the reference to the provided Observable, and uses it for re-subscription when asked.
 *
 * See {@link https://docs.activejs.dev/utilities/stream} for more details.
 *
 * @category 4. Utility
 */
export class Stream {
  // tslint:disable-next-line:variable-name
  private _subscription: Subscription;

  /**
   * The current Subscription instance.
   * It can be `undefined` if there's no active Subscription.
   */
  get subscription(): Subscription {
    return this._subscription;
  }

  /**
   * Indicates whether the Stream is active or not. \
   * i.e.: Whether the provided Observable is subscribed or not.
   */
  get isSubscribed(): boolean {
    return !!this._subscription;
  }

  /**
   * Given an Observable, subscribes to it immediately, and saves the Subscription instance.
   *
   * @param observable The Observable to be used for subscription.
   */
  constructor(private observable: Observable<any>) {
    if (!(observable instanceof Observable)) {
      throw new TypeError('Expected an Observable, got ' + observable);
    }

    this.subscribe();
    makeNonEnumerable(this);
  }

  /**
   * Subscribe to the provided Observable, and save the Subscription instance.
   *
   * @returns Subscription instance returned by {@link Observable.subscribe}.
   *
   * @category Common
   */
  private subscribe(): Subscription {
    this._subscription = this.observable.subscribe({error: () => this.unsubscribe()});
    return this.subscription;
  }

  /**
   * Unsubscribes from current subscription instance using {@link Subscription.unsubscribe}. \
   * It also deletes the Subscription instance.
   *
   * @category Custom Stream
   */
  unsubscribe(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      delete this._subscription;
    }
  }

  /**
   * Unsubscribes and then immediately subscribes again,
   * also, replaces the {@link subscription} instance with the new Subscription instance.
   *
   * @returns Subscription instance returned by subscribing to the provided Observable {@link Observable.subscribe}.
   *
   * @category Custom Stream
   */
  resubscribe(): Subscription {
    this.unsubscribe();
    return this.subscribe();
  }
}
