import { A11yModule } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { matchesCommand } from '../../../core/command-match';
import { QlIconComponent } from '../ql-icon/ql-icon.component';
import { Command, CommandGroup, CommandRegistryService } from './command-registry.service';

const GROUP_ORDER: CommandGroup[] = ['Actions', 'Scenarios', 'Datasets', 'Navigate'];

@Component({
  selector: 'ql-command-palette',
  standalone: true,
  imports: [A11yModule, QlIconComponent],
  templateUrl: './command-palette.component.html',
  styleUrl: './command-palette.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommandPaletteComponent {
  protected readonly registry = inject(CommandRegistryService);

  protected readonly query = signal('');
  protected readonly activeIndex = signal(0);
  private readonly list = viewChild<ElementRef<HTMLElement>>('list');
  private readonly returnFocus = document.activeElement as HTMLElement | null;

  protected readonly results = computed(() =>
    this.registry.commands().filter((command) => matchesCommand(this.query(), command.label)),
  );

  protected readonly groups = computed(() => {
    const results = this.results();
    return GROUP_ORDER.map((group) => ({
      group,
      items: results.map((command, index) => ({ command, index })).filter(({ command }) => command.group === group),
    })).filter((g) => g.items.length > 0);
  });

  constructor() {
    effect(() => {
      this.query();
      this.activeIndex.set(0);
    });
    effect(() => {
      const index = this.activeIndex();
      this.list()?.nativeElement.querySelector(`[data-index="${index}"]`)?.scrollIntoView({ block: 'nearest' });
    });
  }

  protected onKeydown(event: KeyboardEvent): void {
    const count = this.results().length;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex.set(count === 0 ? 0 : (this.activeIndex() + 1) % count);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex.set(count === 0 ? 0 : (this.activeIndex() - 1 + count) % count);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const command = this.results()[this.activeIndex()];
      if (command) {
        this.execute(command);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    }
  }

  protected execute(command: Command): void {
    this.close();
    command.run();
  }

  protected close(): void {
    this.registry.close();
    this.returnFocus?.focus?.();
  }
}
