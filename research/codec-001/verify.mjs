// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Juri. Developed with AI assistance.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

export const PAYLOAD = Object.freeze([
  'README.md', 'RESEARCH_PLAN.md', 'RIGHTS.md', 'SOURCES.json', 'verify.mjs',
]);
const root = path.dirname(fileURLToPath(import.meta.url));

// Reads only the fixed dossier payload. A manifest cannot add arbitrary paths.
export function verifyAnchor(anchor, read = (name) => readFileSync(path.join(root, name))) {
  if (!anchor || anchor.schema !== 'halveth.codec-publication-anchor.v1' ||
      anchor.version !== '1.0.1' || anchor.dataLicense !== 'CC0-1.0' ||
      anchor.timeSource !== 'LOCAL_SYSTEM_CLOCK_NOT_INDEPENDENT_TIMESTAMP' ||
      !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(anchor.recordedAt) ||
      !Number.isFinite(Date.parse(anchor.recordedAt)) ||
      !/^[a-f0-9]{40}$/.test(anchor.baseCommit) ||
      anchor.projectLead !== 'Juri' || anchor.projectName !== 'HALVETH' ||
      anchor.supersedes?.commit !== 'ffc3ed6b38424ddfe8a0b9e7914359739bb0512b' ||
      anchor.supersedes?.anchorSha256 !== '178f419675bc589c11c1af4a19c97a687f02deb984086ef3b4ebb6685c6d1a41') {
    throw new Error('Invalid publication-anchor metadata');
  }
  if (!Array.isArray(anchor.files) || anchor.files.length !== PAYLOAD.length) {
    throw new Error('Unexpected payload count');
  }
  // Validate the whole list before invoking any reader.
  for (let i = 0; i < PAYLOAD.length; i++) {
    const item = anchor.files[i];
    if (!item || item.path !== PAYLOAD[i] || !Number.isSafeInteger(item.bytes) ||
        item.bytes < 0 || !/^[a-f0-9]{64}$/.test(item.sha256)) {
      throw new Error('Invalid fixed payload entry');
    }
  }
  for (const item of anchor.files) {
    const bytes = read(item.path);
    if (!Buffer.isBuffer(bytes) || bytes.length !== item.bytes ||
        createHash('sha256').update(bytes).digest('hex') !== item.sha256) {
      throw new Error(`Payload differs: ${item.path}`);
    }
  }
  return { matchedFiles: PAYLOAD.length, evidence: 'BYTES_MATCH_THIS_MANIFEST' };
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const anchor = JSON.parse(readFileSync(path.join(root, 'ANCHOR.json'), 'utf8'));
  console.log(JSON.stringify(verifyAnchor(anchor)));
}
