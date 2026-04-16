import { Dataset } from './dataset.model';

const roles = ['admin', 'editor', 'viewer'];
const statuses = ['active', 'inactive', 'pending'];

function pad(n: number): string {
  return String(n).padStart(3, '0');
}

const rows = Array.from({ length: 500 }, (_, i) => ({
  id: `usr-${pad(i + 1)}`,
  name: `User ${pad(i + 1)}`,
  email: `user${pad(i + 1)}@example.com`,
  role: roles[i % roles.length],
  status: statuses[i % statuses.length],
  createdAt: new Date(2023, i % 12, (i % 28) + 1).toISOString().split('T')[0],
}));

export const usersDataset: Dataset = {
  id: 'users',
  name: 'Users',
  description: 'E-commerce user activity snapshot (500 rows)',
  fields: [
    { key: 'id', label: 'ID', type: 'string' },
    { key: 'name', label: 'Name', type: 'string' },
    { key: 'email', label: 'Email', type: 'string' },
    { key: 'role', label: 'Role', type: 'string' },
    { key: 'status', label: 'Status', type: 'string' },
    { key: 'createdAt', label: 'Created At', type: 'date' },
  ],
  rows,
  source: 'built-in',
};
