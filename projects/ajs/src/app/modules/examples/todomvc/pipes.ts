import {Pipe, PipeTransform} from '@angular/core';
import {Todo} from './modals';

@Pipe({
  name: 'todoFilter',
})
export class TodoFilter implements PipeTransform {
  transform(value: Todo[], completionStatus?: boolean): Todo[] {
    return typeof completionStatus === 'boolean'
      ? value.filter(todo => todo.completed === completionStatus)
      : value;
  }
}
