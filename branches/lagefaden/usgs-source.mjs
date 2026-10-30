// SPDX-License-Identifier: MIT
// Two public USGS API representations of one catalog event. No sensor-level inference.
const validTime = value => Number.isSafeInteger(value) && value > 0 && value < 4102444800000;
const validId = value => typeof value === 'string' && /^[a-z0-9]{3,30}$/.test(value);
const iso = value => new Date(value).toISOString();
const fail = code => { throw new Error(code); };

export function evaluateUsgsPair(summary, detail) {
  if (!summary || !detail || summary.type !== 'Feature' || detail.type !== 'Feature') fail('INVALID_FEATURE');
  if (!validId(summary.id) || summary.id !== detail.id) fail('EVENT_ID_MISMATCH');
  const a = summary.properties;
  const b = detail.properties;
  if (!a || !b || !validTime(a.time) || !validTime(b.time) || !validTime(a.updated) || !validTime(b.updated)) fail('INVALID_EVENT_TIME');
  if (typeof a.title !== 'string' || a.title.length < 1 || a.title.length > 300) fail('INVALID_TITLE');
  if (a.time > a.updated || b.time > b.updated) fail('EVENT_TIME_AFTER_UPDATE');
  const detailUrl = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/detail/' + summary.id + '.geojson';
  if (a.detail !== detailUrl) fail('UNEXPECTED_DETAIL_URL');
  return {
    contract: 'halveth.lagefaden.usgs-pair.v1',
    eventId: summary.id,
    title: a.title,
    eventTimeSummary: iso(a.time),
    eventTimeDetail: iso(b.time),
    updateTimeSummary: iso(a.updated),
    updateTimeDetail: iso(b.updated),
    representationCount: 2,
    publisherEndpointCount: 1,
    sameEventId: true,
    eventTimeMatches: a.time === b.time,
    updateTimeMatches: a.updated === b.updated,
    independentPhysicalObservations: 'UNKNOWN',
    state: a.time === b.time ? 'SAME_CATALOG_EVENT' : 'REVIEW_EVENT_TIME_CHANGE',
    action: 'HUMAN_REVIEW_ONLY'
  };
}
