import { TestBed } from '@angular/core/testing';
import { HistoryEntry } from './history-entry.model';
import { HistoryStore } from './history.store';

const mockEntry: HistoryEntry = {
  id: 'test-1',
  name: 'Test query',
  savedAt: '2026-04-16T10:00:00.000Z',
  datasetId: 'users',
  filterTree: { type: 'group', op: 'AND', children: [] },
  transformation: null,
};

describe('HistoryStore', () => {
  let store: InstanceType<typeof HistoryStore>;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    store = TestBed.inject(HistoryStore);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('starts with empty entries', () => {
    expect(store.entries().length).toBe(0);
  });

  it('saveEntry adds and persists data', () => {
    store.saveEntry(mockEntry);

    expect(store.entries().length).toBe(1);
    expect(store.entries()[0].id).toBe('test-1');

    const stored = JSON.parse(localStorage.getItem('querylens:history') ?? '[]') as HistoryEntry[];
    expect(stored.length).toBe(1);
  });

  it('deleteEntry removes data', () => {
    store.saveEntry(mockEntry);
    store.deleteEntry('test-1');

    expect(store.entries().length).toBe(0);
  });

  it('loads entries from localStorage at init', () => {
    localStorage.setItem('querylens:history', JSON.stringify([mockEntry]));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});

    const freshStore = TestBed.inject(HistoryStore);
    expect(freshStore.entries().length).toBe(1);
  });
});
