import {AfterViewInit, Directive, ElementRef, HostBinding, Input} from '@angular/core';

/**
 * based on https://css-tricks.com/using-css-transitions-auto-dimensions
 */
@Directive({
  selector: '[ajsAccordion]',
})
export class AccordionDirective implements AfterViewInit {
  @HostBinding('class.accordion') accordionClass = true;

  @Input() animate: boolean = null;

  @Input()
  set ajsAccordion(collapse: boolean) {
    if (collapse === null || !this.elRef) {
      return;
    }

    const el = this.elRef.nativeElement;
    if (collapse) {
      AccordionDirective.collapseSection(el, this.animate);
    } else {
      AccordionDirective.expandSection(el, this.animate);
    }
  }

  constructor(private elRef: ElementRef) {}

  ngAfterViewInit(): void {
    this.animate = this.animate ?? true;
  }

  static collapseSection(element, animate = true) {
    const collapse = () => {
      element.style.height = 0;
      element.style.overflow = 'hidden';
    };

    if (!animate) {
      element.style.transition = 'none';
      collapse();
      return;
    }

    const sectionHeight = element.scrollHeight;
    element.style.transition = '';

    requestAnimationFrame(() => {
      element.style.height = sectionHeight + 'px';

      requestAnimationFrame(collapse);
    });
  }

  static expandSection(element, animate = true) {
    const expand = () => {
      element.style.height = null;
      element.style.overflow = '';
    };

    if (!animate) {
      element.style.transition = 'none';
      expand();
      return;
    }

    requestAnimationFrame(() => {
      const sectionHeight = element.scrollHeight;
      if (!sectionHeight) {
        return;
      }

      element.style.height = 0;
      element.style.transition = '';

      requestAnimationFrame(() => {
        element.style.height = sectionHeight + 'px';

        const onTransitionEnd = () => {
          element.removeEventListener('transitionend', onTransitionEnd);
          expand();
        };

        element.addEventListener('transitionend', onTransitionEnd);
      });
    });
  }
}
