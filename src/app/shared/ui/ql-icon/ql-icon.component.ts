import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { inject } from '@angular/core';

export type IconName =
  | 'filter'
  | 'transform'
  | 'history'
  | 'compare'
  | 'database'
  | 'settings'
  | 'search'
  | 'play'
  | 'plus'
  | 'x'
  | 'chevron-down'
  | 'chevron-right'
  | 'sun'
  | 'moon'
  | 'link'
  | 'download'
  | 'lock'
  | 'github'
  | 'command'
  | 'info'
  | 'sort-asc'
  | 'sort-desc'
  | 'upload'
  | 'monitor'
  | 'sparkle'
  | 'panel';

/** 16×16 outline paths, 1.5px stroke, drawn with currentColor. */
const PATHS: Record<IconName, string> = {
  filter: '<path d="M2.5 3.5h11l-4.25 5v4l-2.5 1.25V8.5z"/>',
  transform: '<path d="M3 5h7.5M8 2.5 10.5 5 8 7.5M13 11H5.5M8 8.5 5.5 11 8 13.5"/>',
  history: '<path d="M2.75 8a5.25 5.25 0 1 0 1.6-3.77"/><path d="M2.5 2.75v2.5H5"/><path d="M8 5.25V8l1.75 1.25"/>',
  compare: '<path d="M5.5 2.5v11M10.5 2.5v11"/><path d="M2.5 6h3M10.5 10h3"/>',
  database: '<ellipse cx="8" cy="4" rx="5" ry="1.75"/><path d="M3 4v8c0 .97 2.24 1.75 5 1.75s5-.78 5-1.75V4"/><path d="M3 8c0 .97 2.24 1.75 5 1.75S13 8.97 13 8"/>',
  settings: '<circle cx="8" cy="8" r="2"/><path d="M8 1.75v1.5M8 12.75v1.5M14.25 8h-1.5M3.25 8h-1.5M12.42 3.58l-1.06 1.06M4.64 11.36l-1.06 1.06M12.42 12.42l-1.06-1.06M4.64 4.64 3.58 3.58"/>',
  search: '<circle cx="7" cy="7" r="4.25"/><path d="m10.25 10.25 3.25 3.25"/>',
  play: '<path d="M4.5 3v10l8.5-5z"/>',
  plus: '<path d="M8 3v10M3 8h10"/>',
  x: '<path d="m4 4 8 8M12 4l-8 8"/>',
  'chevron-down': '<path d="m4 6 4 4 4-4"/>',
  'chevron-right': '<path d="m6 4 4 4-4 4"/>',
  sun: '<circle cx="8" cy="8" r="3"/><path d="M8 1.5v1.25M8 13.25v1.25M14.5 8h-1.25M2.75 8H1.5M12.6 3.4l-.9.9M4.3 11.7l-.9.9M12.6 12.6l-.9-.9M4.3 4.3l-.9-.9"/>',
  moon: '<path d="M13.25 9.6A5.5 5.5 0 0 1 6.4 2.75a5.5 5.5 0 1 0 6.85 6.85z"/>',
  link: '<path d="M6.75 9.25a2.75 2.75 0 0 0 3.9 0l2-2a2.75 2.75 0 0 0-3.9-3.9l-.6.6"/><path d="M9.25 6.75a2.75 2.75 0 0 0-3.9 0l-2 2a2.75 2.75 0 0 0 3.9 3.9l.6-.6"/>',
  download: '<path d="M8 2.5v8M4.75 7.25 8 10.5l3.25-3.25M3 13.5h10"/>',
  lock: '<rect x="3.25" y="7" width="9.5" height="6.75" rx="1.5"/><path d="M5.25 7V5a2.75 2.75 0 0 1 5.5 0v2"/>',
  github: '<path d="M6 13.25c-2.75.85-2.75-1.4-3.85-1.65M9.85 14.5v-2.1c0-.62.06-.87-.3-1.23 1.7-.19 3.45-.83 3.45-3.73a2.9 2.9 0 0 0-.8-2 2.7 2.7 0 0 0-.05-2s-.64-.2-2.1.78a7.2 7.2 0 0 0-3.8 0C4.8 3.24 4.15 3.44 4.15 3.44a2.7 2.7 0 0 0-.05 2 2.9 2.9 0 0 0-.8 2c0 2.88 1.75 3.53 3.44 3.73-.35.35-.35.7-.3 1.23v2.1"/>',
  command: '<path d="M6 6V4.25A1.75 1.75 0 1 0 4.25 6H6zm0 0h4m-4 0v4m4-4V4.25A1.75 1.75 0 1 1 11.75 6H10zm0 0v4m0 0h1.75A1.75 1.75 0 1 1 10 11.75V10zm0 0H6m0 0v1.75A1.75 1.75 0 1 1 4.25 10H6z"/>',
  info: '<circle cx="8" cy="8" r="5.75"/><path d="M8 7.25v3.5M8 5.25v.01"/>',
  'sort-asc': '<path d="m4.5 6.5 3.5-3.5 3.5 3.5M8 3v10"/>',
  'sort-desc': '<path d="m4.5 9.5 3.5 3.5 3.5-3.5M8 13V3"/>',
  upload: '<path d="M8 10.5v-8M4.75 5.75 8 2.5l3.25 3.25M3 13.5h10"/>',
  monitor: '<rect x="2" y="2.75" width="12" height="8.5" rx="1.5"/><path d="M5.5 13.75h5M8 11.25v2.5"/>',
  sparkle: '<path d="M8 2.5 9.3 6.7 13.5 8l-4.2 1.3L8 13.5 6.7 9.3 2.5 8l4.2-1.3z"/>',
  panel: '<rect x="2.25" y="2.75" width="11.5" height="10.5" rx="1.5"/><path d="M6.25 2.75v10.5"/>',
};

@Component({
  selector: 'ql-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
    style: 'display:inline-flex;flex:none;',
  },
  template: `<svg
    viewBox="0 0 16 16"
    [attr.width]="size()"
    [attr.height]="size()"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    [innerHTML]="svg()"
  ></svg>`,
})
export class QlIconComponent {
  readonly name = input.required<IconName>();
  readonly size = input(16);

  private readonly sanitizer = inject(DomSanitizer);

  // Static, compile-time constant markup from PATHS above, so bypassing the sanitizer is safe.
  protected readonly svg = computed<SafeHtml>(() =>
    this.sanitizer.bypassSecurityTrustHtml(PATHS[this.name()]),
  );
}
