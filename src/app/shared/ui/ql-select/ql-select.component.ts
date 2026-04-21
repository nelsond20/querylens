import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
  inject,
  signal,
} from '@angular/core';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface DropdownPos {
  top: string;
  bottom: string;
  left: string;
  width: string;
}

@Component({
  selector: 'ql-select',
  standalone: true,
  templateUrl: './ql-select.component.html',
  styleUrl: './ql-select.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.is-open]': 'isOpen()',
    '[class.is-disabled]': 'disabled',
    '[class.is-compact]': 'compact',
  },
})
export class QlSelectComponent implements OnDestroy {
  @Input() options: SelectOption[] = [];
  @Input() value: string | number | null = null;
  @Input() placeholder = 'Select…';
  @Input() disabled = false;
  @Input() compact = false;
  @Output() valueChange = new EventEmitter<string | number>();

  protected readonly isOpen = signal(false);
  protected readonly pos = signal<DropdownPos>({
    top: '0', bottom: 'auto', left: '0', width: '120px',
  });

  private readonly el = inject(ElementRef<HTMLElement>);

  get selectedLabel(): string {
    const match = this.options.find(o => String(o.value) === String(this.value));
    return match?.label ?? this.placeholder;
  }

  get hasSelection(): boolean {
    return this.value !== null && this.value !== '' && this.value !== undefined;
  }

  protected isSelected(option: SelectOption): boolean {
    return String(option.value) === String(this.value);
  }

  protected toggle(): void {
    if (this.disabled) return;
    if (!this.isOpen()) this.computePos();
    this.isOpen.update(v => !v);
  }

  protected pick(option: SelectOption): void {
    if (option.disabled) return;
    this.valueChange.emit(option.value);
    this.isOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.el.nativeElement.contains(event.target as Node)) {
      this.isOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.isOpen.set(false);
  }

  private computePos(): void {
    const trigger = this.el.nativeElement.querySelector('.trigger') as HTMLElement | null;
    if (!trigger) return;
    const r = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const openUp = spaceBelow < 200 && r.top > spaceBelow;
    this.pos.set({
      top:    openUp ? 'auto' : `${r.bottom + 4}px`,
      bottom: openUp ? `${window.innerHeight - r.top + 4}px` : 'auto',
      left:   `${r.left}px`,
      width:  `${r.width}px`,
    });
  }

  ngOnDestroy(): void {
    this.isOpen.set(false);
  }
}
