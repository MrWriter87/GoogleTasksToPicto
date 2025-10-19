const MAX_ORDER_VALUE = Number.MAX_SAFE_INTEGER;
const MIDNIGHT_REGEX = /T00:00:00(?:\.0+)?(?:Z|[+-]\d{2}:?\d{2})?$/i;
const DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})/;
const LEADING_NUMBER_REGEX = /^(\d{1,3})\b/;

function hasExplicitDueTime(due) {
  if (!due) return false;
  // Treat midnight timestamps as missing an explicit time component
  return !MIDNIGHT_REGEX.test(due);
}

function extractDueTimeMinutes(due) {
  if (!due) return null;
  const match = due.match(/T(\d{2}):(\d{2})/);
  if (!match) return null;
  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

export function getManualOrderValue(task) {
  const title = (task?.title || '').trim();
  if (!title) return MAX_ORDER_VALUE;
  const match = title.match(LEADING_NUMBER_REGEX);
  if (!match) return MAX_ORDER_VALUE;
  const value = Number.parseInt(match[1], 10);
  if (Number.isNaN(value)) return MAX_ORDER_VALUE;
  return value;
}

export function getManualTimeValue(task) {
  const haystack = `${task?.title || ''} ${task?.notes || ''}`;
  const match = haystack.match(/\b(\d{1,2})[:.](\d{2})\b/);
  if (!match) return MAX_ORDER_VALUE;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return MAX_ORDER_VALUE;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return MAX_ORDER_VALUE;
  }
  return hours * 60 + minutes;
}

export function getDueDateOrderValue(task) {
  const match = typeof task?.due === 'string' ? task.due.match(DATE_REGEX) : null;
  if (!match) return MAX_ORDER_VALUE;
  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10) - 1;
  const day = Number.parseInt(match[3], 10);
  if ([year, month, day].some(Number.isNaN)) return MAX_ORDER_VALUE;
  return Date.UTC(year, month, day);
}

export function getDueTimeOrderValue(task) {
  if (hasExplicitDueTime(task?.due)) {
    const minutes = extractDueTimeMinutes(task?.due);
    if (typeof minutes === 'number' && !Number.isNaN(minutes)) {
      return minutes;
    }
  }
  const manual = getManualTimeValue(task);
  if (manual !== MAX_ORDER_VALUE) return manual;
  return MAX_ORDER_VALUE;
}

export function sortTasksByDue(items) {
  return [...items].sort((a, b) => {
    const aManualOrder = getManualOrderValue(a);
    const bManualOrder = getManualOrderValue(b);
    if (aManualOrder !== bManualOrder) return aManualOrder - bManualOrder;

    const aDate = getDueDateOrderValue(a);
    const bDate = getDueDateOrderValue(b);
    if (aDate !== bDate) return aDate - bDate;

    const aTime = getDueTimeOrderValue(a);
    const bTime = getDueTimeOrderValue(b);
    if (aTime !== bTime) return aTime - bTime;

    const aTitle = a?.title || '';
    const bTitle = b?.title || '';
    return aTitle.localeCompare(bTitle, 'nl', { sensitivity: 'base' });
  });
}

export const __test__ = {
  MAX_ORDER_VALUE,
  hasExplicitDueTime,
  extractDueTimeMinutes,
  getManualOrderValue
};
