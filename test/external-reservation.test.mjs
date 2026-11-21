import test from 'node:test';
import assert from 'node:assert/strict';
import {hasObservedSourceReservation} from '../src/scale-progress.mjs';

test('an observed accepted reservation protects only its source intent', () => {
  const row = {sourceIntentId: 'source-a', status: 'scheduled', receipt: {platformId: '123'}};
  assert.equal(hasObservedSourceReservation({queue: [row]}, 'source-a'), true);
  assert.equal(hasObservedSourceReservation({queue: [row]}, 'source-b'), false);
  assert.equal(hasObservedSourceReservation({queue: [{...row, status: 'planned'}]}, 'source-a'), false);
  assert.equal(hasObservedSourceReservation({queue: [{...row, receipt: null}]}, 'source-a'), false);
  for (const status of ['published', 'under_review']) {
    assert.equal(hasObservedSourceReservation({queue: [{...row, status}]}, 'source-a'), true);
  }
});
