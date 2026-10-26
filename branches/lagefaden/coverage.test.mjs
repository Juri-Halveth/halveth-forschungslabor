// SPDX-License-Identifier: MIT
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {buildSourceCoverage,buildCoverageMatrix,unavailableSource,classifyCoverage,coverageDefinitions} from './coverage.mjs';

const ids=['USGS','EONET','CEMS'];
const bytes=Object.fromEntries(await Promise.all(ids.map(async id=>[id,new Uint8Array(await fs.readFile(new URL('data/'+(id==='USGS'?'usgs':id==='EONET'?'eonet':'cems')+'-example.json',import.meta.url)))])));
const columns=await Promise.all(ids.map(id=>buildSourceCoverage(id,bytes[id])));
const matrix=buildCoverageMatrix(columns);
const cell=(question,source)=>matrix.rows.find(row=>row.question===question).cells.find(c=>c.sourceId===source);

test('matrix binds all 22 dimensions and 66 cells to separate source cases and exact snapshot bytes',()=>{
  assert.equal(matrix.rows.length,22);
  assert.equal(new Set(matrix.rows.map(row=>row.id)).size,22);
  assert.equal(matrix.rows.reduce((n,row)=>n+row.cells.length,0),66);
  assert.equal(matrix.comparison,'ANSWER_SCOPE_COMPARISON');
  assert.equal(matrix.crossCatalogEventIdentity,'NOT_EVALUATED');
  assert.equal(new Set(matrix.sources.map(source=>source.caseId)).size,3);
  for(const source of matrix.sources) {
    assert.equal(source.snapshotReceipt.sha256,createHash('sha256').update(bytes[source.id]).digest('hex'));
    assert.equal(source.snapshotReceipt.bytes,bytes[source.id].length);
    assert.equal(cell('WAS?',source.id).answer.value.includes(source.title),true);
    assert.equal(cell('WAS?',source.id).state,'DOCUMENTED');
  }
});

test('stored location fields remain asymmetric: USGS title, EONET points, CEMS country/title',()=>{
  const fact=(id,key)=>columns.find(c=>c.id===id).facts[key];
  assert.equal(fact('USGS','locationText').state,'DATA');
  assert.equal(fact('USGS','coordinates').state,'UNKNOWN');
  assert.equal(fact('EONET','coordinates').state,'DATA');
  assert.equal(fact('EONET','locationText').state,'UNKNOWN');
  assert.equal(fact('CEMS','locationText').state,'DATA');
  assert.equal(fact('CEMS','coordinates').state,'UNKNOWN');
  assert.ok(matrix.contrast.some(f=>f.id==='coordinates'));
  assert.ok(matrix.contrast.some(f=>f.id==='locationText'));
  for(const id of ids)assert.equal(cell('WO?',id).state,'PARTIAL');
});

test('direct catalog facts, computed intervals and application design have distinct coverage',()=>{
  assert.equal(cell('WANN?','USGS').state,'DOCUMENTED');
  assert.equal(cell('WANN?','EONET').state,'PARTIAL');
  assert.equal(cell('WANN?','CEMS').state,'PARTIAL');
  for(const id of ids) {
    assert.equal(cell('WARUM?',id).state,'UNKNOWN');
    assert.equal(cell('WEN?',id).state,'UNKNOWN');
    assert.equal(cell('WIE LANGE?',id).state,'PARTIAL');
    assert.equal(cell('WOHIN?',id).state,'PARTIAL');
    assert.equal(cell('WOHIN?',id).facets[0].state,'DESIGN');
    assert.equal(cell('WESHALB?',id).facets[0].state,'DERIVED');
    assert.equal(cell('WIE SICHER?',id).state,'PARTIAL');
  }
});

test('unknown union and shared gaps preserve facet scope; known inventory retains source/case',()=>{
  assert.equal(matrix.commonGapStatus,'ASSESSED_FOR_THREE_STORED_CASES');
  for(const key of ['sensorIdentity','independentCount','cause','affected','revisionHistory']) {
    assert.ok(matrix.sharedUnknown.some(f=>f.id===key));
    assert.deepEqual(matrix.anyUnknown.find(f=>f.id===key).sources,ids);
  }
  assert.deepEqual(matrix.anyUnknown.find(f=>f.id==='catalogUpdate').sources,['EONET']);
  assert.equal(matrix.sharedUnknown.some(f=>f.id==='catalogUpdate'),false);
  for(const fact of matrix.answerInventory) {
    assert.notEqual(fact.state,'UNKNOWN');
    assert.equal(fact.caseId,matrix.sources.find(s=>s.id===fact.sourceId).caseId);
    assert.ok(fact.evidence.length>0);
  }
});

test('a source outage never becomes a measured universal blind spot or a healthy all-empty result',()=>{
  const partial=buildCoverageMatrix([columns[0],unavailableSource('EONET'),columns[2]]);
  assert.equal(partial.commonGapStatus,'INCOMPLETE_SOURCE_COVERAGE');
  assert.deepEqual(partial.sharedUnknown,[]);
  assert.ok(partial.rows.every(r=>r.cells[1].state==='UNAVAILABLE'));
  assert.ok(partial.answerInventory.every(f=>f.sourceId!=='EONET'));
  const empty=buildCoverageMatrix(ids.map(id=>unavailableSource(id)));
  assert.equal(empty.commonGapStatus,'INCOMPLETE_SOURCE_COVERAGE');
  assert.deepEqual(empty.anyUnknown,[]);assert.deepEqual(empty.sharedUnknown,[]);assert.deepEqual(empty.answerInventory,[]);
});

test('classification is structural, rejects unknown states, and cannot promote a derived/design answer',()=>{
  assert.equal(classifyCoverage([{state:'DATA'},{state:'RECEIPT'}]),'DOCUMENTED');
  assert.equal(classifyCoverage([{state:'DATA'},{state:'UNKNOWN'}]),'PARTIAL');
  assert.equal(classifyCoverage([{state:'DERIVED'}]),'PARTIAL');
  assert.equal(classifyCoverage([{state:'DESIGN'}]),'PARTIAL');
  assert.equal(classifyCoverage([{state:'UNKNOWN'}]),'UNKNOWN');
  assert.throws(()=>classifyCoverage([]),/INVALID_COVERAGE/);
  assert.throws(()=>classifyCoverage([{state:'TRUST_ME'}]),/INVALID_COVERAGE/);
  assert.throws(()=>buildCoverageMatrix([columns[0],columns[0],columns[2]]),/DUPLICATE/);
  assert.throws(()=>buildCoverageMatrix(columns.slice(0,2)),/INCOMPLETE/);
  assert.throws(()=>unavailableSource('OTHER'),/UNKNOWN_SOURCE/);
  assert.throws(()=>unavailableSource('toString'),/UNKNOWN_SOURCE/);
  assert.throws(()=>unavailableSource('USGS','PRESENT'),/INVALID_AVAILABILITY/);
});

test('invalid source receipts and changed evaluations fail before entering the comparison',async()=>{
  const encode=value=>new TextEncoder().encode(JSON.stringify(value));
  for(const edit of [s=>s.feed.sha256='bad',s=>s.feed.url='https://other.example/',s=>s.evaluation.state='SAME_WORLD_EVENT']) {
    const changed=JSON.parse(new TextDecoder().decode(bytes.USGS));edit(changed);
    await assert.rejects(()=>buildSourceCoverage('USGS',encode(changed)));
  }
  await assert.rejects(()=>buildSourceCoverage('USGS',new Uint8Array([0xff])),/encoded data/);
  await assert.rejects(()=>buildSourceCoverage('USGS',new Uint8Array(0)),/INVALID_SNAPSHOT_BYTES/);
});

test('source records and the definition registry remain unchanged by comparison and export',()=>{
  const before=JSON.stringify(columns);
  const definitionBefore=JSON.stringify(coverageDefinitions);
  const result=buildCoverageMatrix([...columns].reverse());
  assert.deepEqual(result.sources.map(s=>s.id),ids);
  JSON.stringify(result);
  assert.equal(JSON.stringify(columns),before);
  assert.equal(JSON.stringify(coverageDefinitions),definitionBefore);
});
