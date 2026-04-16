import { FilterGroup } from '../core/query-engine/filter-node.model';
import { Transformation } from '../core/query-engine/transformation.model';

export interface HistoryEntry {
  id: string;
  name: string;
  savedAt: string;
  datasetId: string;
  filterTree: FilterGroup;
  transformation: Transformation | null;
}
