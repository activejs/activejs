import {Observable} from 'rxjs';
import {tap} from 'rxjs/operators';
import {ClusterConfig, ClusterStreamObservableProducer} from '../models/cluster';
import {EventReplay} from '../models/events';
import {Cluster} from '../lib/cluster';
import {Stream} from '../lib/stream';
import {Base} from '../lib/abstract-base';
import {Configuration} from '../lib/configuration';
import {AsyncSystem} from '../lib/async-system';
import {UnitBase} from '../lib/abstract-unit-base';
import {Action} from '../lib/action';
import {
  randomClusterItems,
  randomConfig,
  randomKeys,
  randomUnit,
  randomValidValue,
  randomValue,
  selectRandom,
  times,
} from './utils';
import {IteratorSymbol} from '../utils/funcs';
import createSpy = jasmine.createSpy;

const configOptions: Array<keyof ClusterConfig> = [
  // 'id', // tests with id  are done separately to keep other tests simple
  'replay',
];

describe(
  'Cluster',
  times(20, () => {
    beforeAll(() => {
      Configuration.reset();
    });

    let clusterConfig: ClusterConfig;
    let cluster: Cluster;

    describe('Configuration', () => {
      describe('Inheriting from Global Configuration', () => {
        beforeEach(() => {
          Configuration.reset();
        });

        it('should extend Base', () => {
          cluster = new Cluster({aUnit: randomUnit()});
          expect(cluster).toBeInstanceOf(Base);
        });

        it('should inherit', () => {
          Configuration.set({CLUSTER: {replay: false}});

          cluster = new Cluster({aUnit: randomUnit()});

          expect(cluster.config.replay).toBe(false);
        });

        it('should not inherit after instantiation', () => {
          cluster = new Cluster({aUnit: randomUnit()});

          Configuration.set({CLUSTER: {replay: false}});

          expect(cluster.config.replay).toBe(undefined);
        });

        it('should prioritize inline config over global config', () => {
          Configuration.set({CLUSTER: {replay: false}});

          cluster = new Cluster({aUnit: randomUnit()}, {replay: true});

          expect(cluster.config.replay).toBe(true);
        });
      });

      describe('Different Configurations', () => {
        beforeEach(() => {
          Configuration.reset();
          clusterConfig = randomConfig(configOptions);
          cluster = new Cluster({aUnit: randomUnit()}, clusterConfig);
        });

        it('should have events', () => {
          expect(cluster.events$).toBeInstanceOf(Observable);
        });

        it('should respect replay-nes', () => {
          const callBackSpy = createSpy();
          cluster.subscribe(callBackSpy);

          if (cluster.config.replay === false) {
            expect(callBackSpy).not.toHaveBeenCalled();
          } else {
            expect(callBackSpy).toHaveBeenCalledWith(cluster.value());
          }
        });

        it('should expect at least one valid item', () => {
          const err = items =>
            `No ActiveJS construct provided; expected at least one Unit, System, Action or Cluster; got ${String(
              items
            )}`;

          const randVal = randomValue();
          expect(() => new Cluster(randVal)).toThrowError(err(randVal));

          expect(() => new Cluster({unit: randomUnit(), ...randVal})).not.toThrowError();
        });
      });
    });

    describe('More Tests', () => {
      beforeEach(() => {
        Configuration.reset();
        clusterConfig = randomConfig(configOptions);
        cluster = new Cluster(randomClusterItems(), clusterConfig);
      });

      it('should be observable', () => {
        expect(cluster).toBeInstanceOf(Observable);
        expect(cluster.asObservable()).toBeInstanceOf(Observable);
        expect((cluster.asObservable() as any).source).toBe((cluster as any).source);
      });

      it('should replay', () => {
        const callBackSpy = createSpy();
        cluster.subscribe(callBackSpy);
        let event;
        cluster.events$.subscribe(e => (event = e));

        cluster.replay();

        expect(callBackSpy).toHaveBeenCalledWith(cluster.value());
        expect(event).toBeInstanceOf(EventReplay);
        expect(event).toEqual(new EventReplay(cluster.value()));
      });

      it('should createStream', () => {
        const operatorSpy = createSpy('operatorSpy');

        const observableProducer = createSpy<ClusterStreamObservableProducer<any>>(
          'observableProducer'
        ).and.callFake(sourceCluster => {
          return sourceCluster.pipe(tap(v => operatorSpy(v)));
        });

        const stream = cluster.createStream(observableProducer);

        expect(stream).toBeInstanceOf(Stream);
        expect(observableProducer).toHaveBeenCalledWith(cluster);

        if (cluster.config.replay === false) {
          expect(operatorSpy).not.toHaveBeenCalled();
        } else {
          expect(operatorSpy).toHaveBeenCalledWith(cluster.value());
        }

        operatorSpy.calls.reset();

        const [randomItemKey, randomItemInstance] = selectRandom(Object.entries(cluster.items));
        const {emitCount} = cluster;
        let didDispatch: boolean;

        switch (true) {
          case randomItemInstance instanceof UnitBase:
            didDispatch = randomItemInstance.dispatch(randomValidValue(randomItemInstance), {
              force: true,
            });
            break;
          case randomItemInstance instanceof AsyncSystem:
            didDispatch = randomItemInstance.queryUnit.dispatch(randomValue(1), {force: true});
            break;
          case randomItemInstance instanceof Action:
            didDispatch = true;
            randomItemInstance.dispatch(randomValue(1));
        }

        if (didDispatch) {
          expect(operatorSpy).toHaveBeenCalledWith(cluster.value());
          expect(cluster.value()[randomItemKey]).toEqual(randomItemInstance.value());
          expect(cluster.emitCount).toBe(emitCount + 1);
        }
      });

      it('should be iterable', () => {
        expect(typeof cluster[IteratorSymbol]).toBe('function');
        expect(typeof cluster[IteratorSymbol]().next).toBe('function');
        expect([...cluster]).toEqual(Object.entries(cluster.items));
      });

      it('checks "forEvery" method', () => {
        const callbackSpy = jasmine.createSpy();
        const objectEntries = Object.entries(cluster.items);

        cluster.forEvery((val, key, index, entries) => {
          callbackSpy();
          expect(val).toEqual(cluster.items[key as any]);
          expect(objectEntries[index]).toEqual(entries[index] as any);
          expect(objectEntries[index]).toEqual([key as any, val]);
        });

        expect(callbackSpy).toHaveBeenCalledTimes(cluster.itemsCount);
      });

      it('checks "select" method', () => {
        const randItemKey = selectRandom(randomKeys().concat(Object.keys(cluster.items)));
        expect(cluster.select(randItemKey)).toBe(cluster.items[randItemKey]);
      });
    });
  })
);
