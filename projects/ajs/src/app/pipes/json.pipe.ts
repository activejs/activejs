import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'safeJson',
})
export class JsonPipe implements PipeTransform {
  transform(value: any, indent: number = 3): any {
    try {
      if (value == null || value === Infinity || (typeof value === 'number' && isNaN(NaN))) {
        return String(value);
      }
      return JSON.stringify(value, null, indent);
    } catch (e) {
      return value;
    }
  }
}
