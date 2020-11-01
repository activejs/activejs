import {Observable, Subject} from 'rxjs';

/**
 * @internal please do not use.
 * A prototype-free keyof alternative.
 * Works for object, array, string, number and boolean.
 */
export type KOf<T, K extends keyof T = keyof T> = T extends Array<any> | string
  ? Extract<K, number>
  : T extends number | boolean
  ? never
  : K;

/**
 * @internal please do not use.
 */
export type ExtractObservableType<T> = T extends Observable<infer X> ? X : never;
/**
 * @internal please do not use.
 */
export type RemapObservablesToSubjects<T, K extends keyof T = keyof T> = {
  [key in K]: Subject<ExtractObservableType<T[key]>>;
};

/**
 * @internal please do not use.
 */
export type KeyValToKeyValProducer<T> = {[key in keyof T]: (...args) => T[key]};
