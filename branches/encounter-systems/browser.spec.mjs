// SPDX-License-Identifier: MIT
import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs/promises";

async function codeExport(page, workplace) {
  const pending = page.waitForEvent('download');
  await page.locator(`#${workplace}-export`).click();
  const download = await pending;
  return JSON.parse(await fs.readFile(await download.path(), 'utf8'));
}

test('code formats distinguish header candidates and invalidate stale exports', async ({page}) => {
  const errors=[]; page.on('pageerror', error=>errors.push(error.message));
  await page.goto('/code/');
  await expect(page.locator('#format-export')).toBeEnabled();
  await page.locator('#format-name').fill('<img src=x onerror=alert(1)>.eth');
  await page.locator('#format-hex').fill('FF');
  await expect(page.locator('#quick-result')).toHaveAttribute('data-state','dirty');
  await page.getByRole('button',{name:'Format einordnen',exact:true}).click();
  await expect(page.locator('#format-content')).toContainText('<img src=x onerror=alert(1)>.eth');
  await expect(page.locator('#format-content img')).toHaveCount(0);
  const partial=await codeExport(page,'format');
  expect(partial.result.candidates.find(c=>c.id==='ETH_WINPHAROAH').match).toBe('HEADER_MISMATCH');
  expect(partial.result.formatValidated).toBe(false);
  await page.locator('[data-format-example="archive"]').click();
  const archive=await codeExport(page,'format');
  expect(archive.result.candidates.find(c=>c.id==='MAV_BAAM').match).toBe('EXTENSION_AND_HEADER');
  await page.locator('#format-name').fill('renamed.bin');
  await expect(page.locator('#format-export')).toBeDisabled();
  await page.getByRole('button',{name:'Format einordnen',exact:true}).click();
  expect((await codeExport(page,'format')).result.candidates.find(c=>c.id==='MAV_BAAM').match).toBe('HEADER_ONLY');
  await page.locator('#format-hex').fill('F');
  await page.getByRole('button',{name:'Format einordnen',exact:true}).click();
  await expect(page.locator('#format-error')).toBeVisible();
  await expect(page.locator('#format-export')).toBeDisabled();
  await expect(page.locator('#format-content .candidate')).toHaveCount(0);
  await expect(page.locator('#quick-result')).toHaveAttribute('data-state','error');
  expect(errors).toEqual([]);
});

test('code phase averaging and human metadata remain distinct in actual downloads', async ({page}) => {
  await page.goto('/code/'); await page.locator('#tab-signals').click();
  await page.locator('[data-signal-example="noise"]').click();
  await expect(page.locator('#signal-visibility')).toHaveText('0,375');
  await expect(page.locator('#signal-distinguishability')).toHaveText('0,000');
  const before=await codeExport(page,'signal');
  await page.locator('#signal-human').check();
  const after=await codeExport(page,'signal');
  const {humanRead:leftRead,...left}=before.result, {humanRead:rightRead,...right}=after.result;
  expect(leftRead).toBe(false); expect(rightRead).toBe(true); expect(left).toEqual(right);
  expect(after.timeBasis).toBe('CLIENT_WALL_CLOCK_NOT_CALIBRATED');
  await expect(page.locator('#signal-chart')).toHaveAttribute('role','img');
  await expect(page.locator('#signal-chart-description')).toContainText('0,375');
});

test('code Unicode and RNA downloads bind the selected decoder, frame and unfinished remainder', async ({page}) => {
  await page.goto('/code/'); await page.locator('#tab-symbols').click();
  await page.locator('[data-symbol-example="unicode"]').click();
  await page.locator('#symbol-mapping').selectOption('23');
  const encoded=await codeExport(page,'symbol');
  expect(encoded.result.roundTripText).toBe('Licht ☀ – 光'); expect(encoded.result.equalBytes).toBe(true);
  expect(encoded.result.mappingIndex).toBe(23);
  await page.locator('[name="symbol-direction"][value="decode"]').check();
  expect((await codeExport(page,'symbol')).result.text).toBe(encoded.result.text);
  await page.locator('#symbol-input').fill('AAAAA'); await page.locator('#symbol-submit').click();
  await expect(page.locator('#symbol-error')).toBeVisible(); await expect(page.locator('#symbol-export')).toBeDisabled();
  await page.locator('#tab-rna').click();
  await page.locator('#rna-sequence').fill('AAUGGCUUAAU'); await page.locator('#rna-frame').selectOption('1');
  const rna=await codeExport(page,'rna');
  expect(rna.result.aminoAcidSymbols).toBe('MA*'); expect(rna.result.trailingBases).toBe('U'); expect(rna.result.frame).toBe(1);
  expect(rna.result.sequence).toBe('AAUGGCUUAAU'); expect(rna.result.geneticCode).toBe(1);
  await page.locator('#rna-sequence').fill('aug'); await page.locator('#rna-form [type="submit"]').click();
  await expect(page.locator('#rna-error')).toBeVisible(); await expect(page.locator('#rna-export')).toBeDisabled();
});

test('code tabs fit mobile and desktop, retain control position and support keyboard navigation', async ({page},info) => {
  const errors=[]; page.on('pageerror', error=>errors.push(error.message));
  for (const width of [320,390,768,1280]) {
    await page.setViewportSize({width,height:844}); await page.goto('/code/?width='+width);
    for (const tab of ['formats','signals','symbols','rna']) {
      await page.locator('#tab-'+tab).click();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
      if(width<=660) await expect(page.locator('#quick-result')).toBeVisible();
      else await expect(page.locator('#quick-result')).toBeHidden();
    }
  }
  await page.setViewportSize({width:390,height:844}); await page.goto('/code/?fresh=1#trace-title');
  await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(0);
  await page.locator('#tab-formats').focus(); await page.keyboard.press('ArrowRight');
  await expect(page.locator('#tab-signals')).toHaveAttribute('aria-selected','true');
  await page.keyboard.press('End'); await expect(page.locator('#tab-rna')).toHaveAttribute('aria-selected','true');
  await page.keyboard.press('Home'); await expect(page.locator('#tab-formats')).toHaveAttribute('aria-selected','true');
  await page.locator('#tab-signals').click(); await page.locator('[data-signal-example="noise"]').click();
  await expect(page.locator('#quick-result-text')).toContainText('V 0,375');
  const y=await page.evaluate(()=>scrollY);
  await page.locator('[data-signal-example="coherent"]').click();
  expect(Math.abs((await page.evaluate(()=>scrollY))-y)).toBeLessThan(2);
  await page.locator('#quick-result-button').click();
  expect(await page.evaluate(()=>scrollY)).toBeGreaterThan(y);
  await page.screenshot({path:info.outputPath('code-mobile-390.png'),fullPage:false});
  await page.setViewportSize({width:1440,height:1000}); await page.goto('/code/');
  await page.screenshot({path:info.outputPath('code-desktop.png'),fullPage:false});
  expect(errors).toEqual([]);
});

test('security research creates a declared plan, preserves literal input and downloads its real state',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/security/');await expect(page.locator('.method-card')).toHaveCount(18);
  await page.getByRole('button',{name:'Denkprozess starten',exact:true}).click();
  await expect(page.locator('.task')).toHaveCount(6);
  await page.getByLabel('Was untersuchst du?',{exact:true}).selectOption('runtime');
  await page.getByLabel('Wo beginnt die Arbeit?',{exact:true}).selectOption('PROGRAM');
  await page.getByLabel('Deine konkrete Frage',{exact:false}).fill('<img src=x onerror=alert(1)> is literal input');
  await page.getByRole('button',{name:'Prüfplan berechnen',exact:true}).click();
  await expect(page.locator('#plan-title')).toContainText('Runtime & Fehler');
  await expect(page.locator('.task').first()).toContainText('Noch offen: target, owner, policyUrl, allowedAction');
  await page.getByLabel('Arbeitsstand: Gegenmodell und kleinste Gegenprobe formulieren',{exact:true}).selectOption('DONE');
  await expect(page.locator('.task').nth(2)).toHaveAttribute('data-state','DONE');
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'JSON herunterladen',exact:true}).click();
  const download=await pending;const doc=JSON.parse(await fs.readFile(await download.path(),'utf8'));
  expect(doc.tasks[2].state).toBe('DONE');expect(doc.tasks[2].evidenceState).toBe('USER_DECLARED_PROGRESS');
  expect(doc.authority.state).toBe('DECLARED_NOT_VERIFIED');expect(doc.authority.externalExecution).toBe('NONE');
  expect(doc.exportReceipt.timeBasis).toBe('CLIENT_WALL_CLOCK_NOT_CALIBRATED');expect(doc.input.question).toContain('<img');
  await expect(page.locator('#plan-output img')).toHaveCount(0);
  await page.getByRole('button',{name:'Plan & Eingaben leeren',exact:true}).click();
  await expect(page.locator('.task')).toHaveCount(0);await expect(page.locator('#question')).toHaveValue('');
  expect(errors).toEqual([]);
});

test('security research countercontrols, search and mobile layout stay usable',async({page},info)=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/security/');await expect(page.locator('.method-card')).toHaveCount(18);
  for(const name of ['01 Feldgrenzen','02 Objektbindung','03 Request-Zustand','04 Chain-Sichten']){
    await page.getByRole('button',{name,exact:true}).click();const before=await page.locator('#fixture-output').innerText();
    await page.getByLabel('Normale Gegenkontrolle',{exact:true}).check();expect(await page.locator('#fixture-output').innerText()).not.toBe(before);
  }
  await page.getByLabel('Methoden durchsuchen',{exact:true}).fill('no-such-method');await expect(page.locator('.method-card')).toHaveCount(0);await expect(page.locator('#no-methods')).toBeVisible();
  await page.getByLabel('Methoden durchsuchen',{exact:true}).fill('');await page.getByRole('button',{name:'Chain & Contracts',exact:true}).click();await expect(page.locator('.method-card')).toHaveCount(4);
  for(const width of [320,390,768,1280]){await page.setViewportSize({width,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
  // A changed query creates a fresh document; an in-page anchor must still work normally.
  await page.setViewportSize({width:390,height:844});await page.goto('/security/?fresh=1#labor');
  await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(0);
  await page.screenshot({path:info.outputPath('security-mobile-390.png'),fullPage:false});expect(errors).toEqual([]);
});

test("ENDECK uses native controls, preserves source identities and remembers only correct learning answers",async({page},info)=>{
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await page.goto("/endeck/");
  await expect(page.locator("html")).toHaveAttribute("data-endeck-ready","true");
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(page.locator("#endeck-flat-count")).toHaveText("1 Bildort");
  await expect(page.locator("#endeck-space-count")).toHaveText("4 Raumorte · 4 IDs");
  await page.getByLabel("Was möchtest du vergleichen?",{exact:true}).selectOption("merge");
  for(const [t,n]of [["0",4],["1000",3],["2000",2],["3000",1]]){
    await page.getByLabel("Modellzeit",{exact:true}).fill(t);
    await expect(page.locator("#endeck-space-count")).toHaveText(`${n} ${n===1?"Raumort":"Raumorte"} · 4 IDs`);
  }
  await page.getByRole("button",{name:"Einen Ort",exact:true}).click();
  await expect(page.locator("#learning-count")).toHaveText("0 / 4");
  await page.getByRole("button",{name:"Zwei Orte",exact:true}).click();
  await expect(page.locator("#learning-count")).toHaveText("1 / 4");
  await page.getByRole("button",{name:"Zwei Orte",exact:true}).click();
  await expect(page.locator("#learning-count")).toHaveText("1 / 4");
  await page.reload();await expect(page.locator("#learning-count")).toHaveText("1 / 4");
  await page.getByLabel("Was möchtest du vergleichen?",{exact:true}).selectOption("history");
  await page.getByLabel("Modellzeit",{exact:true}).fill("1500");
  const flat=await page.locator("#endeck-flat").innerHTML(),straight=await page.locator("#endeck-space").innerHTML();
  await page.getByRole("button",{name:"Bogen",exact:true}).click();
  expect(await page.locator("#endeck-flat").innerHTML()).toBe(flat);
  expect(await page.locator("#endeck-space").innerHTML()).not.toBe(straight);
  await page.getByRole("button",{name:"Eine Aufnahme bei t = 0,5",exact:true}).click();
  await expect(page.locator("#learning-count")).toHaveText("2 / 4");
  await page.screenshot({path:info.outputPath("endeck-desktop.png"),fullPage:true});
  expect(errors).toEqual([]);
});

test("ENDECK mobile controls and labels fit without nested scrolling at four widths",async({page},info)=>{
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await page.goto("/endeck/");await expect(page.locator("html")).toHaveAttribute("data-endeck-ready","true");
  for(const width of [320,390,768,1024]){
    await page.setViewportSize({width,height:900});
    for(const mode of ["projection","shrink","merge","history"]){
      await page.getByLabel("Was möchtest du vergleichen?",{exact:true}).selectOption(mode);
      for(const time of ["0","1000","2000","3000"]){
        await page.getByLabel("Modellzeit",{exact:true}).fill(time);
        const layout=await page.evaluate(()=>{
          const labelsFit=[...document.querySelectorAll(".chart")].every(svg=>{
            const box=svg.getBoundingClientRect();
            return[...svg.querySelectorAll(".point-label")].every(label=>{
              const b=label.getBoundingClientRect();return b.left>=box.left-1&&b.right<=box.right+1&&b.top>=box.top-1&&b.bottom<=box.bottom+1;
            });
          });
          const controls=[...document.querySelectorAll(".experiment-top button,.experiment-top select")].map(el=>el.getBoundingClientRect());
          return{horizontal:document.documentElement.scrollWidth<=innerWidth,labelsFit,touch:controls.every(b=>b.height>=44),frames:document.querySelectorAll("iframe").length};
        });
        expect(layout).toEqual({horizontal:true,labelsFit:true,touch:true,frames:0});
      }
    }
    await page.getByLabel("Was möchtest du vergleichen?",{exact:true}).selectOption("projection");
    await page.screenshot({path:info.outputPath(`endeck-${width}.png`),fullPage:true});
  }
  expect(errors).toEqual([]);
});

test("a corrupt saved score is visible and cannot award progress",async({page})=>{
  await page.addInitScript(()=>{try{localStorage.setItem("halveth.endeck.learning.v1",'{"schema":"endeck.learning.v1","completed":["invented"]}');}catch{}});
  await page.goto("/endeck/");
  await expect(page.locator("#learning-count")).toHaveText("0 / 4");
  await expect(page.locator("#storage-note")).toContainText("nicht übernommen");
  await page.getByRole("button",{name:"Vier Raumorte",exact:true}).click();
  await expect(page.locator("#learning-count")).toHaveText("1 / 4");
  await page.getByRole("button",{name:"Lernstand zurücksetzen",exact:true}).click();
  await expect(page.locator("#learning-count")).toHaveText("0 / 4");
});

test("animation pauses correctly and reduced motion stops the active run",async({page})=>{
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.goto("/endeck/");
  await page.getByLabel("Modellzeit",{exact:true}).fill("0");
  await page.getByRole("button",{name:"Ablauf zeigen",exact:true}).click();
  await expect.poll(async()=>Number(await page.locator("#experiment").getAttribute("data-progress"))).toBeGreaterThan(0);
  await page.getByRole("button",{name:"Anhalten",exact:true}).click();
  const paused=await page.locator("#experiment").getAttribute("data-progress");
  await page.getByRole("button",{name:"Blick kippen",exact:true}).click();
  await expect(page.locator("#camera-label")).toHaveText("0° · x / y / z");
  expect(await page.locator("#experiment").getAttribute("data-progress")).toBe(paused);
  await page.getByRole("button",{name:"Ablauf zeigen",exact:true}).click();
  await page.emulateMedia({reducedMotion:"reduce"});
  await expect(page.locator("#endeck-play")).toHaveText("Endzustand zeigen");
  await page.getByRole("button",{name:"Endzustand zeigen",exact:true}).click();
  await expect(page.locator("#experiment")).toHaveAttribute("data-progress","1");
});

test("unavailable browser storage keeps the experiment and temporary learning usable",async({page})=>{
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await page.addInitScript(()=>Object.defineProperty(window,"localStorage",{get(){throw new DOMException("Synthetic storage denial","SecurityError");}}));
  await page.goto("/endeck/");
  await expect(page.locator("html")).toHaveAttribute("data-endeck-ready","true");
  await expect(page.locator("#storage-note")).toContainText("nicht verfügbar");
  await page.getByRole("button",{name:"Vier Raumorte",exact:true}).click();
  await expect(page.locator("#learning-count")).toHaveText("1 / 4");
  await page.getByLabel("Was möchtest du vergleichen?",{exact:true}).selectOption("merge");
  await expect(page.locator("#learning-count")).toHaveText("1 / 4");
  expect(errors).toEqual([]);
});

test("the repository tunnel has twenty-two usable source and test routes and mobile navigation fits",async({page},info)=>{
  await page.goto("/wissen/");await expect(page.locator(".route")).toHaveCount(22);
  await expect(page.getByRole("link",{name:"Code",exact:true})).toHaveCount(22);
  await expect(page.getByRole("link",{name:"Tests",exact:true})).toHaveCount(22);
  await expect(page.locator('.route').filter({hasText:'Code & Messung'}).getByRole('link',{name:'Ansicht öffnen ↗',exact:true})).toHaveAttribute('href','../code/');
  await expect(page.locator('.route').filter({hasText:'Sicherheitsprüfungen'}).getByRole('link',{name:'Ansicht öffnen ↗',exact:true})).toHaveAttribute('href','../sicherheitslabor/');
  await expect(page.locator('.route').filter({hasText:'Security Research'}).getByRole('link',{name:'Ansicht öffnen ↗',exact:true})).toHaveAttribute('href','../security/');
  for(const url of ["/wissen/","/signals.html","/"]){
    await page.goto(url);
    for(const width of [320,390,768,1024]){
      await page.setViewportSize({width,height:900});
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    }
  }
  await page.goto("/wissen/");await page.setViewportSize({width:390,height:900});
  await page.screenshot({path:info.outputPath("learning-tunnel-mobile.png"),fullPage:true});
});

test('security workbench executes counterexamples, rejects invalid input and exports actual local results',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/sicherheitslabor/');await expect(page.locator('#run-count')).toHaveText('6');
  await expect(page.locator('.advisory')).toHaveCount(10);
  await page.getByLabel('Exakte stabile Version',{exact:true}).fill('24.22');
  await page.getByRole('button',{name:'Vergleichen',exact:true}).click();
  await expect(page.locator('#suite-status')).toContainText('5/6');
  await page.getByLabel('Exakte stabile Version',{exact:true}).fill('24.22.1');
  await page.getByRole('button',{name:'Vergleichen',exact:true}).click();
  await expect(page.locator('#runtime-summary')).toContainText('Patchschwelle erreicht');
  await page.getByRole('button',{name:'Unicode-Gegenprobe',exact:true}).click();
  await expect(page.locator('#identity-summary')).toContainText('127.0.0.1');
  await page.getByLabel('Formatfehler als endgültig behandeln',{exact:true}).uncheck();
  await expect(page.locator('#decoder-summary')).toContainText('2 Datenereignis');
  await page.getByLabel('Subjekt vor Freigabe abgleichen',{exact:true}).uncheck();
  await expect(page.locator('#session-summary')).toContainText('fremdes Subjekt freigegeben');
  await page.getByLabel('Formatfehler als endgültig behandeln',{exact:true}).check();
  await page.getByLabel('Subjekt vor Freigabe abgleichen',{exact:true}).check();
  await expect(page.locator('#decoder-summary')).toContainText('Formatfehler beendet');
  await expect(page.locator('#session-summary')).toContainText('zurückgewiesen');
  await page.getByLabel('Textprobe, maximal 32768 Zeichen',{exact:true}).fill('<img src=x> // documentation: eval(example)');
  await page.getByRole('button',{name:'Text lokal sichten',exact:true}).click();
  await expect(page.locator('#triage img')).toHaveCount(0);
  const downloadPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:'Ergebnisse als JSON speichern',exact:true}).click();
  const download=await downloadPromise;
  const result=JSON.parse(await fs.readFile(await download.path(),'utf8'));
  expect(Object.keys(result.results)).toHaveLength(6);expect(result.networkRequests).toBe(0);
  expect(result.results.triage.verdict).toBe('UNDETERMINED');
  expect(errors).toEqual([]);
});

test('security workbench fits five measured viewport widths and retains six live result areas',async({page},info)=>{
  await page.goto('/sicherheitslabor/');await expect(page.locator('#run-count')).toHaveText('6');
  for(const width of [320,390,768,1024,1440]){
    await page.setViewportSize({width,height:900});
    expect(await page.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,results:document.querySelectorAll('.outcome').length}))).toEqual({width,overflow:false,results:6});
  }
  await page.screenshot({path:info.outputPath('security-workbench-desktop.png'),fullPage:true});
});

test("signal controls change received samples and decoded image", async ({
  page,
}, info) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/signals.html");
  await expect(page.locator("#signal-correct")).toHaveText("64 / 64");
  const sent = await page.locator("#signal-sent-path").getAttribute("d");
  const received = await page
    .locator("#signal-received-path")
    .getAttribute("d");
  await page.locator("#signal-mode").selectOption("inverted");
  await expect(page.locator("#signal-wrong")).toHaveText("64 / 64");
  expect(await page.locator("#signal-received-path").getAttribute("d")).toBe(
    received,
  );
  await page.locator("#signal-mode").selectOption("detuned");
  await expect(page.locator("#signal-unknown")).toHaveText("64 / 64");
  await page.locator("#signal-mode").selectOption("matched");
  await page.locator("#signal-connected").uncheck();
  await expect(page.locator("#signal-unknown")).toHaveText("64 / 64");
  expect(
    await page.locator("#signal-received-path").getAttribute("d"),
  ).not.toBe(received);
  await page.locator("#signal-connected").check();
  await page.locator("#signal-input button").first().click();
  expect(await page.locator("#signal-sent-path").getAttribute("d")).not.toBe(
    sent,
  );
  await expect(page.locator("#signal-correct")).toHaveText("64 / 64");
  await page.locator("#signal-noise").fill("4");
  expect(
    await page.locator("#signal-received-path").getAttribute("d"),
  ).not.toBe(await page.locator("#signal-sent-path").getAttribute("d"));
  await page.locator("#signal-pattern").selectOption("pulse");
  await expect(page.locator("#signal-results-table tr")).toHaveCount(12);
  await page.screenshot({
    path: info.outputPath("signal-desktop.png"),
    fullPage: true,
  });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.screenshot({
    path: info.outputPath("signal-mobile.png"),
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("commands, timeline, workloads, corruption and repair are connected to model state", async ({
  page,
}, info) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.waitForFunction(
    () => !!document.getElementById("halveth-encounter-work")?.__encounter,
  );
  const advance = (t) =>
    page.evaluate(
      (t) =>
        document
          .getElementById("halveth-encounter-work")
          .__encounter.advanceTo(t),
      t,
    );
  await advance(3);
  await page.locator("#ew-partner").click();
  await page.locator("#ew-visit").click();
  await advance(6);
  await expect(page.locator("#ew-copies")).toHaveText("3 / 3");
  await expect(page.locator("#result-runs")).toHaveText("12");
  const before = await page.evaluate(() =>
    JSON.stringify(
      document.getElementById("halveth-encounter-work").__encounter.snapshot(),
    ),
  );
  await page.locator("#history").fill("0");
  await expect(page.locator("#ew-partner")).toBeDisabled();
  const after = await page.evaluate(() =>
    JSON.stringify(
      document.getElementById("halveth-encounter-work").__encounter.snapshot(),
    ),
  );
  expect(after).toBe(before);
  await page.locator("#ew-view").click();
  await page.locator("#history-live").click();
  await expect(page.locator("#ew-partner")).toBeEnabled();
  await page.locator("#ew-view").click();
  await page.locator("#ew-write").click();
  await advance(7);
  await expect(page.locator("#ew-event")).toContainText("gestoppt");
  await page.locator("#ew-guard").uncheck();
  await page.locator("#ew-write").click();
  await advance(8);
  await expect(page.locator("#ew-repair")).toBeVisible();
  await page.locator("#ew-repair").click();
  expect(
    await page.evaluate(
      () =>
        document.getElementById("halveth-encounter-work").__encounter.inspect()
          .corrupted,
    ),
  ).toEqual([]);
  await page.screenshot({
    path: info.outputPath("desktop.png"),
    fullPage: true,
  });
  if (process.env.UPDATE_PREVIEW === "1")
    await page
      .locator("#experiment")
      .screenshot({ path: path.join(import.meta.dirname, "preview.png") });
  await page.locator("#ew-task").selectOption("wave");
  await advance(5);
  expect(
    await page.evaluate(
      () =>
        document.getElementById("halveth-encounter-work").__encounter.inspect()
          .task,
    ),
  ).toBe("wave");
  await page.locator("#ew-reset").click();
  await page.locator("#ew-play").click();
  await page.waitForFunction(
    () =>
      document.getElementById("halveth-encounter-work").__encounter.inspect()
        .time > 0.2,
  );
  await page.locator("#ew-play").click();
  await page.setViewportSize({ width: 390, height: 900 });
  await page.screenshot({
    path: info.outputPath("mobile.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
  await page.setViewportSize({ width: 320, height: 900 });
  await page.screenshot({
    path: info.outputPath("mobile-320.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  // Header navigation must reflow when a platform uses wider system glyphs.
  await page.addStyleTag({
    content:
      ".site-header { font-family: monospace } .site-header nav a { font-size: 14px }",
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
