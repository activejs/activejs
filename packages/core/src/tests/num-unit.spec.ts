import {isNumber} from '../utils/funcs';
import {NumUnit} from '../lib/num-unit';
import {
  randomBoolean,
  randomNumber,
  randomValidValue,
  randomValue,
  selectRandom,
  times,
} from './utils';
import {Configuration} from '../lib/configuration';

describe(
  'NumUnit',
  times(20, () => {
    beforeAll(() => {
      Configuration.reset();
    });

    describe('basic tests', () => {
      let unit: NumUnit;

      beforeEach(() => {
        unit = new NumUnit();
      });

      it('should only allow numbers', () => {
        const randValue = randomBoolean(0.8) ? randomValue(1) : NaN;
        const originalUnitValue = unit.value();
        unit.dispatch(randValue, {force: randomBoolean()});

        if (isNumber(randValue)) {
          expect(unit.value()).toBe(randValue);
        } else {
          expect(unit.value()).toBe(originalUnitValue);
        }
      });

      describe('should have Number.prototype methods', () => {
        beforeEach(() => {
          if (randomBoolean()) {
            unit.dispatch(randomValidValue(NumUnit));
          }
        });

        it('should have Number.prototype.toString', () => {
          const radix = randomNumber(2, 36);
          expect(unit.toString(radix)).toEqual(unit.value().toString(radix));
        });

        it('should have Number.prototype.toPrecision', () => {
          const precision = randomNumber(1, 100);
          expect(unit.toPrecision(precision)).toEqual(unit.value().toPrecision(precision));
        });

        it('should have Number.prototype.toExponential', () => {
          const fractionDigits = randomNumber(0, 100);
          expect(unit.toExponential(fractionDigits)).toEqual(
            unit.value().toExponential(fractionDigits)
          );
        });

        it('should have Number.prototype.toFixed', () => {
          const fractionDigits = randomNumber(0, 100);
          expect(unit.toFixed(fractionDigits)).toEqual(unit.value().toFixed(fractionDigits));
        });

        it('should have Number.prototype.toLocaleString', () => {
          const locale = selectRandom(['de-DE', 'ja-JP', 'en-IN', 'en-GB', 'en-US']);
          const options = randomBoolean()
            ? undefined
            : {style: 'currency', currency: selectRandom(['INR', 'USD', 'EUR', 'JPY'])};

          expect(unit.toLocaleString(locale, options)).toEqual(
            unit.value().toLocaleString(locale, options)
          );
        });
      });
    });
  })
);
