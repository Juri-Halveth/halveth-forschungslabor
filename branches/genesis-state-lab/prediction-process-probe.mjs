// Two one-shot local commands. Generate exits before a separate process evaluates.
// The output is a synthetic model receipt, never an external observation.
import { applyImpulse, canonical, contentId, createGraph, createInitialState } from './model.js';
import { evaluateMacroPrediction, predictMacro } from './prediction-audit.js';

const [command, mode, ...rest] = process.argv.slice(2);
const seed = 1;
const actorId = 'A000';
const before = createInitialState(seed);

async function readCandidate(stream) {
  const maxLineBytes = 8192;
  const chunks = [];
  let size = 0;
  for await (const chunk of stream) {
    size += chunk.length;
    if (size > maxLineBytes + 2) throw new TypeError('Expected one bounded candidate line');
    chunks.push(chunk);
  }
  if (!size) throw new TypeError('Candidate is not bound to this synthetic input');
  const text = new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks, size));
  const line = text.replace(/\r\n$|[\r\n]$/, '');
  if (/[\r\n]/.test(line) || Buffer.byteLength(line, 'utf8') > maxLineBytes) {
    throw new TypeError('Expected one bounded candidate line');
  }
  return JSON.parse(line);
}

if (command === 'generate' && mode === undefined && rest.length === 0) {
  process.stdout.write(`${canonical(predictMacro(before, actorId))}\n`);
} else if (command === 'evaluate' && ['pending', 'matching', 'differing'].includes(mode) && rest.length === 0) {
  const record = await readCandidate(process.stdin);
  if (record?.actorId !== actorId || record.beforeContentId !== contentId(before)) {
    throw new TypeError('Candidate is not bound to this synthetic input');
  }
  let observedState = null;
  if (mode !== 'pending') {
    observedState = applyImpulse(before, createGraph(), actorId, 1).state;
    if (mode === 'differing') {
      observedState = structuredClone(observedState);
      observedState.agents[0].signal -= 1;
    }
  }
  const evaluation = evaluateMacroPrediction(record, observedState);
  process.stdout.write(`${canonical({ candidateFingerprint: record.fingerprint, evaluation })}\n`);
} else {
  throw new TypeError('Usage: generate OR evaluate pending|matching|differing');
}
