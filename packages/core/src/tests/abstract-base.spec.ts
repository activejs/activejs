import {Subject} from 'rxjs';
import {randomValue, times} from './utils';
import {Base} from '../lib/abstract-base';
import {BaseConfig} from '../models/base';
import {EventReplay} from '../models/events';
import {isDict} from '../utils/funcs';
import {Configuration} from '../lib/configuration';

describe(
  'Abstract Base',
  times(10, () => {
    beforeAll(() => {
      Configuration.reset();
    });

    it('tests Base configuration', () => {
      const randVal = randomValue(1);
      class Temp extends Base<any> {
        value(): any {}
        constructor(config: BaseConfig) {
          super(config);
        }
      }
      const temp = new Temp(randVal);

      expect(temp.config).not.toBe(randVal); // either it'll be cloned or not used at all

      if (isDict(randVal)) {
        expect(temp.config).toEqual(randVal);
      } else {
        expect(temp.config).not.toEqual(randVal);
      }
    });

    it('should get events if asked', () => {
      class Temp extends Base<any> {
        value(): any {}
        constructor() {
          super();

          expect(this.eventsSubject).toBe(undefined);
          this.replay();
          expect(this.eventsSubject).toBe(undefined);

          let event;
          this.events$.subscribe(e => (event = e));
          this.replay();
          expect(event).toBeInstanceOf(EventReplay);
          expect(this.eventsSubject).toBeInstanceOf(Subject);
        }
      }
      const temp = new Temp();
    });
  })
);
