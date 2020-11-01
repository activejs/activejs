import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'filterOptions',
})
export class FilterFalsyOptionsPipe implements PipeTransform {
  transform(event: {options: any} | any, indent: number = 3): any {
    if (event) {
      event.options = {...event.options};
    }
    Object.entries(event.options).forEach(([key, val]) => {
      if (val == null || val === false) {
        delete event.options[key];
      }
    });
    return event;
  }
}
