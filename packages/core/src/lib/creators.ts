import {GenericUnit} from './generic-unit';
import {BoolUnit} from './bool-unit';
import {NumUnit} from './num-unit';
import {StringUnit} from './string-unit';
import {ListUnit} from './list-unit';
import {DictUnit} from './dict-unit';
import {isDict} from '../utils/funcs';
import {UnitConfig, ValueToUnitType} from '../models';

/**
 * @hidden
 * @experimental Meaning, It can disappear in the next version.
 *
 * An experimental short-hand function for Unit creation.
 * It automatically chooses an appropriate type of Unit depending on the
 * provided `initialValue`.
 *
 * For a `boolean` value, {@link BoolUnit} will be selected. \
 * For a `number` value, {@link NumUnit} will be selected. \
 * For a `string` value, {@link StringUnit} will be selected. \
 * For an `array` value, {@link ListUnit} will be selected. \
 * For a simple `dictionary object`, a {@link DictUnit} will be selected. \
 * For every other value, {@link GenericUnit} will be selected. \
 *
 * @param initialValue Initial value of the Unit.
 * @param config The configuration for the automatically selected Unit.
 */
export function createUnit<T>(
  initialValue: T,
  config?: Exclude<UnitConfig<T>, 'initialValue'>
): ValueToUnitType<T> {
  const unitConfig: UnitConfig<T> = {...config, initialValue};
  const typeOfValue = typeof initialValue;

  switch (true) {
    case initialValue == null:
    default:
      return new GenericUnit(unitConfig as any) as any;
    case typeOfValue === 'boolean':
      return new BoolUnit(unitConfig as any) as any;
    case typeOfValue === 'number':
      return new NumUnit(unitConfig as any) as any;
    case typeOfValue === 'string':
      return new StringUnit(unitConfig as any) as any;
    case Array.isArray(initialValue):
      return new ListUnit(unitConfig as any) as any;
    case isDict(initialValue):
      return new DictUnit(unitConfig as any) as any;
  }
}
