import {UnitConfig} from '../models/units';
import {clearPersistentStorage, KeyPrefix, retrieve} from '../lib/persistence';
import {Configuration} from '../lib/configuration';
import {UnitBase} from '../lib/abstract-unit-base';
import {EventUnitClearPersistedValue} from '../models/events';
import {
  differentValue,
  MockStorage,
  randomBoolean,
  randomString,
  randomUnitCtor,
  randomValidValue,
  randomValue,
  selectRandom,
  somewhatValidConfig,
  times,
} from './utils';

const configOptions: Array<keyof UnitConfig<any>> = [
  'id',
  'replay',
  'persistent',
  'initialValue',
  'cacheSize',
  'distinctDispatchCheck',
  'customDispatchCheck',
  'dispatchDebounce',
  'dispatchDebounceMode',
];

const testUnitPersistence = (unit: UnitBase<any>, storage = Configuration.storage) => {
  const persistedValueInStorage = storage.getItem(KeyPrefix + unit.config.id);

  if (unit.config.persistent === true) {
    expect(persistedValueInStorage).toBe(JSON.stringify({value: unit.value()}));
  } else {
    expect().nothing();
  }
};

describe(
  'Persistence',
  times(30, () => {
    beforeAll(() => {
      Configuration.reset();
    });

    let unitCtor: new (config?: UnitConfig<any>) => UnitBase<any>;
    let unitConfig: UnitConfig<any>;
    let unit: UnitBase<any>;

    const createUnit = (configOverride?: UnitConfig<any>): UnitBase<any> => {
      unitConfig = somewhatValidConfig(configOptions, unitCtor, 1);
      unitConfig.id = randomString();
      Object.assign(unitConfig, configOverride);
      return (unit = new unitCtor(unitConfig));
    };
    const mockStorage = new MockStorage();

    beforeEach(() => {
      sessionStorage.clear();
      localStorage.clear();
      mockStorage.clear();
      Configuration.reset();
      unitCtor = randomUnitCtor();
    });

    it('checks storage key-prefix', () => {
      expect(KeyPrefix).toBe('_AJS_UNIT_');
    });

    it('should throw if no id provided', () => {
      expect(() => createUnit({id: undefined, persistent: true})).toThrowError(TypeError);
      expect(() => createUnit({id: undefined, persistent: true})).toThrowError(
        'An id is required for persistence to work.'
      );
    });

    it('should use localStorage by default', () => {
      createUnit();

      expect(Configuration.storage).toBe(localStorage);
      testUnitPersistence(unit, localStorage);
    });

    it('should be able to override global storage', () => {
      const storage = randomBoolean() ? sessionStorage : mockStorage;
      Configuration.set({storage});
      createUnit();

      expect(Configuration.storage).toBe(storage);
      testUnitPersistence(unit, storage);
    });

    it('should be able to override specific Units storage', () => {
      const storage = randomBoolean() ? sessionStorage : mockStorage;
      createUnit({storage});

      expect(Configuration.storage).not.toBe(storage);
      expect(unit.config.storage).toBe(storage);
      testUnitPersistence(unit, storage);
    });

    it('should store new values in storage', () => {
      createUnit({persistent: true});

      unit.dispatch(randomValidValue(unit));
      testUnitPersistence(unit);

      unit.dispatch(randomValidValue(unit));
      testUnitPersistence(unit);

      unit.dispatch(randomValidValue(unit));
      testUnitPersistence(unit);
    });

    it('should restore from storage', () => {
      createUnit({persistent: true});

      // recreate the same kind of Unit again, to simulate window refresh
      createUnit({id: unitConfig.id}); // use the same id
      testUnitPersistence(unit);

      // test again
      createUnit({id: unitConfig.id}); // use the same id
      testUnitPersistence(unit);
    });

    it('should not restore from storage', () => {
      createUnit({persistent: true});

      // recreate the same kind of Unit again, to simulate window refresh
      createUnit({
        id: unitConfig.id, // use the same id
        persistent: false,
        initialValue: differentValue(unit.value()),
      });

      expect(Configuration.storage.getItem(KeyPrefix + unit.config.id)).not.toBe(
        JSON.stringify({value: unit.value()})
      );
    });

    it('checks "clearPersistedValue"', () => {
      const storage = selectRandom([localStorage, sessionStorage, mockStorage]);
      Configuration.set({storage});
      const persistent = randomBoolean(0.5) ? randomBoolean() : randomValue(1);
      createUnit({persistent});

      let event;
      const subscribedToEvents = randomBoolean();
      if (subscribedToEvents) {
        // helps cover the else branch
        unit.events$.subscribe(e => (event = e));
      }

      expect(unit.clearPersistedValue()).toBe(persistent === true);
      expect(storage.getItem(KeyPrefix + unit.config.id)).toBe(null);

      if (subscribedToEvents && persistent === true) {
        expect(event).toBeInstanceOf(EventUnitClearPersistedValue);
      } else {
        expect(event).toBe(undefined);
      }
    });

    it(`should clear all Units' persisted values from a specific storage`, () => {
      const storages = [localStorage, sessionStorage, mockStorage];

      if (randomBoolean()) {
        Configuration.set({storage: selectRandom(storages)});
      }

      const a = createUnit({persistent: true});
      const b = createUnit({persistent: true});
      const c = createUnit({persistent: true, storage: storages[0]});
      const d = createUnit({persistent: true, storage: storages[1]});
      const e = createUnit({persistent: true, storage: storages[2]});
      const allUnits = [a, b, c, d, e];

      const storageToClear = randomBoolean(0.5) ? selectRandom(storages) : undefined;
      const effectiveStorageToClear = storageToClear || Configuration.storage;

      const randItem = {key: randomString(), val: randomString()};
      effectiveStorageToClear.setItem(randItem.key, randItem.val);

      clearPersistentStorage(storageToClear);

      expect(effectiveStorageToClear.getItem(randItem.key)).toBe(randItem.val);

      allUnits.forEach(u => {
        unit = u;
        const unitsStorage = unit.config.storage || Configuration.storage;
        const unitsPersistedValue = unitsStorage.getItem(KeyPrefix + unit.config.id);

        if (unitsStorage === effectiveStorageToClear) {
          expect(unitsPersistedValue).toBe(null);
        } else {
          expect(unitsPersistedValue).toBe(JSON.stringify({value: unit.value()}));
        }
      });
    });

    it('should return null if restore from storage failed', () => {
      createUnit({persistent: true});
      const storage = Configuration.storage;
      const storageKey = KeyPrefix + unit.config.id;

      // pollute/invalidate the stored value
      storage.setItem(storageKey, storage.getItem(storageKey) + ' ' + randomValue(1));

      expect(retrieve(storageKey)).toBe(null);
    });
  })
);
