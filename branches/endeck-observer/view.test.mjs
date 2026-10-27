// SPDX-License-Identifier: MIT
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import * as model from "./model.mjs";
import * as geometry from "./geometry.mjs";
import * as learning from "./learning.mjs";

// Execute the delivered view with its real imports and a minimal synthetic DOM.
// This tests frame scheduling and SVG data, not browser font/layout metrics.
function mountView(width, height) {
  class Element {
    constructor() { this.dataset = {}; this.attributes = {}; this.children = []; this.listeners = {}; }
    setAttribute(key, value) { this.attributes[key] = value; }
    append(...children) { this.children.push(...children); }
    replaceChildren(...children) { this.children = children; }
    addEventListener(event, callback) { this.listeners[event] = callback; }
    getBoundingClientRect() { return {width, height}; }
    dispatch(event) { this.listeners[event](); }
  }
  const elements = new Map(), frames = new Map();
  const element = id => { if (!elements.has(id)) elements.set(id, new Element()); return elements.get(id); };
  let sequence = 0;
  const document = {
    getElementById: element, createElementNS: () => new Element(), createElement: () => new Element(),
    documentElement: new Element(), addEventListener() {},
  };
  const view = readFileSync(new URL("view.mjs", import.meta.url), "utf8");
  runInNewContext(view.replace(/^import .*;\r?$/gm, ""), {
    ...model, ...geometry, ...learning, document,
    matchMedia: () => ({matches: false, addEventListener() {}}),
    localStorage: {getItem: () => null}, addEventListener() {},
    requestAnimationFrame: callback => { frames.set(++sequence, callback); return sequence; },
    cancelAnimationFrame: id => frames.delete(id), ResizeObserver: class { observe() {} },
  });
  return {element, frames, tick(now) {
    assert.equal(frames.size, 1, "a frame must remain scheduled");
    const [id, callback] = frames.entries().next().value;
    frames.delete(id);
    callback(now);
  }};
}

function cameraTime(from, to, angle) {
  const fraction = (angle-from)/(to-from);
  let low = 0, high = 1;
  for (let i = 0; i < 60; i++) {
    const t = (low+high)/2;
    if (t*t*(3-2*t) < fraction) low = t; else high = t;
  }
  return 600*(low+high)/2;
}

test("F01: camera frames continue through the failing angle in both directions", () => {
  for (const [width, height] of [[246,250], [180,180], [480,320]]) {
    const ui = mountView(width, height);
    ui.element("endeck-time").value = "2580"; // .86 in the actual range input
    ui.element("endeck-time").dispatch("input");
    for (const [from, to, angles] of [[64,0,[48,47,46,45]], [0,64,[45,46,47,48]]]) {
      ui.element("endeck-tilt").dispatch("click");
      ui.tick(0);
      for (const angle of angles) {
        ui.tick(cameraTime(from, to, angle));
        assert.equal(ui.element("camera-label").textContent, `${angle}° · x / y / z`);
        const labels = ui.element("endeck-space").children.filter(node => node.attributes.class === "point-label");
        assert.deepEqual(labels.map(label => label.textContent).sort(), [...model.IDs]);
        assert.equal(ui.frames.size, 1, "render completed and scheduled the next camera frame");
      }
      ui.tick(600);
      assert.equal(ui.frames.size, 0, "camera finishes normally");
    }
    ui.element("endeck-play").dispatch("click");
    ui.tick(0);
    ui.tick(800);
    assert.equal(ui.frames.size, 1, "playback continues after the camera transition");
    ui.tick(8000);
    assert.equal(ui.frames.size, 0);
    assert.equal(ui.element("experiment").dataset.progress, "1");
  }
});
