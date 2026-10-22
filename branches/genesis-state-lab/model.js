// GENESIS is a finite, synthetic state model. The 64-bit checksum is for
// reproducible replay, not authentication, authorship or external evidence.
export const AGENT_COUNT = 100;
export const STAGES = Object.freeze(['STATE', 'TRANSITION', 'FEEDBACK', 'CONTEXT', 'LAYER']);
const MAX_SIGNAL = 4;
const FNV_OFFSET = 0xcbf29ce484222325n;
const FNV_PRIME = 0x100000001b3n;
const MASK_64 = 0xffffffffffffffffn;

function exactRecord(value, keys, label) {
  if (!value || typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype) throw new TypeError(`Invalid ${label}`);
  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.length !== keys.length || keys.some(key => !ownKeys.includes(key))) throw new TypeError(`Unexpected fields in ${label}`);
  for (const key of ownKeys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !Object.hasOwn(descriptor, 'value')) throw new TypeError(`Accessor in ${label}`);
  }
}

function plain(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (Array.isArray(value)) {
    if (Object.keys(value).length !== value.length || Reflect.ownKeys(value).length !== value.length + 1) throw new TypeError('Sparse or extended arrays are unsupported');
    for (let index = 0; index < value.length; index += 1) {
      if (!Object.hasOwn(Object.getOwnPropertyDescriptor(value, index) ?? {}, 'value')) throw new TypeError('Array accessors are unsupported');
    }
    return value.map(plain);
  }
  if (typeof value === 'object' && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)) {
    if (Reflect.ownKeys(value).length !== Object.keys(value).length) throw new TypeError('Symbols or non-enumerable fields are unsupported');
    return Object.fromEntries(Object.keys(value).sort().map(key => {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!Object.hasOwn(descriptor ?? {}, 'value')) throw new TypeError('Object accessors are unsupported');
      return [key, plain(descriptor.value)];
    }));
  }
  throw new TypeError('Only finite plain JSON values are supported');
}

export function canonical(value) {
  return JSON.stringify(plain(value));
}

export function checksum(value) {
  const bytes = new TextEncoder().encode(typeof value === 'string' ? value : canonical(value));
  let hash = FNV_OFFSET;
  for (const byte of bytes) hash = ((hash ^ BigInt(byte)) * FNV_PRIME) & MASK_64;
  return hash.toString(16).padStart(16, '0');
}

const agentId = index => `A${String(index).padStart(3, '0')}`;

export function createGraph() {
  const relations = [];
  for (let index = 0; index < AGENT_COUNT; index += 1) {
    relations.push({ id: `R${String(index).padStart(3, '0')}`, type: 'RELAY', from: agentId(index), to: agentId((index + 1) % AGENT_COUNT) });
  }
  for (let index = 0; index < 20; index += 1) {
    const from = index * 5;
    relations.push({ id: `E${String(index).padStart(3, '0')}`, type: 'ECHO', from: agentId(from), to: agentId((from + 37) % AGENT_COUNT) });
  }
  return { schema: 'genesis.graph.v1', agentCount: AGENT_COUNT, relations };
}

export function createInitialState(seed = 0) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 99) throw new TypeError('seed must be an integer from 0 to 99');
  return {
    schema: 'genesis.state.v1',
    agents: Array.from({ length: AGENT_COUNT }, (_, index) => ({
      id: agentId(index),
      signal: index % 11 === 0 ? 2 : index % 5 === 0 ? 1 : 0,
      gate: (index + seed) % 7 === 0 ? 0 : 1
    }))
  };
}

export function contentId(state) {
  validateState(state);
  return `S-${checksum(state)}`;
}

export function validateState(state) {
  exactRecord(state, ['schema', 'agents'], 'state');
  if (state.schema !== 'genesis.state.v1' || !Array.isArray(state.agents) || state.agents.length !== AGENT_COUNT || Object.keys(state.agents).length !== AGENT_COUNT || Reflect.ownKeys(state.agents).length !== AGENT_COUNT + 1) {
    throw new TypeError('Expected one Genesis state with exactly 100 agents');
  }
  state.agents.forEach((agent, index) => {
    exactRecord(agent, ['id', 'signal', 'gate'], `agent ${index}`);
    if (agent?.id !== agentId(index) || !Number.isInteger(agent.signal) || agent.signal < 0 || agent.signal > MAX_SIGNAL || ![0, 1].includes(agent.gate)) {
      throw new TypeError(`Invalid agent at index ${index}`);
    }
  });
  return state;
}

export function macroProjection(state) {
  validateState(state);
  return {
    totalSignal: state.agents.reduce((sum, agent) => sum + agent.signal, 0),
    activeAgents: state.agents.filter(agent => agent.signal > 0).length,
    saturatedAgents: state.agents.filter(agent => agent.signal === MAX_SIGNAL).length
  };
}

function layerSummary(state) {
  const low = state.agents.filter(agent => agent.signal <= 1).length;
  const medium = state.agents.filter(agent => agent.signal === 2 || agent.signal === 3).length;
  return { low, medium, high: AGENT_COUNT - low - medium };
}

function indexOf(id) {
  if (typeof id !== 'string' || !/^A\d{3}$/.test(id)) throw new TypeError('Invalid agent ID');
  const index = Number(id.slice(1));
  if (index >= AGENT_COUNT) throw new TypeError('Agent ID outside the model');
  return index;
}

export function applyImpulse(state, graph, actorId, sequence, parentEventId = null) {
  validateState(state);
  if (canonical(graph) !== canonical(createGraph())) throw new TypeError('Graph does not match Genesis v1');
  if (!Number.isSafeInteger(sequence) || sequence < 1 || sequence > 9999) throw new TypeError('Invalid sequence');
  if (parentEventId !== null && (typeof parentEventId !== 'string' || !/^EV-\d{4}-[a-f0-9]{16}$/.test(parentEventId))) {
    throw new TypeError('Invalid parent event ID');
  }
  const actorIndex = indexOf(actorId);
  const relay = graph.relations[actorIndex];
  const echo = graph.relations.find(relation => relation.type === 'ECHO' && relation.from === actorId) ?? null;
  const beforeActor = state.agents[actorIndex];
  const next = { schema: state.schema, agents: state.agents.map(agent => ({ ...agent })) };
  next.agents[actorIndex].signal = Math.min(MAX_SIGNAL, beforeActor.signal + 2);

  const usedRelations = [relay.id];
  let relayStatus = 'BLOCKED_BY_CONTEXT';
  if (beforeActor.gate === 1) {
    const recipient = next.agents[indexOf(relay.to)];
    recipient.signal = Math.min(MAX_SIGNAL, recipient.signal + 1);
    relayStatus = 'DELIVERED';
  }

  let echoStatus = 'INACTIVE';
  if (echo && next.agents[actorIndex].signal >= 3) {
    const recipient = next.agents[indexOf(echo.to)];
    recipient.gate = 1 - recipient.gate;
    usedRelations.push(echo.id);
    echoStatus = 'CONTEXT_FLIPPED';
  }
  if (next.agents[actorIndex].signal === MAX_SIGNAL) next.agents[actorIndex].gate = 0;

  const graphId = `G-${checksum(graph)}`;
  const beforeContentId = contentId(state);
  const afterContentId = contentId(next);
  const payload = {
    schema: 'genesis.event.v1', sequence, parentEventId, actorId, graphId,
    beforeContentId, afterContentId, usedRelations,
    feedback: { relay: relayStatus, echo: echoStatus },
    context: { gateBefore: beforeActor.gate, gateAfter: next.agents[actorIndex].gate },
    layer: layerSummary(next),
    stages: [...STAGES]
  };
  const event = { ...payload, eventId: `EV-${String(sequence).padStart(4, '0')}-${checksum(payload)}` };
  return { state: next, event };
}

export function createSession(seed = 0) {
  const graph = createGraph();
  const initialState = createInitialState(seed);
  return { schema: 'genesis.session.v1', graph, initialState, states: [initialState], events: [] };
}

export function appendImpulse(session, actorId) {
  if (session?.schema !== 'genesis.session.v1' || !Array.isArray(session.events) || !Array.isArray(session.states) || session.states.length !== session.events.length + 1) {
    throw new TypeError('Invalid session');
  }
  const result = applyImpulse(session.states.at(-1), session.graph, actorId, session.events.length + 1, session.events.at(-1)?.eventId ?? null);
  return { ...session, states: [...session.states, result.state], events: [...session.events, result.event] };
}

export function replay(session) {
  try {
    if (session?.schema !== 'genesis.session.v1' || canonical(session.graph) !== canonical(createGraph()) || !Array.isArray(session.states) || !Array.isArray(session.events) || session.states.length !== session.events.length + 1) {
      return { ok: false, at: 0, reason: 'INVALID_SESSION' };
    }
    let state = validateState(session.initialState);
    if (canonical(state) !== canonical(session.states[0])) return { ok: false, at: 0, reason: 'INITIAL_SNAPSHOT_MISMATCH' };
    let parentEventId = null;
    for (let index = 0; index < session.events.length; index += 1) {
      const supplied = session.events[index];
      const expected = applyImpulse(state, session.graph, supplied.actorId, index + 1, parentEventId);
      if (canonical(expected.event) !== canonical(supplied)) return { ok: false, at: index + 1, reason: 'EVENT_MISMATCH' };
      if (canonical(expected.state) !== canonical(session.states[index + 1])) return { ok: false, at: index + 1, reason: 'STATE_MISMATCH' };
      state = expected.state;
      parentEventId = expected.event.eventId;
    }
    return { ok: true, steps: session.events.length, finalContentId: contentId(state), lastEventId: parentEventId };
  } catch {
    return { ok: false, at: null, reason: 'INVALID_RECORD' };
  }
}

export function projectEvent(event, perspective = 'forward') {
  if (event?.schema !== 'genesis.event.v1' || !['forward', 'anti'].includes(perspective)) throw new TypeError('Invalid event projection');
  const relayIndex = Number(event.actorId.slice(1));
  const recipient = agentId((relayIndex + 1) % AGENT_COUNT);
  return {
    perspective,
    eventId: event.eventId,
    beforeContentId: event.beforeContentId,
    afterContentId: event.afterContentId,
    headline: perspective === 'forward' ? `${event.actorId} sendet einen Impuls` : `${recipient} liest denselben Impuls von der Gegenseite`,
    detail: event.feedback.relay === 'DELIVERED'
      ? perspective === 'forward' ? `Relation ${event.usedRelations[0]} trägt ein Signal zu ${recipient}.` : `${recipient} empfängt ein Signal über ${event.usedRelations[0]}.`
      : perspective === 'forward' ? `Der Kontext von ${event.actorId} hält die Weitergabe zurück.` : `${recipient} empfängt in diesem Ereignis kein Signal.`
  };
}

export function scopeCounterexample() {
  const graph = createGraph();
  const base = { schema: 'genesis.state.v1', agents: Array.from({ length: AGENT_COUNT }, (_, index) => ({ id: agentId(index), signal: 0, gate: 1 })) };
  const blocked = { schema: base.schema, agents: base.agents.map(agent => ({ ...agent })) };
  blocked.agents[0].gate = 0;
  const openResult = applyImpulse(base, graph, 'A000', 1);
  const blockedResult = applyImpulse(blocked, graph, 'A000', 1);
  return {
    macroBeforeOpen: macroProjection(base), macroBeforeBlocked: macroProjection(blocked),
    macroAfterOpen: macroProjection(openResult.state), macroAfterBlocked: macroProjection(blockedResult.state),
    hiddenDifference: { agentId: 'A000', field: 'gate', open: 1, blocked: 0 },
    input: 'IMPULSE A000',
    counterexample: canonical(macroProjection(base)) === canonical(macroProjection(blocked)) && canonical(macroProjection(openResult.state)) !== canonical(macroProjection(blockedResult.state))
  };
}
