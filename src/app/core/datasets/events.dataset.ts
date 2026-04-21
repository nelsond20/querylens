import { Dataset } from './dataset.model';

const eventTypes = ['page_view', 'click', 'purchase', 'signup', 'logout'];

function pad(n: number): string {
  return String(n).padStart(4, '0');
}

const rows = Array.from({ length: 1000 }, (_, i) => ({
  eventId: `evt-${pad(i + 1)}`,
  userId: `usr-${String((i % 500) + 1).padStart(3, '0')}`,
  type: eventTypes[i % eventTypes.length],
  timestamp: new Date(2024, i % 12, (i % 28) + 1, i % 24, i % 60).toISOString(),
  value: Math.round((i % 100) * 1.5 * 100) / 100,
}));

export const eventsDataset: Dataset = {
  id: 'events',
  name: 'Events',
  description: 'Behavior analytics event stream (1000 rows)',
  fields: [
    { key: 'eventId', label: 'Event ID', type: 'string' },
    { key: 'userId', label: 'User ID', type: 'string' },
    { key: 'type', label: 'Event Type', type: 'string' },
    { key: 'timestamp', label: 'Timestamp', type: 'date' },
    { key: 'value', label: 'Value', type: 'number' },
  ],
  rows,
  source: 'built-in',
};
