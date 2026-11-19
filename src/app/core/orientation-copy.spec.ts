import { describe, expect, it } from 'vitest';
import { orientationSentence } from './orientation-copy';

describe('orientationSentence', () => {
  it('describes a sample dataset filtered by a scenario', () => {
    expect(
      orientationSentence({ datasetName: 'Events', rowCount: 1000, sample: true, scenarioTitle: 'High-value events', modKey: '⌘' }),
    ).toBe(
      "You're exploring 1,000 sample events, filtered by the High-value events scenario. Change a filter, try another scenario, or press ⌘K.",
    );
  });

  it('describes a custom query on sample data', () => {
    expect(orientationSentence({ datasetName: 'Users', rowCount: 500, sample: true, scenarioTitle: null, modKey: 'Ctrl' })).toBe(
      "You're exploring 500 sample users with a custom query. Change a filter, try a scenario, or press Ctrl K.",
    );
  });

  it('describes an imported dataset by name', () => {
    expect(orientationSentence({ datasetName: 'Orders', rowCount: 12345, sample: false, scenarioTitle: null, modKey: '⌘' })).toBe(
      "You're exploring Orders (12,345 rows). Change a filter, try a scenario, or press ⌘K.",
    );
  });
});
