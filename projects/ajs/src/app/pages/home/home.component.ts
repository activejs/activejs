import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {Title} from '@angular/platform-browser';

@Component({
  selector: 'ajs-home-page',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class HomeComponent implements OnInit {
  npmInstallCmd = 'npm i @activejs/core';
  showClipboard: boolean;
  showClipboardTimeout: number;

  constructor(private titleService: Title) {}

  ngOnInit(): void {
    this.titleService.setTitle('ActiveJS');
  }

  async copyToClipboard(el: HTMLElement) {
    const range = document.createRange();
    range.selectNode(el);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);

    await navigator.clipboard.writeText(this.npmInstallCmd);

    this.showClipboard = true;
    window.clearTimeout(this.showClipboardTimeout);
    this.showClipboardTimeout = window.setTimeout(() => {
      this.showClipboard = false;
    }, 1000);
  }
}
