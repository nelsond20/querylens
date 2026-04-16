import { Dataset } from './dataset.model';
import { eventsDataset } from './events.dataset';
import { productsDataset } from './products.dataset';
import { usersDataset } from './users.dataset';

export const DATASETS: Dataset[] = [usersDataset, eventsDataset, productsDataset];

export function getDataset(id: string): Dataset {
  const dataset = DATASETS.find((d) => d.id === id);
  if (!dataset) {
    throw new Error(`Dataset not found: ${id}`);
  }
  return dataset;
}
