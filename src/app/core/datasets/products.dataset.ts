import { Dataset } from './dataset.model';

const categories = ['electronics', 'clothing', 'food', 'books', 'sports'];

function pad(n: number): string {
  return String(n).padStart(3, '0');
}

const rows = Array.from({ length: 300 }, (_, i) => ({
  id: `prod-${pad(i + 1)}`,
  name: `Product ${pad(i + 1)}`,
  category: categories[i % categories.length],
  price: Math.round(((i % 50) + 1) * 3.99 * 100) / 100,
  stock: (i * 7) % 200,
  rating: Math.round(((i % 5) + 1) * 10) / 10,
}));

export const productsDataset: Dataset = {
  id: 'products',
  name: 'Productos',
  description: 'Dataset de catálogo de productos (300 filas)',
  fields: [
    { key: 'id', label: 'ID', type: 'string' },
    { key: 'name', label: 'Nombre', type: 'string' },
    { key: 'category', label: 'Categoría', type: 'string' },
    { key: 'price', label: 'Precio', type: 'number' },
    { key: 'stock', label: 'Stock', type: 'number' },
    { key: 'rating', label: 'Rating', type: 'number' },
  ],
  rows,
};
