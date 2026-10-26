// Node-only persistence for already explicit local checkpoint paths.
// Atomic link/rename publication depends on the filesystem. File sync is requested;
// directory sync is best effort, and neither is a universal power-loss guarantee.
import fs from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { JSON_CONTRACT, parseJsonData } from './json-data.mjs';

export const MAX_CHECKPOINT_BYTES = 16 * 1024 * 1024;
const writes = new Map();
const noFollow = constants.O_NOFOLLOW || 0;
const nonBlock = constants.O_NONBLOCK || 0;
const sameId = (a, b) => a.dev === b.dev && a.ino === b.ino;
const sameFile = (a, b) => sameId(a, b) && a.size === b.size &&
  a.mtimeNs === b.mtimeNs && a.ctimeNs === b.ctimeNs;
const pathKey = value => process.platform === 'win32' ? value.toLowerCase() : value;
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
function failure(code, message) {
  const error = new Error(message); error.code = code; return error;
}

function explicitPath(value) {
  if (typeof value !== 'string' || !value || value.includes('\0') || !path.isAbsolute(value)) {
    throw new TypeError('An explicit absolute checkpoint file path is required');
  }
  if (value.endsWith(path.sep)) throw new TypeError('A checkpoint file path is required');
  const result = path.normalize(value), parsed = path.parse(result);
  if (!parsed.base || result === parsed.root) throw new TypeError('A checkpoint file path is required');
  if (process.platform === 'win32') {
    // Avoid UNC/device namespaces, alternate data streams and Win32 name aliases.
    if (!/^[a-z]:\\$/i.test(parsed.root)) throw new TypeError('An ordinary local drive path is required');
    const parts = result.slice(parsed.root.length).split(path.sep);
    if (parts.some(part => /[:<>"|?*]/.test(part) || /[. ]$/.test(part) ||
      /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part))) {
      throw new TypeError('Unsupported checkpoint path component');
    }
  }
  return result;
}
// Shared by the separate Node registry adapter. Validation happens before any
// filesystem call, including UNC/device paths that could leave the local host.
export { explicitPath as explicitLocalFilePath };

function writeOptions(options) {
  if (!options || Object.getPrototypeOf(options) !== Object.prototype ||
    Object.getOwnPropertySymbols(options).length) throw new TypeError('Plain checkpoint options required');
  const descriptors = Object.getOwnPropertyDescriptors(options);
  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (key !== 'overwrite' || !Object.hasOwn(descriptor, 'value') ||
      typeof descriptor.value !== 'boolean') throw new TypeError('Only boolean overwrite is supported');
  }
  return descriptors.overwrite?.value ?? false;
}

function validateText(text) {
  if (typeof text !== 'string') throw new TypeError('Checkpoint text must be a string');
  if (text.length > MAX_CHECKPOINT_BYTES || Buffer.byteLength(text, 'utf8') > MAX_CHECKPOINT_BYTES) {
    throw new RangeError('Checkpoint exceeds the 16 MiB UTF-8 byte limit');
  }
  // Includes decoded duplicate keys, finite numbers, scalar Unicode and plain data.
  parseJsonData(text, { maxBytes: MAX_CHECKPOINT_BYTES });
  return Buffer.from(text, 'utf8');
}

async function parentGuard(filePath) {
  const parent = path.dirname(filePath), root = path.parse(parent).root;
  const chain = [], parts = parent.slice(root.length).split(path.sep).filter(Boolean);
  let current = root;
  for (const part of [null, ...parts]) {
    if (part !== null) current = path.join(current, part);
    const stat = await fs.lstat(current, { bigint: true });
    if (stat.isSymbolicLink()) throw failure('ELOOP', 'Checkpoint parent symlink/reparse link is unsupported');
    if (!stat.isDirectory()) throw failure('ENOTDIR', 'Checkpoint parent must already be a directory');
    chain.push({ path: current, stat });
  }
  if (pathKey(await fs.realpath(parent)) !== pathKey(parent)) {
    throw failure('ELOOP', 'Checkpoint parent redirects to another path');
  }
  return { parent, chain };
}

async function checkParents(guard) {
  for (const item of guard.chain) {
    const current = await fs.lstat(item.path, { bigint: true });
    if (current.isSymbolicLink() || !current.isDirectory() || !sameId(current, item.stat)) {
      throw failure('ERR_CHECKPOINT_PATH_CHANGED', 'Checkpoint parent changed during operation');
    }
  }
  if (pathKey(await fs.realpath(guard.parent)) !== pathKey(guard.parent)) {
    throw failure('ELOOP', 'Checkpoint parent redirects to another path');
  }
}

async function regularFile(filePath, allowMissing = false) {
  let stat;
  try { stat = await fs.lstat(filePath, { bigint: true }); }
  catch (error) { if (allowMissing && error.code === 'ENOENT') return null; throw error; }
  if (stat.isSymbolicLink()) throw failure('ELOOP', 'Checkpoint symlink/reparse link is unsupported');
  if (!stat.isFile()) throw failure('ERR_CHECKPOINT_NOT_FILE', 'Checkpoint must be a regular file');
  return stat;
}

// The read itself is capped even if a file grows after lstat/fstat.
async function boundedRead(filePath) {
  const beforePath = await regularFile(filePath);
  if (beforePath.size > BigInt(MAX_CHECKPOINT_BYTES)) throw new RangeError('Checkpoint exceeds 16 MiB');
  const handle = await fs.open(filePath, constants.O_RDONLY | noFollow | nonBlock);
  try {
    const before = await handle.stat({ bigint: true });
    if (!before.isFile() || !sameFile(beforePath, before)) {
      throw failure('ERR_CHECKPOINT_UNSTABLE', 'Checkpoint changed before bounded read');
    }
    if (before.size > BigInt(MAX_CHECKPOINT_BYTES)) throw new RangeError('Checkpoint exceeds 16 MiB');
    const chunks = []; let length = 0;
    while (length <= MAX_CHECKPOINT_BYTES) {
      const chunk = Buffer.allocUnsafe(Math.min(64 * 1024, MAX_CHECKPOINT_BYTES + 1 - length));
      const { bytesRead } = await handle.read(chunk, 0, chunk.length, null);
      if (!bytesRead) break;
      length += bytesRead;
      if (length > MAX_CHECKPOINT_BYTES) throw new RangeError('Checkpoint grew beyond 16 MiB');
      chunks.push(chunk.subarray(0, bytesRead));
    }
    const after = await handle.stat({ bigint: true });
    const afterPath = await regularFile(filePath);
    if (BigInt(length) !== before.size || !sameFile(before, after) || !sameFile(after, afterPath)) {
      throw failure('ERR_CHECKPOINT_UNSTABLE', 'Checkpoint changed during bounded read');
    }
    return Buffer.concat(chunks, length);
  } finally { await handle.close(); }
}

async function removeOwnTemp(tempPath, identity) {
  if (!tempPath) return 'NOT_CREATED';
  if (!identity) return 'UNVERIFIED_TEMP_RETAINED';
  try {
    const stat = await fs.lstat(tempPath, { bigint: true });
    if (stat.isSymbolicLink() || !stat.isFile() || !sameId(stat, identity)) return 'IDENTITY_CHANGED_RETAINED';
    await fs.unlink(tempPath); return 'REMOVED';
  } catch (error) { return error.code === 'ENOENT' ? 'ABSENT' : 'FAILED_' + error.code; }
}

async function syncDirectory(guard) {
  let handle;
  try {
    await checkParents(guard);
    handle = await fs.open(guard.parent, constants.O_RDONLY | noFollow | nonBlock);
    const stat = await handle.stat({ bigint: true });
    if (!stat.isDirectory() || !sameId(stat, guard.chain.at(-1).stat)) {
      throw failure('ERR_CHECKPOINT_PATH_CHANGED', 'Parent changed before directory sync');
    }
    await handle.sync(); return { directorySyncCompleted: true, directorySyncErrorCode: null };
  } catch (error) {
    // Publication already happened: report this limit instead of pretending rollback.
    return { directorySyncCompleted: false, directorySyncErrorCode: error.code ?? 'UNKNOWN' };
  } finally { if (handle) await handle.close().catch(() => {}); }
}

function receipt(filePath, bytes, operation) {
  return {
    schema: 'halveth.node-checkpoint-file.v1', jsonContract: JSON_CONTRACT,
    operation, path: filePath, sha256: digest(bytes), bytes: bytes.length,
    maxBytes: MAX_CHECKPOINT_BYTES, recordedAt: new Date().toISOString(),
    dataScope: 'DATA_ONLY_WITHIN_BOUND_CONSUMER',
    pathChecks: 'LSTAT_ANCESTORS_REALPATH_AND_FILE_HANDLE_IDENTITY',
    raceBoundary: 'Owned stable parent directories required; portable Node has no openat-style ancestor lock or cross-process compare-and-swap overwrite',
    durabilityBoundary: 'File sync requested on writes; filesystem/OS/device semantics and power-loss survival are not universally guaranteed'
  };
}

async function writeFile(filePath, bytes, overwrite) {
  const guard = await parentGuard(filePath);
  const initialTarget = await regularFile(filePath, true);
  if (initialTarget && !overwrite) throw failure('EEXIST', 'Checkpoint destination already exists');
  let tempPath = null, tempIdentity = null, handle = null, error = null;
  try {
    tempPath = path.join(guard.parent, '.halveth-checkpoint-' + randomUUID() + '.tmp');
    handle = await fs.open(tempPath, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | noFollow, 0o600);
    tempIdentity = await handle.stat({ bigint: true });
    if (!tempIdentity.isFile()) throw failure('ERR_CHECKPOINT_NOT_FILE', 'Temporary checkpoint is not regular');
    await handle.writeFile(bytes);
    await handle.sync();
    await handle.close(); handle = null;
    const reread = await boundedRead(tempPath);
    if (!reread.equals(bytes)) throw failure('ERR_CHECKPOINT_VERIFY', 'Temporary checkpoint bytes differ');
    await checkParents(guard);
    const current = await regularFile(filePath, true);
    if (initialTarget ? !current || !sameFile(initialTarget, current) : current !== null) {
      throw failure(current && !overwrite ? 'EEXIST' : 'ERR_CHECKPOINT_DESTINATION_CHANGED', 'Checkpoint destination changed before publication');
    }
    if (overwrite) {
      // Never unlink the accepted target first. Failure leaves it in place.
      await fs.rename(tempPath, filePath);
    } else {
      // No replacing rename fallback: unsupported links fail closed. A concurrent
      // creator wins or receives EEXIST, including creators in other processes.
      await fs.link(tempPath, filePath);
    }
  } catch (caught) { error = caught; }
  finally {
    if (handle) {
      try { await handle.close(); } catch (caught) { error ??= caught; }
    }
  }
  const tempCleanup = await removeOwnTemp(tempPath, tempIdentity);
  if (error) { error.tempCleanup = tempCleanup; throw error; }
  const directorySync = await syncDirectory(guard);
  return {
    ...receipt(filePath, bytes, 'WRITE'), overwrite,
    publication: overwrite ? 'RENAME_REPLACE' : 'EXCLUSIVE_LINK_NO_REPLACE',
    publicationConfirmed: true, replacedExisting: initialTarget !== null,
    fsyncRequested: true, fileSyncCompleted: true, directorySyncRequested: true,
    ...directorySync, tempCleanup
  };
}

export async function writeCheckpointFile(filePath, text, options = {}) {
  const target = explicitPath(filePath), overwrite = writeOptions(options);
  const bytes = validateText(text), key = pathKey(target);
  const previous = writes.get(key) ?? Promise.resolve();
  const operation = previous.catch(() => {}).then(() => writeFile(target, bytes, overwrite));
  writes.set(key, operation);
  try { return await operation; }
  finally { if (writes.get(key) === operation) writes.delete(key); }
}

export async function readCheckpointFile(filePath) {
  const target = explicitPath(filePath), guard = await parentGuard(target);
  const bytes = await boundedRead(target);
  await checkParents(guard);
  // Retain BOM as U+FEFF so JSON rejects it instead of silently changing bytes.
  const text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
  validateText(text);
  return { text, receipt: { ...receipt(target, bytes, 'READ'), fsyncRequested: false } };
}
