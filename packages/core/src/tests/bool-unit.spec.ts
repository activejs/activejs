import {BoolUnit} from '../lib/bool-unit';
import {randomValue, times} from './utils';
import {Configuration} from '../lib/configuration';

describe(
  'BoolUnit',
  times(30, () => {
    beforeAll(() => {
      Configuration.reset();
    });

    let unit: BoolUnit;

    beforeEach(() => {
      unit = new BoolUnit();
    });

    it('should only allow booleans', () => {
      const randValue = randomValue(1);
      const originalUnitValue = unit.value();
      unit.dispatch(randValue);

      if (typeof randValue === 'boolean') {
        expect(unit.value()).toBe(randValue);
      } else {
        expect(unit.value()).toBe(originalUnitValue);
      }
    });
  })
);
