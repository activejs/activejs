import {uuid} from './utils';

export class Todo {
  id: string;
  completed: boolean;

  constructor(public title: string) {
    this.title = title.trim();
    this.completed = false;
    this.id = uuid();
  }
}
