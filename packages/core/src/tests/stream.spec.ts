import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {tap} from 'rxjs/operators';
import {Stream} from '../lib/stream';
import {randomBoolean, randomValue, times} from './utils';
import {Configuration} from '../lib/configuration';
import createSpy = jasmine.createSpy;
import Spy = jasmine.Spy;

describe(
  'Stream',
  times(20, () => {
    beforeAll(() => {
      Configuration.reset();
    });

    it('should throw if Observable not provided', () => {
      const randVal = randomValue(1);
      expect(() => new Stream(randVal)).toThrowError(TypeError);
      expect(() => new Stream(randVal)).toThrowError('Expected an Observable, got ' + randVal);
    });

    describe('more tests', () => {
      const firstValue = randomValue(1);
      let spyOperator: Spy;
      let subject: BehaviorSubject<any>;
      let observable$: Observable<any>;
      let stream: Stream;

      beforeEach(() => {
        spyOperator = createSpy('spyOperator');

        subject = new BehaviorSubject(firstValue);
        observable$ = subject.pipe(tap(spyOperator));
        stream = new Stream(observable$);
      });

      it('should subscribe immediately', () => {
        expect(spyOperator).toHaveBeenCalledWith(firstValue);
        expect(stream.subscription).toBeInstanceOf(Subscription);
        expect(stream.isSubscribed).toBe(true);
      });

      it('should unsubscribe', () => {
        spyOperator.calls.reset();

        if (randomBoolean()) {
          stream.unsubscribe(); // manual unsubscribe
        } else {
          subject.error('err'); // automatic unsubscribe
        }

        if (randomBoolean()) {
          subject.next(randomValue(1));
        }

        expect(spyOperator).not.toHaveBeenCalled();
        expect(stream.subscription).toBe(undefined);
        expect(stream.isSubscribed).toBe(false);

        stream.unsubscribe(); // subsequent unsubscribe shouldn't fail
      });

      it('should resubscribe', () => {
        spyOperator.calls.reset();
        stream.resubscribe();

        expect(spyOperator).toHaveBeenCalledWith(firstValue);
        expect(stream.subscription).toBeInstanceOf(Subscription);
        expect(stream.isSubscribed).toBe(true);
      });
    });
  })
);
