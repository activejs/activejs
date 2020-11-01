import {isFunction, IteratorSymbol} from '../utils/funcs';
import {StringUnit} from '../lib/string-unit';
import {randomValidValue, randomValue, times} from './utils';
import {Configuration} from '../lib/configuration';

describe(
  'StringUnit',
  times(30, () => {
    beforeAll(() => {
      Configuration.reset();
    });

    describe('basic tests', () => {
      let unit: StringUnit;

      beforeEach(() => {
        unit = new StringUnit({initialValue: randomValue()});
      });

      it('should only allow Strings', () => {
        const randValue = randomValue(1);
        const originalUnitValue = unit.value();
        unit.dispatch(randValue);

        if (typeof randValue === 'string') {
          expect(unit.value()).toBe(randValue);
        } else {
          expect(unit.value()).toBe(originalUnitValue);
        }
        expect(unit.length).toBe(unit.value().length);
      });

      it('should be iterable', () => {
        expect(typeof unit[IteratorSymbol]).toBe('function');
        expect(typeof unit[IteratorSymbol]().next).toBe('function');
        expect([...unit]).toEqual([...unit.value()]);
      });

      it('should have String.prototype methods', () => {
        unit.dispatch(randomValidValue(StringUnit));

        Object.getOwnPropertyNames(String.prototype).forEach(method => {
          if (method !== 'constructor' && isFunction(String.prototype[method])) {
            expect(unit[method]()).toEqual(unit.value()[method]());
          } else {
            expect().nothing();
          }
        });
        expect(unit.length).toBe(unit.value().length);
      });
    });
  })
);
