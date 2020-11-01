import {Directive, ElementRef, Input, OnChanges, SimpleChanges} from '@angular/core';

@Directive({
  selector: '[ajsRunClass]',
})
export class RunClassDirective implements OnChanges {
  @Input() ajsRunClass: string;
  @Input() ajsRunClassOnChange: any;
  classTimeoutRef;

  constructor(private hostElement: ElementRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.ajsRunClassOnChange) {
      this.toggleClass(false);

      clearTimeout(this.classTimeoutRef);
      this.classTimeoutRef = setTimeout(() => {
        this.toggleClass(true);
      }, 10);
    }
  }

  toggleClass(add: boolean) {
    if (this.hostElement && this.hostElement.nativeElement) {
      if (add) {
        this.hostElement.nativeElement.classList.add(this.ajsRunClass);
      } else {
        this.hostElement.nativeElement.classList.remove(this.ajsRunClass);
      }
    }
  }
}
