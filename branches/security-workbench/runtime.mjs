// SPDX-License-Identifier: MIT
import net from 'node:net';
import tls from 'node:tls';
import {brotliCompressSync,brotliDecompressSync} from 'node:zlib';
import {assessRuntime,inspectHost} from './core.mjs';

export function runtimeObservation(){
  return {schema:'halveth.security-workbench.runtime.v1',observedAt:new Date().toISOString(),
    observation:{node:process.version,brotli:process.versions.brotli,platform:process.platform,arch:process.arch},
    assessment:{...assessRuntime(process.version),evidence:'LOCAL_PROCESS_VERSION_OBSERVED'},
    limit:'Ein gestarteter Prozess. Keine automatische Inventur von Anwendungen, Containern oder laufenden Diensten.'};
}
export function identityObservation(raw){
  const inspection=inspectHost(raw);
  const certificate={subjectaltname:'DNS:127.0.0.1',subject:{CN:'127.0.0.1'}};
  let accepted=false,error=null;
  try{const result=tls.checkServerIdentity(raw,certificate);accepted=result===undefined;error=result?.code??null;}
  catch(e){error=e.code??e.name;}
  return {observedAt:new Date().toISOString(),node:process.version,inspection,
    netIsIP:net.isIP(raw),tlsDnsOnlyFixtureAccepted:accepted,tlsError:error,
    evidence:'LOCAL_NODE_APIS_WITH_SYNTHETIC_CERTIFICATE_OBJECT',
    limit:'Kein TLS-Handshake, kein vertrauenswürdiges Zertifikat, kein externer Endpoint. Ein API-Ergebnis ist keine belegte Verbindungsübernahme.'};
}
export function validBrotliRoundtrip(){
  const input=Buffer.from('A bounded, valid fixture.');
  const compressed=brotliCompressSync(input),decoded=brotliDecompressSync(compressed);
  return {inputBytes:input.length,compressedBytes:compressed.length,equal:input.equals(decoded),
    evidence:'VALID_LOCAL_BROTLI_ROUNDTRIP',limit:'Gültige Eingabe; kein Sicherheitstest für einen verwundbaren Decoder.'};
}
