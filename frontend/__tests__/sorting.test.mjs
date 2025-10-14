import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  sortTasksByDue,
  getDueDateOrderValue,
  getDueTimeOrderValue,
  __test__
} from '../sorting.js';

const { MAX_ORDER_VALUE, hasExplicitDueTime } = __test__;

describe('getDueDateOrderValue', () => {
  it('places tasks without due date at the end', () => {
    assert.equal(getDueDateOrderValue({}), MAX_ORDER_VALUE);
  });

  it('normalizes the date to the start of the day', () => {
    const value = getDueDateOrderValue({ due: '2024-06-02T18:30:00.000+02:00' });
    const midnight = new Date(2024, 5, 2).getTime();
    assert.equal(value, midnight);
  });
});

describe('getDueTimeOrderValue', () => {
  it('uses explicit due time when provided', () => {
    const minutes = getDueTimeOrderValue({ due: '2024-06-02T08:15:00.000+02:00' });
    assert.equal(minutes, 8 * 60 + 15);
  });

  it('falls back to manual time when due time is midnight', () => {
    const minutes = getDueTimeOrderValue({
      due: '2024-06-02T00:00:00.000Z',
      title: 'Taak 07:45'
    });
    assert.equal(minutes, 7 * 60 + 45);
  });

  it('returns MAX when neither due nor manual time present', () => {
    const minutes = getDueTimeOrderValue({ title: 'Zonder tijd' });
    assert.equal(minutes, MAX_ORDER_VALUE);
  });
});

describe('hasExplicitDueTime', () => {
  it('detects absence of explicit time for midnight values', () => {
    assert.equal(hasExplicitDueTime('2024-06-02T00:00:00.000Z'), false);
    assert.equal(hasExplicitDueTime('2024-06-02T00:00:00.000+02:00'), false);
  });

  it('detects explicit times', () => {
    assert.equal(hasExplicitDueTime('2024-06-02T07:30:00.000+02:00'), true);
  });
});

describe('sortTasksByDue', () => {
  it('orders by due date first', () => {
    const tasks = [
      { id: 'a', title: 'A', due: '2024-06-03T00:00:00.000Z' },
      { id: 'b', title: 'B', due: '2024-06-01T00:00:00.000Z' }
    ];
    const sorted = sortTasksByDue(tasks).map(t => t.id);
    assert.deepEqual(sorted, ['b', 'a']);
  });

  it('orders by explicit due time when dates match', () => {
    const tasks = [
      { id: 'a', title: 'A', due: '2024-06-02T09:45:00.000+02:00' },
      { id: 'b', title: 'B', due: '2024-06-02T07:30:00.000+02:00' }
    ];
    const sorted = sortTasksByDue(tasks).map(t => t.id);
    assert.deepEqual(sorted, ['b', 'a']);
  });

  it('falls back to manual times when due time missing', () => {
    const tasks = [
      { id: 'a', title: 'Taak 08:15', due: '2024-06-02T00:00:00.000Z' },
      { id: 'b', title: 'Taak 07.30', due: '2024-06-02T00:00:00.000Z' }
    ];
    const sorted = sortTasksByDue(tasks).map(t => t.id);
    assert.deepEqual(sorted, ['b', 'a']);
  });

  it('pushes tasks without due to the end but keeps manual order among them', () => {
    const tasks = [
      { id: 'a', title: 'Taak 08:00' },
      { id: 'b', title: 'Taak 07:00' },
      { id: 'c', title: 'Met due', due: '2024-06-02T00:00:00.000Z' }
    ];
    const sorted = sortTasksByDue(tasks).map(t => t.id);
    assert.deepEqual(sorted, ['c', 'b', 'a']);
  });

  it('uses localeCompare on titles as a final tiebreaker', () => {
    const tasks = [
      { id: 'a', title: 'B', due: '2024-06-02T00:00:00.000Z' },
      { id: 'b', title: 'A', due: '2024-06-02T00:00:00.000Z' }
    ];
    const sorted = sortTasksByDue(tasks).map(t => t.id);
    assert.deepEqual(sorted, ['b', 'a']);
  });
});
