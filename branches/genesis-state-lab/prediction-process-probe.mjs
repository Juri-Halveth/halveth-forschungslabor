// Two one-shot local commands. Generate exits before a separate process evaluates.
// The output is a synthetic model receipt, never an external observation.
import { createInterface } from 'node:readline';
import { applyImpulse, canonical, contentId, createGraph, createInitialState } from './model.js';
import { evaluateMacroPrediction, predictMacro } from './prediction-audit.js';

const [command, mode, ...rest] = process.argv.slice(2);
const seed = 1;
const actorId = 'A000';
const before = createInitialState(seed);

if (command === 'generate' && mode === undefined && rest.length === 0) {
  process.stdout.write(`${canonical(predictMacro(before, actorId))}\n`);
} else if (command === 'evaluate' && ['pending', 'matching', 'differing'].includes(mode) && rest.length === 0) {
  const input = createInterface({ input: process.stdin, crlfDelay: Infinity });
  let lineCount = 0;
  let record;
  for await (const line of input) {
    if (++lineCount !== 1 || Buffer.byteLength(line, 'utf8') > 8192) throw new TypeError('Expected one bounded candidate line');
    record = JSON.parse(line);
  }
  if (lineCount !== 1 || record.actorId !== actorId || record.beforeContentId !== contentId(before)) {
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
