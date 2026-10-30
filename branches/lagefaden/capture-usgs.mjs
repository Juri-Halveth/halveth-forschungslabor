// SPDX-License-Identifier: MIT
// Read two fixed public USGS endpoints; store a small derived, dated receipt.
import {createHash} from 'node:crypto';
import {mkdir, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname} from 'node:path';
import {evaluateUsgsPair} from './usgs-source.mjs';

const feedUrl = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson';
const outputPath = fileURLToPath(new URL('./data/usgs-example.json', import.meta.url));
const hex = bytes => createHash('sha256').update(bytes).digest('hex');
async function getJson(url) {
  const response = await fetch(url, {redirect:'error', signal:AbortSignal.timeout(15000),
    headers:{Accept:'application/geo+json, application/json'}});
  if (!response.ok || !(response.headers.get('content-type') || '').includes('json')) throw Error('USGS_HTTP_OR_TYPE');
  const declaredSize = Number(response.headers.get('content-length'));
  if (Number.isFinite(declaredSize) && declaredSize > 1000000) throw Error('USGS_SIZE_LIMIT');
  const chunks = [];
  let total = 0;
  for await (const chunk of response.body) {
    total += chunk.byteLength;
    if (total > 1000000) throw Error('USGS_SIZE_LIMIT');
    chunks.push(Buffer.from(chunk));
  }
  const bytes = Buffer.concat(chunks,total);
  if (bytes.length < 1 || bytes.length > 1000000) throw Error('USGS_SIZE_LIMIT');
  return {data:JSON.parse(bytes.toString('utf8')), bytes:bytes.length, sha256:hex(bytes), retrievedAt:new Date().toISOString()};
}
function candidate(feature) {
  return feature && typeof feature.id === 'string' && /^[a-z0-9]{3,30}$/.test(feature.id)
    && Number.isFinite(feature.properties?.mag)
    && feature.properties.detail === 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/detail/' + feature.id + '.geojson';
}
function projection(feature) {
  return {type:feature.type,id:feature.id,properties:{title:feature.properties.title,
    time:feature.properties.time,updated:feature.properties.updated,detail:feature.properties.detail}};
}

if (process.argv.length !== 2 && !(process.argv.length === 3 && process.argv[2] === '--write')) {
  throw Error('USE_NO_ARGUMENTS_OR_--write');
}
const feed = await getJson(feedUrl);
if (feed.data.type !== 'FeatureCollection' || !Array.isArray(feed.data.features)
  || !Number.isSafeInteger(feed.data.metadata?.generated)) throw Error('INVALID_USGS_FEED');
const summary = feed.data.features.filter(candidate).sort((a,b) =>
  b.properties.mag - a.properties.mag || b.properties.time - a.properties.time)[0];
if (!summary) throw Error('NO_VALID_USGS_EVENT');
const detailUrl = summary.properties.detail;
const detail = await getJson(detailUrl);
const result = evaluateUsgsPair(projection(summary), projection(detail.data));
const snapshot = {
  contract:'halveth.lagefaden.usgs-snapshot.v1',
  selection:'highest_magnitude_in_2_5_day_feed_then_latest_event_time',
  feed:{url:feedUrl,generatedAt:new Date(feed.data.metadata.generated).toISOString(),
    retrievedAt:feed.retrievedAt,bytes:feed.bytes,sha256:feed.sha256},
  detail:{url:detailUrl,retrievedAt:detail.retrievedAt,bytes:detail.bytes,sha256:detail.sha256},
  records:{summary:projection(summary),detail:projection(detail.data)},
  evaluation:result,
  evidenceLimit:'Raw responses were hashed but are not included; source records can be revised. One publisher endpoint does not prove one physical sensor.'
};
const serialized = JSON.stringify(snapshot,null,2) + '\n';
if (process.argv[2] === '--write') {
  await mkdir(dirname(outputPath),{recursive:true});
  await writeFile(outputPath,serialized,{flag:'w'});
  process.stdout.write('Wrote dated USGS-derived snapshot for ' + result.eventId + '\n');
} else process.stdout.write(serialized);
