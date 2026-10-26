// SPDX-License-Identifier: MIT
// Compare representations within one publisher's catalog. Cross-publisher identity is not inferred.
const fail = code => { throw new Error(code); };
const text = value => typeof value === 'string' && value.length > 0 && value.length <= 300;
const eonetId = value => typeof value === 'string' && /^EONET_[0-9]{1,12}$/.test(value);
const cemsCode = value => typeof value === 'string' && /^EMSR[0-9]{3,6}$/.test(value);
const date = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z$/.test(value)) fail('INVALID_UTC_DATE');
  const instant = new Date(value);
  if (!Number.isFinite(instant.valueOf())) fail('INVALID_UTC_DATE');
  return instant.toISOString();
};
// CEMS documents UTC, but its API currently omits a timezone marker. Make that provider assumption explicit.
const cemsDate = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?$/.test(value)) fail('INVALID_CEMS_DATE');
  return date(value + 'Z');
};

export function evaluateEonetPair(summary, detail) {
  if (!summary || !detail || !eonetId(summary.id) || summary.id !== detail.id) fail('EONET_ID_MISMATCH');
  const url = 'https://eonet.gsfc.nasa.gov/api/v3/events/' + summary.id;
  if (summary.link !== url || detail.link !== url || !text(summary.title) || !text(detail.title)) fail('EONET_SOURCE_OR_TITLE');
  if (!Array.isArray(detail.sources) || detail.sources.length > 20 || !Array.isArray(detail.geometry) || detail.geometry.length < 1 || detail.geometry.length > 300) fail('EONET_SHAPE');
  const ids = detail.sources.map(source => {
    if (!text(source?.id) || typeof source.url !== 'string' || !source.url.startsWith('https://')) fail('EONET_REFERENCE');
    return source.id;
  });
  const points = detail.geometry.map(geometry => {
    if (geometry?.type !== 'Point' || !Array.isArray(geometry.coordinates) || geometry.coordinates.length !== 2) fail('EONET_GEOMETRY');
    const [lon,lat] = geometry.coordinates;
    if (!Number.isFinite(lon) || lon < -180 || lon > 180 || !Number.isFinite(lat) || lat < -90 || lat > 90) fail('EONET_COORDINATES');
    return {at:date(geometry.date),longitude:lon,latitude:lat};
  }).sort((a,b) => a.at.localeCompare(b.at));
  const summaryReferenceIds = summary.sources?.map(source => source.id);
  if (!Array.isArray(summaryReferenceIds) || summaryReferenceIds.some(id => !text(id))) fail('EONET_SUMMARY_REFERENCES');
  const referencesMatch = JSON.stringify([...new Set(summaryReferenceIds)].sort()) === JSON.stringify([...new Set(ids)].sort());
  return {
    contract:'halveth.lagefaden.eonet-pair.v1',eventId:summary.id,title:detail.title,
    representationCount:2,curatedEventCount:1,referenceCount:new Set(ids).size,
    sourceReferenceIds:[...new Set(ids)],referencesMatch,
    firstGeometryTime:points[0].at,lastGeometryTime:points.at(-1).at,
    lastLocation:{latitude:points.at(-1).latitude,longitude:points.at(-1).longitude},
    independentPhysicalObservations:'UNKNOWN',
    state:referencesMatch ? 'SAME_CURATED_EVENT' : 'REVIEW_REFERENCE_CHANGE',
    action:'HUMAN_REVIEW_ONLY'
  };
}

export function evaluateCemsPair(mapping, rapid, detail) {
  if (!mapping || !rapid || !detail || !cemsCode(mapping.code)
    || mapping.code !== rapid.code || mapping.code !== detail.code || detail.sensitive !== false) fail('CEMS_PUBLIC_ID_MISMATCH');
  if (!text(mapping.name) || !text(rapid.name) || mapping.name !== rapid.name || detail.name !== rapid.name) fail('CEMS_TITLE_MISMATCH');
  const mappingActivation = cemsDate(mapping.activationTime);
  const rapidActivation = cemsDate(rapid.activationTime);
  if (mappingActivation !== rapidActivation || rapidActivation !== cemsDate(detail.activationTime)) fail('CEMS_ACTIVATION_TIME_MISMATCH');
  const mappingUpdate = cemsDate(mapping.lastUpdate);
  const rapidUpdate = cemsDate(rapid.lastUpdate);
  const eventTime = cemsDate(rapid.eventTime);
  if (!Number.isSafeInteger(mapping.n_products) || mapping.n_products < 0
    || !Number.isSafeInteger(rapid.n_products) || rapid.n_products < 0) fail('CEMS_PRODUCT_COUNT');
  if (eventTime > rapidActivation || mappingUpdate < mappingActivation || rapidUpdate < rapidActivation) fail('CEMS_TIME_ORDER');
  const updatesMatch = mappingUpdate === rapidUpdate;
  return {
    contract:'halveth.lagefaden.cems-pair.v1',activationCode:mapping.code,title:rapid.name,
    representationCount:2,activationCount:1,eventTime,activationTime:rapidActivation,
    mappingUpdateTime:mappingUpdate,rapidUpdateTime:rapidUpdate,updatesMatch,
    productCountMapping:mapping.n_products,productCountRapid:rapid.n_products,
    sourceTimeInterpretation:'CEMS_UNZONED_FIELDS_INTERPRETED_AS_UTC_PER_PROVIDER_DOC',
    normalizedTimePrecision:'MILLISECONDS; ORIGINAL_MICROSECONDS_RETAINED_IN_SOURCE_RECORDS',
    independentPhysicalObservations:'UNKNOWN',
    state:updatesMatch ? 'SAME_PUBLIC_ACTIVATION' : 'REVIEW_DIFFERENT_METADATA_UPDATES',
    action:'HUMAN_REVIEW_ONLY'
  };
}
