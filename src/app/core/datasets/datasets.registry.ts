import { Dataset } from './dataset.model';
import { eventsDataset } from './events.dataset';
import { productsDataset } from './products.dataset';
import { usersDataset } from './users.dataset';

export const BUILT_IN_DATASETS: Dataset[] = [usersDataset, eventsDataset, productsDataset];

export function getBuiltInDataset(id: string): Dataset | null {
  return BUILT_IN_DATASETS.find((d) => d.id === id) ?? null;
}

export function getDataset(id: string): Dataset {
  const dataset = getBuiltInDataset(id);
  if (!dataset) {
    throw new Error(`Dataset not found: ${id}`);
  }
  return dataset;
}
