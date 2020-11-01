import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'emptySpaceInArrayViz',
})
export class EmptySpaceInArrayVizPipe implements PipeTransform {
  transform(value: any): any {
    return Array.isArray(value) ? this.visualizeEmptySpacesInArray(value) : value;
  }

  visualizeEmptySpacesInArray(a) {
    const newA = [];
    let emptyCount = 0;
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < a.length; i++) {
      if (a.hasOwnProperty(i)) {
        if (emptyCount > 0) {
          newA.push(`empty x ${emptyCount} | not actual value | just visualizing empty`);
        }
        newA.push(a[i]);
      } else {
        ++emptyCount;
        if (i === a.length - 1) {
          newA.push(`empty x ${emptyCount} | not actual value | just visualizing empty`);
        }
      }
    }
    return newA;
  }
}
