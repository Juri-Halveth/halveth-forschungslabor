import test from 'node:test';
import assert from 'node:assert/strict';
import {makePacket,decodePacket} from './packet.mjs';
import {decodeBrowserPacket} from './source-packet-browser.mjs';
test('browser and Node data consumers interpret the same source-bound indication',async()=>{
 const packet=makePacket('TEST',{commit:'a'.repeat(40),tree:'b'.repeat(40),coverage:'SYNTHETIC_TEST'},{value:[1,true,null]});
 assert.deepEqual(await decodeBrowserPacket(packet),decodePacket(packet));
});

test('both decoders reject malformed packet boundaries',async()=>{
 for(const edit of [p=>p.extra=true,p=>p.payloadByteLength++,p=>p.payloadBase64+=' ',p=>p.source.commit='HEAD']){
  const packet=makePacket('TEST',{commit:'a'.repeat(40),tree:'b'.repeat(40),coverage:'SYNTHETIC_TEST'},{value:1});
  edit(packet);assert.throws(()=>decodePacket(packet));await assert.rejects(()=>decodeBrowserPacket(packet));
 }
});
test('browser adapter rejects changed bytes and markup stays payload data',async()=>{
 const packet=makePacket('TEST',{commit:'a'.repeat(40),tree:'b'.repeat(40),coverage:'SYNTHETIC_TEST'},{text:'<script>inert source</script>'});
 assert.equal((await decodeBrowserPacket(packet)).text,'<script>inert source</script>');
 packet.payloadSha256='0'.repeat(64);await assert.rejects(()=>decodeBrowserPacket(packet));
});
