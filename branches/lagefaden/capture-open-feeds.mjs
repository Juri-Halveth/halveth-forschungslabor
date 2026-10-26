// SPDX-License-Identifier: MIT
// Bounded, read-only captures from fixed public NASA and Copernicus endpoints.
import {createHash, randomUUID} from 'node:crypto';
import {mkdir, rename, writeFile} from 'node:fs/promises';
import {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {evaluateEonetPair, evaluateCemsPair} from './public-sources.mjs';

const eonetListUrl = 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=20';
const mappingListUrl = 'https://mapping.emergency.copernicus.eu/activations/api/activations/?limit=10';
const rapidListUrl = 'https://rapidmapping.emergency.copernicus.eu/backend/dashboard-api/public-activations-info/?limit=10';
const hex = bytes => createHash('sha256').update(bytes).digest('hex');
const receipt = (url, result) => ({url,retrievedAt:result.retrievedAt,bytes:result.bytes,sha256:result.sha256,declaredContentType:result.contentType});

async function getJson(url) {
  const response = await fetch(url,{redirect:'error',signal:AbortSignal.timeout(15000),headers:{Accept:'application/json'}});
  if (!response.ok || !response.body) throw Error('PUBLIC_SOURCE_HTTP');
  const chunks = [];
  let total = 0;
  for await (const chunk of response.body) {
    total += chunk.byteLength;
    if (total > 750000) throw Error('PUBLIC_SOURCE_SIZE_LIMIT');
    chunks.push(Buffer.from(chunk));
  }
  const bytes = Buffer.concat(chunks,total);
  if (!bytes.length) throw Error('PUBLIC_SOURCE_EMPTY');
  const data = JSON.parse(bytes.toString('utf8'));
  return {data,bytes:bytes.length,sha256:hex(bytes),retrievedAt:new Date().toISOString(),contentType:response.headers.get('content-type')};
}

const eonetProjection = event => ({
  id:event.id,title:event.title,link:event.link,
  sources:event.sources.map(source => ({id:source.id,url:source.url})),
  geometry:event.geometry.map(point => ({date:point.date,type:point.type,coordinates:point.coordinates}))
});
const hasPublicPointReferences = event => /^EONET_[0-9]{1,12}$/.test(event?.id || '')
  && Array.isArray(event?.sources) && event.sources.length >= 2
  && event.sources.every(source => typeof source.id === 'string' && /^https:\/\//.test(source.url))
  && Array.isArray(event?.geometry) && event.geometry.length > 0
  && event.geometry.every(point => point.type === 'Point');

async function captureEonet() {
  const list = await getJson(eonetListUrl);
  if (!Array.isArray(list.data.events)) throw Error('EONET_EVENTS_MISSING');
  const chosen = list.data.events.find(hasPublicPointReferences);
  if (!chosen) throw Error('EONET_NO_BOUNDED_MULTI_REFERENCE_EVENT');
  const detailUrl = 'https://eonet.gsfc.nasa.gov/api/v3/events/' + chosen.id;
  const detail = await getJson(detailUrl);
  const summaryRecord = eonetProjection(chosen);
  const detailRecord = eonetProjection(detail.data);
  return {
    contract:'halveth.lagefaden.eonet-snapshot.v1',
    selection:'first_open_event_with_two_https_references_and_point_geometry_in_first_20',
    list:receipt(eonetListUrl,list),detail:receipt(detailUrl,detail),
    records:{summary:summaryRecord,detail:detailRecord},
    evaluation:evaluateEonetPair(summaryRecord,detailRecord),
    evidenceLimit:'Two EONET API representations and external source references are not authenticated independent sensors. Raw API responses are hashed, not archived.'
  };
}

const mappingProjection = record => ({
  code:record.code,name:record.name,activationTime:record.activationTime,lastUpdate:record.lastUpdate,
  category:record.category?.name,countries:record.countries?.map(country => country.short_name),
  closed:record.closed,n_products:record.n_products
});
const rapidProjection = record => ({
  code:record.code,name:record.name,eventTime:record.eventTime,
  activationTime:record.activationTime,lastUpdate:record.lastUpdate,
  category:record.category,countries:record.countries,
  closed:record.closed,n_products:record.n_products
});
const detailProjection = record => ({
  code:record.code,name:record.name,eventTime:record.eventTime,
  activationTime:record.activationTime,sensitive:record.sensitive,closed:record.closed
});

async function captureCems() {
  const [mapping,rapid] = await Promise.all([getJson(mappingListUrl),getJson(rapidListUrl)]);
  if (!Array.isArray(mapping.data.results) || !Array.isArray(rapid.data.results)) throw Error('CEMS_ACTIVATIONS_MISSING');
  const rapidByCode = new Map(rapid.data.results.map(record => [record.code,record]));
  const common = mapping.data.results.find(record => /^EMSR[0-9]{3,6}$/.test(record.code || '') && rapidByCode.has(record.code));
  if (!common) throw Error('CEMS_NO_COMMON_PUBLIC_ACTIVATION');
  const detailUrl = 'https://rapidmapping.emergency.copernicus.eu/backend/dashboard-api/public-activations/?code=' + common.code;
  const detail = await getJson(detailUrl);
  const publicDetail = detail.data.results?.find(record => record.code === common.code && record.sensitive === false);
  if (!publicDetail) throw Error('CEMS_NO_PUBLIC_DETAIL');
  const records = {mapping:mappingProjection(common),rapid:rapidProjection(rapidByCode.get(common.code)),detail:detailProjection(publicDetail)};
  return {
    contract:'halveth.lagefaden.cems-snapshot.v1',
    selection:'first_shared_public_rapid_mapping_code_in_first_10_of_each_official_list',
    mappingList:receipt(mappingListUrl,mapping),rapidList:receipt(rapidListUrl,rapid),detail:receipt(detailUrl,detail),
    records,evaluation:evaluateCemsPair(records.mapping,records.rapid,records.detail),
    evidenceLimit:'Two Copernicus EMS API views are not independent institutions or physical observations. Provider documents UTC although these fields omit a zone marker. Raw responses are hashed, not archived.'
  };
}

async function save(name, snapshot) {
  const target = fileURLToPath(new URL('./data/'+name,import.meta.url));
  await mkdir(dirname(target),{recursive:true});
  const temporary = target + '.' + randomUUID() + '.tmp';
  await writeFile(temporary,JSON.stringify(snapshot,null,2)+'\n',{flag:'wx'});
  await rename(temporary,target);
}

if (process.argv.length !== 2 && !(process.argv.length === 3 && process.argv[2] === '--write')) throw Error('USE_NO_ARGUMENTS_OR_--write');
const [eonet,cems] = await Promise.all([captureEonet(),captureCems()]);
if (process.argv[2] === '--write') {
  await save('eonet-example.json',eonet);
  await save('cems-example.json',cems);
  process.stdout.write('Wrote NASA EONET ' + eonet.evaluation.eventId + ' and public CEMS ' + cems.evaluation.activationCode + ' receipts\n');
} else process.stdout.write(JSON.stringify({eonet,cems},null,2)+'\n');
