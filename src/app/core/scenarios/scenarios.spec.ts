import { describe, expect, it } from 'vitest';
import { BUILT_IN_DATASETS } from '../datasets/datasets.registry';
import { buildBreakdown, buildTimeline, eligibleCategoryFields } from '../insights/bento-data';
import { execute } from '../query-engine/query-engine';
import { FIRST_SCENARIO_ID, SCENARIOS } from './scenarios';

describe('SCENARIOS', () => {
  it('starts with the first-visit scenario', () => {
    expect(SCENARIOS[0].id).toBe(FIRST_SCENARIO_ID);
  });

  for (const scenario of SCENARIOS) {
    describe(scenario.id, () => {
      const dataset = BUILT_IN_DATASETS.find((d) => d.id === scenario.datasetId);

      it('targets a built-in dataset and returns rows', () => {
        expect(dataset).toBeDefined();
        expect(execute(dataset!.rows, scenario.filterTree).length).toBeGreaterThan(0);
      });

      it('produces a breakdown so the treemap shows', () => {
        const results = execute(dataset!.rows, scenario.filterTree);
        expect(buildBreakdown(eligibleCategoryFields(dataset!.fields, dataset!.rows), results)).not.toBeNull();
      });

      it('produces a timeline with matches when the dataset has a date field', () => {
        if (!dataset!.fields.some((f) => f.type === 'date')) {
          return;
        }
        const results = execute(dataset!.rows, scenario.filterTree);
        const timeline = buildTimeline(dataset!.fields, dataset!.rows, results);
        expect(timeline).not.toBeNull();
        expect(timeline!.buckets.some((b) => b.matched > 0)).toBe(true);
      });
    });
  }
});
