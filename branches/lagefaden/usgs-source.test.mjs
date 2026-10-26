// SPDX-License-Identifier: MIT
import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateUsgsPair} from './usgs-source.mjs';

const example = () => {
  const properties = {time: 1793009581234, updated: 1793017150404, title: 'M 5.5 - Fiji',
    detail: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/detail/us6000u4yr.geojson'};
  return [{type:'Feature',id:'us6000u4yr',properties:{...properties}},
    {type:'Feature',id:'us6000u4yr',properties:{...properties}}];
};

test('two USGS representations remain one catalog event with unknown physical independence', () => {
  const [summary, detail] = example();
  const result = evaluateUsgsPair(summary, detail);
  assert.equal(result.representationCount, 2);
  assert.equal(result.publisherEndpointCount, 1);
  assert.equal(result.independentPhysicalObservations, 'UNKNOWN');
  assert.equal(result.state, 'SAME_CATALOG_EVENT');
});

test('a changed event time remains a review item, not a new event', () => {
  const [summary, detail] = example();
  detail.properties.time += 1000;
  const result = evaluateUsgsPair(summary, detail);
  assert.equal(result.state, 'REVIEW_EVENT_TIME_CHANGE');
  assert.equal(result.eventTimeMatches, false);
});

test('different identifiers and external detail links are rejected', () => {
  const [summary, detail] = example();
  detail.id = 'us6000other';
  assert.throws(() => evaluateUsgsPair(summary, detail), /EVENT_ID_MISMATCH/);
  detail.id = summary.id;
  summary.properties.detail = 'https://example.org/event.geojson';
  assert.throws(() => evaluateUsgsPair(summary, detail), /UNEXPECTED_DETAIL_URL/);
});
