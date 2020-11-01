import {Component, HostBinding, ViewEncapsulation} from '@angular/core';
import {BoolUnit} from '@activejs/core';
import {NavigationEnd, Router} from '@angular/router';

@Component({
  selector: 'ajs-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent {
  readonly darkModeUnit = new BoolUnit({
    id: 'darkMode',
    persistent: true,
    initialValue: window?.matchMedia('(prefers-color-scheme: dark)').matches,
  });
  @HostBinding('class.sidebar-active') sidebarActive = false;

  constructor(private router: Router) {
    this.darkModeUnit.subscribe(onOrOff => {
      this.toggleDarkModeTheme(onOrOff);
    });
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.toggleSidebar(false);
      }
    });
  }

  toggleSidebar(state = !this.sidebarActive) {
    this.sidebarActive = state;
  }

  toggleDarkMode(): void {
    this.darkModeUnit.dispatch(value => !value);
  }

  toggleDarkModeTheme(turnOn: boolean): void {
    if (turnOn) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }
}
