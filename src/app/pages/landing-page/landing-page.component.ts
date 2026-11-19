import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GITHUB_URL } from '../../shared/layout/marketing-nav.component';
import { QlIconComponent } from '../../shared/ui/ql-icon/ql-icon.component';
import { StagesComponent } from './stages.component';
import { HeroDemoComponent } from './hero-demo.component';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [RouterLink, QlIconComponent, HeroDemoComponent, StagesComponent],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPageComponent {
  protected readonly githubUrl = GITHUB_URL;

  protected readonly builtWith = [
    {
      title: 'Angular 20 and Signals',
      body: 'Standalone components with OnPush change detection; every derived value is a computed signal.',
    },
    {
      title: 'One store for query state',
      body: 'An @ngrx/signals store holds the filter tree, results and transformation, so the builder, JSON and URL stay in step.',
    },
    {
      title: 'A Web Worker for big data',
      body: 'Datasets over 5,000 rows are filtered off the main thread so typing and scrolling never stall.',
    },
    {
      title: 'CDK virtual scroll',
      body: 'The results table renders only the visible rows, whatever the size of the result.',
    },
  ];
}
