import {Component, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {Title} from '@angular/platform-browser';

@Component({
  selector: 'ajs-playground',
  templateUrl: './playground.component.html',
  styleUrls: ['./playground.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class PlaygroundComponent implements OnInit, OnDestroy {
  constructor(private titleService: Title) {}

  ngOnInit(): void {
    this.titleService.setTitle('ActiveJS - Playground');
  }

  ngOnDestroy(): void {
    console.clear();
  }
}
