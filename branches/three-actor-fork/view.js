import { evaluateFork } from './model.js';

const $ = (id) => document.getElementById(id);
const scene = $('scene');
let entered = false;

function showEntry() {
  entered = true;
  scene.classList.add('entered');
  $('enter-button').disabled = true;
  $('enter-button').textContent = 'C ist eingetreten';
  $('response-controls').hidden = false;
  $('step-label').textContent = 'DRITTER WEG · 1 / 2';
  $('stage-message').textContent = 'C eröffnet einen eigenen Pfad. Jetzt reagieren A und B.';
  $('scene-title').textContent = 'Drei Wege sind sichtbar';
  $('scene-desc').textContent = 'A und B konkurrieren. C ist aus der unteren Position in die Lücke eingetreten und bleibt eigenständig.';
}

function evaluate() {
  if (!entered) return;
  const a = $('a-response').value;
  const b = $('b-response').value;
  const result = evaluateFork({ entry: true, a, b });
  scene.classList.toggle('a-cooperates', a === 'kooperiert');
  scene.classList.toggle('b-cooperates', b === 'kooperiert');
  scene.classList.toggle('a-blocks', a === 'blockiert');
  scene.classList.toggle('b-blocks', b === 'blockiert');
  $('step-label').textContent = 'FOLGEZUG · 2 / 2';
  $('stage-message').textContent = result.title;
  $('result-title').textContent = result.title;
  $('result-detail').textContent = result.detail;
  $('next-question').textContent = result.nextQuestion;
  $('result').hidden = false;
  $('scene-desc').textContent = `A reagiert: ${a}. B reagiert: ${b}. ${result.detail}`;
  $('result').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'nearest' });
}

function reset() {
  entered = false;
  scene.className.baseVal = '';
  $('enter-button').disabled = false;
  $('enter-button').innerHTML = 'C eintreten lassen <span aria-hidden="true">↗</span>';
  $('response-controls').hidden = true;
  $('result').hidden = true;
  $('a-response').value = 'offen';
  $('b-response').value = 'offen';
  $('step-label').textContent = 'AUSGANGSLAGE · 0 / 2';
  $('stage-message').textContent = 'A und B besetzen das Spielfeld. C ist noch nicht eingetreten.';
  $('scene-title').textContent = 'A und B mit offenem Raum für C';
  $('scene-desc').textContent = 'Zunächst stehen A und B im Konflikt. C kann einen eigenständigen dritten Weg eröffnen.';
  $('title').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
}

$('enter-button').addEventListener('click', showEntry);
$('evaluate-button').addEventListener('click', evaluate);
$('reset-button').addEventListener('click', reset);
