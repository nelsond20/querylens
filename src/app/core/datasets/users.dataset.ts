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
  name: 'Usuarios',
  description: 'Dataset de usuarios de e-commerce (500 filas)',
  fields: [
    { key: 'id', label: 'ID', type: 'string' },
    { key: 'name', label: 'Nombre', type: 'string' },
    { key: 'email', label: 'Email', type: 'string' },
    { key: 'role', label: 'Rol', type: 'string' },
    { key: 'status', label: 'Estado', type: 'string' },
    { key: 'createdAt', label: 'Creado el', type: 'date' },
  ],
  rows,
};
