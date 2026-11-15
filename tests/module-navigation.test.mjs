import test from 'node:test';
import assert from 'node:assert/strict';
import {moduleUrl, modeFromUrl} from '../public/module-navigation.mjs';

test('switching modules clears stale reading, draft and atlas destinations', () => {
  const current = 'http://127.0.0.1:3210/?mode=wuhan&compose=participation&atlas=yellow-crane&lang=en#wuhan-story-poetry';
  assert.equal(moduleUrl(current, 'travel'), '/?mode=travel&lang=en');
  assert.equal(modeFromUrl(moduleUrl(current, 'travel')), 'travel');
});

test('initial module canonicalization preserves a shared reading or draft entry', () => {
  assert.equal(moduleUrl('/?compose=participation#chu-chapter-poetry', 'community', {preserveHash:true, preserveEntry:true}), '/?compose=participation&mode=community#chu-chapter-poetry');
  for (const mode of ['wuhan', 'travel', 'community', 'saig']) assert.equal(modeFromUrl(`/?mode=${mode}`), mode);
});

test('invalid or missing modes do not produce unusable routes', () => {
  assert.equal(modeFromUrl('/'), null);
  assert.equal(modeFromUrl('/?mode=unknown'), null);
  assert.throws(() => moduleUrl('/', 'unknown'), RangeError);
});
