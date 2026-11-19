export interface OrientationInput {
  datasetName: string;
  rowCount: number;
  sample: boolean;
  scenarioTitle: string | null;
  /** '⌘' on Apple platforms, 'Ctrl' elsewhere. */
  modKey: string;
}

/** The one-line orientation strip shown on a first visit, generated so it stays true to what's on screen. */
export function orientationSentence(input: OrientationInput): string {
  const rows = input.rowCount.toLocaleString('en-US');
  const shortcut = input.modKey === '⌘' ? '⌘K' : `${input.modKey} K`;

  if (!input.sample) {
    return `You're exploring ${input.datasetName} (${rows} rows). Change a filter, try a scenario, or press ${shortcut}.`;
  }

  const noun = input.datasetName.toLowerCase();
  if (input.scenarioTitle) {
    return `You're exploring ${rows} sample ${noun}, filtered by the ${input.scenarioTitle} scenario. Change a filter, try another scenario, or press ${shortcut}.`;
  }
  return `You're exploring ${rows} sample ${noun} with a custom query. Change a filter, try a scenario, or press ${shortcut}.`;
}
