import {Component, ElementRef, ViewChild, ViewEncapsulation} from '@angular/core';
import {TodoService} from './todo.service';

@Component({
  selector: 'ajs-todomvc',
  templateUrl: 'todo.component.html',
  styleUrls: ['todo.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class TodoComponent {
  @ViewChild('editedTodo') editedTodo: ElementRef<HTMLInputElement>;

  newTodoText = '';
  editingTodoId: string;
  showWithCompletionStatus: boolean;

  constructor(public todoStore: TodoService) {}

  addTodo() {
    if (this.newTodoText.trim().length) {
      this.todoStore.add(this.newTodoText);
      this.newTodoText = '';
    }
  }

  updateTodo(id: string, newTitle: string) {
    this.todoStore.update(id, newTitle);
    this.stopEditing();
  }

  startEditing(id: string) {
    this.editingTodoId = id;

    setTimeout(() => {
      this.editedTodo.nativeElement.focus();
    });
  }

  stopEditing() {
    this.editingTodoId = null;
  }
}
