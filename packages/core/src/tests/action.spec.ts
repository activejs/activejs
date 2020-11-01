import {Observable} from 'rxjs';
import {tap} from 'rxjs/operators';
import {ActionConfig, ActionStreamObservableProducer} from '../models/action';
import {EventReplay} from '../models/events';
import {Action} from '../lib/action';
import {Stream} from '../lib/stream';
import {Base} from '../lib/abstract-base';
import {Configuration} from '../lib/configuration';
import {randomBoolean, randomConfig, randomFn, randomValue, times} from './utils';
import createSpy = jasmine.createSpy;

const configOptions: Array<keyof ActionConfig<any>> = [
  // 'id', // tests with id  are done separately to keep other tests simple
  'replay',
  'initialValue',
];

describe(
  'Action',
  times(20, () => {
    beforeAll(() => {
      Configuration.reset();
    });

    let actionConfig: ActionConfig<any>;
    let action: Action<any>;

    describe('Configuration', () => {
      describe('Inheriting from Global Configuration', () => {
        beforeEach(() => {
          Configuration.reset();
        });

        it('should extend Base', () => {
          action = new Action();
          expect(action).toBeInstanceOf(Base);
        });

        it('should inherit', () => {
          Configuration.set({ACTION: {replay: true}});

          action = new Action();

          expect(action.config.replay).toBe(true);
        });

        it('should not inherit after instantiation', () => {
          action = new Action();

          Configuration.set({ACTION: {replay: true}});

          expect(action.config.replay).toBe(false);
        });

        it('should prioritize inline config over global config', () => {
          Configuration.set({ACTION: {replay: false}});

          action = new Action({replay: true});

          expect(action.config.replay).toBe(true);
        });
      });

      describe('Different Configurations', () => {
        beforeEach(() => {
          Configuration.reset();
          actionConfig = randomConfig(configOptions);
          action = new Action(actionConfig);
        });

        it('should have events', () => {
          expect(action.events$).toBeInstanceOf(Observable);
        });

        it('should respect initialValue', () => {
          expect(action.config.initialValue).toEqual(actionConfig.initialValue);
          expect(action.value()).toEqual(actionConfig.initialValue);
        });

        it('should respect replay-nes', () => {
          const callBackSpy = createSpy();
          action.subscribe(callBackSpy);

          if (action.config.replay === false) {
            expect(callBackSpy).not.toHaveBeenCalled();
          } else {
            expect(callBackSpy).toHaveBeenCalledWith(action.value());
          }
        });
      });
    });

    describe('More Tests', () => {
      beforeEach(() => {
        Configuration.reset();
        actionConfig = randomConfig(configOptions);
        action = new Action(actionConfig);
      });

      it('should be observable', () => {
        expect(action).toBeInstanceOf(Observable);
        expect(action.asObservable()).toBeInstanceOf(Observable);
        expect((action.asObservable() as any).source).toBe((action as any).source);
      });

      it('should replay', () => {
        const callBackSpy = createSpy();
        action.subscribe(callBackSpy);
        let event;
        action.events$.subscribe(e => (event = e));

        action.replay();

        expect(callBackSpy).toHaveBeenCalledWith(action.value());
        expect(event).toBeInstanceOf(EventReplay);
        expect(event).toEqual(new EventReplay(action.value()));
      });

      it('should dispatch', () => {
        if (randomBoolean()) {
          const randVal = randomValue(1);
          action.dispatch(randVal);
          expect(action.value()).toEqual(randVal);
        } else {
          const randValFn = randomFn(1);
          action.dispatch(randValFn);
          expect(action.value()).toEqual(randValFn());
        }
      });

      it('should createStream', () => {
        const operatorSpy = createSpy('operatorSpy');

        const observableProducer = createSpy<ActionStreamObservableProducer<any>>(
          'observableProducer'
        ).and.callFake(sourceUnit => {
          return sourceUnit.pipe(tap(v => operatorSpy(v)));
        });

        const stream = action.createStream(observableProducer);

        expect(stream).toBeInstanceOf(Stream);
        expect(observableProducer).toHaveBeenCalledWith(action);

        if (action.config.replay === false) {
          expect(operatorSpy).not.toHaveBeenCalled();
        } else {
          expect(operatorSpy).toHaveBeenCalledWith(action.value());
        }

        operatorSpy.calls.reset();

        action.dispatch(randomValue(1));
        expect(operatorSpy).toHaveBeenCalledWith(action.value());
      });
    });
  })
);
