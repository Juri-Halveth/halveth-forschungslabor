import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AGENT_COUNT, STAGES, appendImpulse, applyImpulse, canonical, checksum,
  contentId, createGraph, createInitialState, createSession, macroProjection,
  projectEvent, replay, scopeCounterexample
} from './model.js';

test('graph has 100 distinct agents and 120 directed, typed sparse relations', () => {
  const graph = createGraph();
  assert.equal(graph.agentCount, AGENT_COUNT);
  assert.equal(graph.relations.length, 120);
  assert.equal(new Set(graph.relations.map(relation => relation.id)).size, 120);
  assert.equal(graph.relations.filter(relation => relation.type === 'RELAY').length, 100);
  assert.equal(graph.relations.filter(relation => relation.type === 'ECHO').length, 20);
  for (const relation of graph.relations) {
    assert.match(relation.from, /^A0\d\d$/);
    assert.match(relation.to, /^A0\d\d$/);
    assert.notEqual(relation.from, relation.to);
  }
});

test('initial state is deterministic, finite and depends on an explicit seed', () => {
  assert.equal(canonical(createInitialState(7)), canonical(createInitialState(7)));
  assert.notEqual(contentId(createInitialState(7)), contentId(createInitialState(8)));
  assert.equal(createInitialState(7).agents.length, 100);
  assert.throws(() => createInitialState(-1));
  assert.throws(() => createInitialState(100));
  assert.throws(() => createInitialState(1.5));
});

test('canonical JSON and checksum are stable under key order only', () => {
  assert.equal(canonical({ b: 2, a: { y: 4, x: 3 } }), canonical({ a: { x: 3, y: 4 }, b: 2 }));
  assert.equal(checksum({ b: 2, a: 1 }), checksum({ a: 1, b: 2 }));
  assert.notEqual(checksum({ a: 1 }), checksum({ a: 2 }));
  assert.throws(() => canonical({ bad: undefined }));
  assert.throws(() => canonical({ bad: Infinity }));
});

test('one impulse records state, transition, feedback, context and layer separately', () => {
  const initial = createInitialState(1);
  const { state, event } = applyImpulse(initial, createGraph(), 'A001', 1);
  assert.deepEqual(event.stages, STAGES);
  assert.equal(event.actorId, 'A001');
  assert.equal(event.beforeContentId, contentId(initial));
  assert.equal(event.afterContentId, contentId(state));
  assert.notEqual(event.beforeContentId, event.afterContentId);
  assert.equal(initial.agents[1].signal, 0);
  assert.equal(state.agents[1].signal, 2);
  assert.equal(event.feedback.relay, 'DELIVERED');
  assert.equal(state.agents[2].signal, 1);
  assert.equal(event.layer.low + event.layer.medium + event.layer.high, 100);
});

test('a closed context gate prevents relay but does not erase the impulse', () => {
  const initial = createInitialState(0);
  const { state, event } = applyImpulse(initial, createGraph(), 'A000', 1);
  assert.equal(initial.agents[0].gate, 0);
  assert.equal(event.feedback.relay, 'BLOCKED_BY_CONTEXT');
  assert.equal(state.agents[0].signal, 4);
  assert.equal(state.agents[1].signal, initial.agents[1].signal);
});

test('forward and anti projections share one event identity and both state references', () => {
  const { event } = applyImpulse(createInitialState(1), createGraph(), 'A001', 1);
  const forward = projectEvent(event, 'forward');
  const anti = projectEvent(event, 'anti');
  assert.equal(forward.eventId, anti.eventId);
  assert.equal(forward.beforeContentId, anti.beforeContentId);
  assert.equal(forward.afterContentId, anti.afterContentId);
  assert.notEqual(forward.headline, anti.headline);
  assert.throws(() => projectEvent(event, 'third'));
});

test('event identity is distinct from identical state content', () => {
  const state = createInitialState(1);
  const first = applyImpulse(state, createGraph(), 'A001', 1);
  const second = applyImpulse(state, createGraph(), 'A001', 2);
  assert.equal(contentId(first.state), contentId(second.state));
  assert.notEqual(first.event.eventId, second.event.eventId);
});

test('append-only timeline replays to the bound final snapshot', () => {
  const one = appendImpulse(createSession(1), 'A001');
  const two = appendImpulse(one, 'A005');
  const three = appendImpulse(two, 'A020');
  assert.equal(one.events.length, 1);
  assert.equal(two.events.length, 2);
  assert.equal(three.events.length, 3);
  assert.equal(one.states.length, 2);
  assert.equal(two.states.length, 3);
  assert.equal(three.states.length, 4);
  assert.equal(three.events[1].parentEventId, three.events[0].eventId);
  assert.deepEqual(replay(three), {
    ok: true, steps: 3, finalContentId: contentId(three.states.at(-1)), lastEventId: three.events.at(-1).eventId
  });
});

test('replay detects event, graph and state tampering', () => {
  const session = appendImpulse(createSession(1), 'A001');
  const eventTamper = structuredClone(session);
  eventTamper.events[0].feedback.relay = 'DELIVERED_BUT_CHANGED';
  assert.equal(replay(eventTamper).reason, 'EVENT_MISMATCH');
  const stateTamper = structuredClone(session);
  stateTamper.states[1].agents[2].signal = 3;
  assert.equal(replay(stateTamper).reason, 'STATE_MISMATCH');
  const graphTamper = structuredClone(session);
  graphTamper.graph.relations[0].to = 'A050';
  assert.equal(replay(graphTamper).reason, 'INVALID_SESSION');
});

test('the macro view counterexample is equal now and divergent after the same impulse', () => {
  const example = scopeCounterexample();
  assert.equal(example.counterexample, true);
  assert.deepEqual(example.macroBeforeOpen, example.macroBeforeBlocked);
  assert.notDeepEqual(example.macroAfterOpen, example.macroAfterBlocked);
  assert.equal(example.macroAfterOpen.totalSignal - example.macroAfterBlocked.totalSignal, 1);
  assert.equal(example.hiddenDifference.field, 'gate');
});

test('invalid actor, state and sequence are rejected before a transition', () => {
  const graph = createGraph();
  const state = createInitialState();
  assert.throws(() => applyImpulse(state, graph, 'A999', 1));
  assert.throws(() => applyImpulse(state, graph, 'A000', 0));
  assert.throws(() => applyImpulse(state, graph, 'A000', 10000));
  assert.throws(() => applyImpulse({ ...state, agents: state.agents.slice(1) }, graph, 'A000', 1));
  assert.deepEqual(macroProjection(state), macroProjection(createInitialState()));
});

test('state validator rejects hidden, extra and accessor fields before they can be lost', () => {
  const graph = createGraph();
  const extra = createInitialState();
  extra.agents[0].secret = 'would be dropped by a plain spread';
  assert.throws(() => applyImpulse(extra, graph, 'A000', 1), /Unexpected fields/);

  const accessor = createInitialState();
  Object.defineProperty(accessor.agents[0], 'signal', { enumerable: true, get: () => 0 });
  assert.throws(() => applyImpulse(accessor, graph, 'A000', 1), /Accessor/);

  const hidden = createInitialState();
  Object.defineProperty(hidden, 'hiddenContext', { value: 1 });
  assert.throws(() => applyImpulse(hidden, graph, 'A000', 1), /Unexpected fields/);

  const sparse = createInitialState();
  delete sparse.agents[10];
  assert.throws(() => applyImpulse(sparse, graph, 'A000', 1), /exactly 100 agents/);
});

test('a forward transition can collapse distinct pre-states, so replay is not inversion', () => {
  const graph = createGraph();
  const beforeThree = createInitialState(1);
  beforeThree.agents[1].signal = 3;
  beforeThree.agents[1].gate = 1;
  const beforeFour = structuredClone(beforeThree);
  beforeFour.agents[1].signal = 4;
  const transitionThree = applyImpulse(beforeThree, graph, 'A001', 1);
  const transitionFour = applyImpulse(beforeFour, graph, 'A001', 1);
  assert.notEqual(contentId(beforeThree), contentId(beforeFour));
  assert.equal(contentId(transitionThree.state), contentId(transitionFour.state));
  assert.notEqual(transitionThree.event.beforeContentId, transitionFour.event.beforeContentId);
  assert.equal(transitionThree.event.afterContentId, transitionFour.event.afterContentId);
});
