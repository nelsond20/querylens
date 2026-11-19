const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * "12 Nov 2024, 14:02" for timestamps (in `timeZone`, the viewer's by default) and "1 Jan 2023"
 * for date-only values, which are calendar dates and must not shift with the time zone.
 */
export function formatDateValue(value: unknown, timeZone?: string): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  const text = String(value);
  const ms = Date.parse(text);
  if (!Number.isFinite(ms)) {
    return text;
  }

  const d = new Date(ms);
  if (DATE_ONLY.test(text)) {
    return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  }

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  return `${Number(get('day'))} ${MONTHS[Number(get('month')) - 1]} ${get('year')}, ${get('hour')}:${get('minute')}`;
}
