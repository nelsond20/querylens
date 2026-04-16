import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QueryStore } from '../../store/query.store';

@Component({
  selector: 'app-query-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './query-editor.component.html',
  styleUrl: './query-editor.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueryEditorComponent {
  protected readonly store = inject(QueryStore);

  protected onInput(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.store.updateRawQuery(value);
  }
}
