import { TestBed } from '@angular/core/testing';
import { QueryStore } from './query.store';

describe('QueryStore', () => {
  let store: InstanceType<typeof QueryStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(QueryStore);
  });

  it('starts with users dataset and empty filter tree', () => {
    expect(store.selectedDatasetId()).toBe('users');
    expect(store.filterTree().children.length).toBe(0);
    expect(store.filterIsEmpty()).toBeTrue();
  });

  it('setDataset changes selected dataset and clears state', () => {
    store.setDataset('products');

    expect(store.selectedDatasetId()).toBe('products');
    expect(store.filterIsEmpty()).toBeTrue();
    expect(store.results().length).toBe(0);
  });

  it('executeQuery returns rows for empty filter', () => {
    store.executeQuery();

    expect(store.results().length).toBeGreaterThan(0);
    expect(store.resultCount()).toBe(store.results().length);
  });

  it('updateFilterTree syncs rawQuery', () => {
    const tree = { type: 'group' as const, op: 'AND' as const, children: [] };

    store.updateFilterTree(tree);

    expect(JSON.parse(store.rawQuery())).toEqual(tree);
  });

  it('updateRawQuery with invalid JSON sets rawQueryError without replacing filterTree', () => {
    store.updateRawQuery('{ invalid json }');

    expect(store.rawQueryError()).toBe('JSON inválido');
    expect(store.filterTree().type).toBe('group');
  });

  it('applyTransformation updates transformedResults', () => {
    store.executeQuery();
    store.applyTransformation({ type: 'sort', field: 'id', direction: 'asc' });

    expect(store.transformedResults().length).toBeGreaterThan(0);
    expect(store.displayedResults()).toEqual(store.transformedResults());
  });

  it('clearQuery resets state and keeps selected dataset', () => {
    store.setDataset('products');
    store.executeQuery();
    store.clearQuery();

    expect(store.results().length).toBe(0);
    expect(store.selectedDatasetId()).toBe('products');
  });
});
