import {ListUnit} from '@activejs/core';
import {Todo} from './modals';

export class TodoService {
  readonly todosUnit = new ListUnit<Todo>({
    id: 'todoMVC',
    persistent: true,
    immutable: true,
    cacheSize: Infinity,
  });
  remaining = 0;
  completed = 0;

  get allCompleted() {
    return this.todosUnit.length === this.completed;
  }

  constructor() {
    this.todosUnit.subscribe(() => {
      this.completed = this.todosUnit.findByProp('completed', true).length;
      this.remaining = this.todosUnit.length - this.completed;
    });
  }

  add(title: string) {
    this.todosUnit.push(new Todo(title));
  }

  remove(id: string) {
    const [index] = this.todosUnit.findByProp('id', id)[0];
    this.todosUnit.remove(index);
  }

  update(id: string, newTitle: string) {
    const [index, todo] = this.todosUnit.findByProp('id', id)[0];
    todo.title = newTitle.trim();

    if (todo.title) {
      this.todosUnit.set(index, todo);
    } else {
      this.todosUnit.remove(index);
    }
  }

  setAllTo(completed: boolean) {
    this.todosUnit.dispatch(todos => {
      todos.forEach(todo => (todo.completed = completed));
      return todos;
    });
  }

  removeCompleted() {
    this.todosUnit.removeIf(todo => todo.completed);
  }

  toggleCompletion(id: string) {
    const [index, todo] = this.todosUnit.findByProp('id', id)[0];
    todo.completed = !todo.completed;
    this.todosUnit.set(index, todo);
  }
}
