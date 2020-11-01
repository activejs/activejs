import {GenericUnit} from './generic-unit';
import {BoolUnit} from './bool-unit';
import {NumUnit} from './num-unit';
import {StringUnit} from './string-unit';
import {ListUnit} from './list-unit';
import {DictUnit} from './dict-unit';
import {isDict} from '../utils/funcs';
import {UnitConfig, ValueToUnitType} from '../models';

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
