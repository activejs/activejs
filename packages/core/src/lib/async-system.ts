import {Base} from './abstract-base';
import {GenericUnit} from './generic-unit';
import {BoolUnit} from './bool-unit';
import {generateAsyncSystemIds} from '../utils/funcs';
import {AsyncSystemConfig, AsyncSystemValue} from '../models';
import {AsyncSystemBase} from './async-system-base';
import {Configuration} from './configuration';

/**
 * AsyncSystem is a reactive storage System, to store, replay and wait for simple async tasks.
 *
 * An AsyncSystem is a systematic combination of four Units.
 * one each for every aspect of an asynchronous task or API, \
 * e.g.: XHR, fetch or a third party abstraction like Angular's HttpClient.
 *
 * See {@link https://docs.activejs.dev/fundamentals/systems/asyncsystem} for more details.
 *
 * - AsyncSystem extends {@link AsyncSystemBase},
 *   which further extends {@link Base} and `Observable`
 *
 * @category 3. Systems
 */
export class AsyncSystem<Query, Data, Error> extends AsyncSystemBase<
  GenericUnit<Query>,
  GenericUnit<Data>,
  GenericUnit<Error>
> {
  /**
   * Configured options. \
   * Combination of global-options {@link GlobalAsyncSystemConfig} and the options passed on instantiation.
   */
  readonly config: Readonly<AsyncSystemConfig<Query, Data, Error>>;

  constructor(config?: AsyncSystemConfig<Query, Data, Error>) {
    super(
      ...((() => {
        config = {...Configuration.ASYNC_SYSTEM, ...config};
        const {
          id: systemId,
          initialValue,
          QUERY_UNIT,
          DATA_UNIT,
          ERROR_UNIT,
          PENDING_UNIT,
          UNITS,
        }: AsyncSystemConfig<Query, Data, Error> = config;

        const {queryUnitId, dataUnitId, errorUnitId, pendingUnitId} = generateAsyncSystemIds(
          systemId,
          QUERY_UNIT,
          DATA_UNIT,
          ERROR_UNIT,
          PENDING_UNIT
        );

        // no need to check these, as Units ignore undefined as initialValue anyway
        const {query, data, error, pending}: AsyncSystemValue<Query, Data, Error> =
          initialValue || {};

        const queryUnit = new GenericUnit<Query>({
          initialValue: query,
          ...UNITS,
          ...QUERY_UNIT,
          id: queryUnitId,
        });

        const dataUnit = new GenericUnit<Data>({
          initialValue: data,
          ...UNITS,
          ...DATA_UNIT,
          id: dataUnitId,
        });

        const errorUnit = new GenericUnit<Error>({
          initialValue: error,
          ...UNITS,
          ...ERROR_UNIT,
          id: errorUnitId,
        });

        const pendingUnit = new BoolUnit({
          initialValue: pending,
          ...UNITS,
          ...PENDING_UNIT,
          id: pendingUnitId,
        });

        return [queryUnit, dataUnit, errorUnit, pendingUnit, config];
      })() as [
        GenericUnit<Query>,
        GenericUnit<Data>,
        GenericUnit<Error>,
        BoolUnit,
        AsyncSystemConfig<Query, Data, Error>
      ])
    );
  }
}
