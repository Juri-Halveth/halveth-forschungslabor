// SPDX-License-Identifier: MIT
import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateEonetPair,evaluateCemsPair} from './public-sources.mjs';

const eonet = () => ({
  id:'EONET_42',title:'Test storm',link:'https://eonet.gsfc.nasa.gov/api/v3/events/EONET_42',
  sources:[{id:'A',url:'https://a.example/source'},{id:'B',url:'https://b.example/source'}],
  geometry:[{date:'2026-10-26T00:00:00Z',type:'Point',coordinates:[5,10]},
    {date:'2026-10-26T12:00:00Z',type:'Point',coordinates:[6,11]}]
});
const cems = () => ({
  mapping:{code:'EMSR123',name:'Test flood',activationTime:'2026-10-20T10:00:00',lastUpdate:'2026-10-21T10:00:00.123456',n_products:2},
  rapid:{code:'EMSR123',name:'Test flood',eventTime:'2026-10-20T09:00:00',activationTime:'2026-10-20T10:00:00',lastUpdate:'2026-10-22T10:00:00.456789',n_products:2},
  detail:{code:'EMSR123',name:'Test flood',activationTime:'2026-10-20T10:00:00',sensitive:false}
});

test('EONET references remain references, not independently counted sensors',() => {
  const result = evaluateEonetPair(eonet(),eonet());
  assert.equal(result.curatedEventCount,1);
  assert.equal(result.referenceCount,2);
  assert.equal(result.independentPhysicalObservations,'UNKNOWN');
  assert.deepEqual(result.lastLocation,{latitude:11,longitude:6});
});
test('an EONET reference change is shown for review and mismatched event IDs fail',() => {
  const changed = eonet();changed.sources.pop();
  assert.equal(evaluateEonetPair(eonet(),changed).state,'REVIEW_REFERENCE_CHANGE');
  changed.id='EONET_43';
  assert.throws(()=>evaluateEonetPair(eonet(),changed),/EONET_ID_MISMATCH/);
});
test('CEMS official API views retain differing update times without inventing a second activation',() => {
  const {mapping,rapid,detail} = cems();
  const result = evaluateCemsPair(mapping,rapid,detail);
  assert.equal(result.activationCount,1);
  assert.equal(result.state,'REVIEW_DIFFERENT_METADATA_UPDATES');
  assert.equal(result.mappingUpdateTime,'2026-10-21T10:00:00.123Z');
  assert.equal(result.sourceTimeInterpretation,'CEMS_UNZONED_FIELDS_INTERPRETED_AS_UTC_PER_PROVIDER_DOC');
  assert.equal(result.independentPhysicalObservations,'UNKNOWN');
});
test('CEMS rejects a sensitive detail or a different activation time',() => {
  const {mapping,rapid,detail}=cems();
  assert.throws(()=>evaluateCemsPair(mapping,rapid,{...detail,sensitive:true}),/CEMS_PUBLIC_ID_MISMATCH/);
  assert.throws(()=>evaluateCemsPair(mapping,{...rapid,activationTime:'2026-10-20T11:00:00'},detail),/CEMS_ACTIVATION_TIME_MISMATCH/);
});
