import {Observable} from 'rxjs';
import {distinctUntilChanged, map} from 'rxjs/operators';
import {UnitBase} from './abstract-unit-base';
import {KOf} from '../models';
import {plucker} from '../utils/funcs';

export class Selection<T, U extends UnitBase<any> = UnitBase<any>, K extends KOf<T> = KOf<T>> {
  constructor(private unit: U, private path: (string | number)[]) {}

  value(): T | undefined {
    const valAtPath = plucker(this.unit.rawValue(), this.path);
    return (this.unit as any).deepCopyMaybe(valAtPath);
  }

  asObservable(): Observable<T | undefined> {
    if (this.unit.config.immutable === true) {
      // allows to optimize cases when the whole value is not new,
      // e.g.: updating property 'a' in a DictUnit using 'set',
      // wouldn't trigger paths that start with property 'b'
      return this.unit.pipe(
        map(() => plucker(this.unit.rawValue(), this.path)),
        distinctUntilChanged(),
        map(() => plucker((this.unit as any).emittedValue, this.path))
      );
    }

    return this.unit.pipe(
      map(value => plucker(value, this.path)),
      distinctUntilChanged()
    );
  }
}
