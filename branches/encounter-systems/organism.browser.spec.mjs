import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
// Playwright transforms imported source. The counterpart must instead load the
// raw deployed ESM in an ordinary Node process, preserving callback source hashes.
async function rawNodeCounterpart(text){
  const scenarioURL=new URL('../open-organism-engine/src/scenarios.mjs',import.meta.url).href,checkpointURL=new URL('../open-organism-engine/src/checkpoint.mjs',import.meta.url).href;
  const script=`import {buildScenario} from ${JSON.stringify(scenarioURL)};import {restoreScenarioCheckpoint} from ${JSON.stringify(checkpointURL)};
    let text='';for await(const chunk of process.stdin){text+=chunk;if(text.length>16777216)throw Error('Fixture byte limit');}
    const input=JSON.parse(text),node=buildScenario(input.descriptor.name,input.descriptor.parameters);
    node.world.advance(input.snapshot.modelMs+input.snapshot.remainderMs);
    const same=JSON.stringify(node.world.snapshot())===JSON.stringify(input.snapshot),restored=restoreScenarioCheckpoint(text);
    node.world.advance(50);restored.world.advance(50);
    console.log(JSON.stringify({same,continuedSame:JSON.stringify(node.world.snapshot())===JSON.stringify(restored.world.snapshot()),nextHead:node.world.head,nextCheckpointSha256:node.world.snapshot().checkpointSha256}));`;
  return new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,['--input-type=module','-e',script],{stdio:['pipe','pipe','pipe']});let stdout='',stderr='';
    child.stdout.on('data',chunk=>{stdout+=chunk;});child.stderr.on('data',chunk=>{stderr+=chunk;if(stderr.length>8192)child.kill();});
    child.once('error',reject);child.once('close',code=>{if(code!==0)reject(Error('Raw Node counterpart failed: '+stderr.slice(0,8192)));else try{resolve(JSON.parse(stdout));}catch(error){reject(error);}});child.stdin.end(text);
  });
}
async function ready(page){await page.goto('/systeme/');await expect(page.locator('#step-button')).toBeEnabled();}
async function details(page,title){const box=page.locator('details').filter({has:page.locator('summary').filter({hasText:title})});if(!await box.getAttribute('open').then(x=>x!==null))await box.locator('summary').click();}
async function download(page){await details(page,'Checkpoint & Wiederaufnahme');const waiting=page.waitForEvent('download');await page.locator('#export-button').click();const item=await waiting;return fs.readFile(await item.path(),'utf8');}
const readTick=text=>Number(text.match(/Tick\s+([0-9.]+)/)?.[1].replaceAll('.',''));
test('organism: three browser recipes produce the same bound state and continuation in Node',async({page})=>{
  await ready(page);
  for(const scenario of ['compartments','competition','profiles']){
    await page.locator('#scenario-choice').selectOption(scenario);await page.locator('#reset-button').click();await expect(page.locator('#step-button')).toBeEnabled();
    await page.locator('#batch-button').click();await expect(page.locator('#model-clock')).toContainText('Tick 20');
    const text=await download(page),compared=await rawNodeCounterpart(text);expect(compared.same).toBe(true);expect(compared.continuedSame).toBe(true);
    await page.locator('#step-button').click();await expect(page.locator('#model-clock')).toContainText('Tick 21');
    const next=JSON.parse(await download(page)).snapshot;expect(next.head).toBe(compared.nextHead);expect(next.checkpointSha256).toBe(compared.nextCheckpointSha256);
  }
});
test('organism: real tick and whole-batch transfer balance appear in the UI',async({page},info)=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await ready(page);
  await expect(page.locator('#world-entities')).toHaveText('19');await expect(page.locator('#world-processes')).toHaveText('31');
  expect(await page.evaluate(()=>scrollY)).toBe(0);
  await page.locator('#step-button').click();await expect(page.locator('#model-clock')).toContainText('Tick 1');
  await expect(page.locator('#balance-before')).toHaveText('5');await expect(page.locator('#balance-after')).toContainText('5,01806');
  await page.locator('#batch-button').click();await expect(page.locator('#model-clock')).toContainText('Tick 21');
  await expect(page.locator('#balance-window')).toContainText('1 → 21');
  await page.locator('#tab-flows').click();await expect(page.locator('#flow-table tr')).not.toHaveCount(0);
  const saved=JSON.parse(await download(page));expect(saved.snapshot.tick).toBe(21);expect(saved.snapshot.counters.flows).toBeGreaterThan(100);
  await page.locator('#tab-system').click();await page.evaluate(()=>scrollTo(0,0));
  await page.screenshot({path:info.outputPath('organism-desktop.png'),fullPage:true});expect(errors).toEqual([]);
});
test('organism: frozen rendering keeps its state while the real worker advances',async({page})=>{
  await ready(page);await page.locator('#start-button').click();await expect(page.locator('#engine-state')).toContainText('Engine läuft');
  await page.locator('#freeze-button').click();const frozenScene=await page.locator('#scene-state').innerText(),frozenStock=await page.locator('#current-stock').innerText();
  await expect(page.locator('#freeze-notice')).toBeVisible();await page.waitForTimeout(650);
  await page.locator('#pause-button').click();const saved=JSON.parse(await download(page));
  expect(saved.snapshot.tick).toBeGreaterThan(readTick(frozenScene));
  expect(await page.locator('#scene-state').innerText()).toBe(frozenScene);expect(await page.locator('#current-stock').innerText()).toBe(frozenStock);
  await page.locator('#freeze-button').click();await expect(page.locator('#model-clock')).toContainText('Tick '+saved.snapshot.tick);
  const second=JSON.parse(await download(page));expect(second.snapshot.head).toBe(saved.snapshot.head);
});
test('organism: downloaded checkpoint resumes and malformed imports preserve the current model',async({page})=>{
  await ready(page);await page.locator('#batch-button').click();await expect(page.locator('#model-clock')).toContainText('Tick 20');
  const saved=await download(page),original=JSON.parse(saved);await page.locator('#step-button').click();await expect(page.locator('#model-clock')).toContainText('Tick 21');
  await page.locator('#snapshot-file').setInputFiles({name:'checkpoint.json',mimeType:'application/json',buffer:Buffer.from(saved)});
  await expect(page.locator('#import-state')).toHaveAttribute('data-state','ready');
  expect(JSON.parse(await download(page)).snapshot.head).toBe(original.snapshot.head);
  for(const buffer of [Buffer.from('{"schema":1,"schema":2}'),Buffer.from([123,34,120,34,58,34,255,34,125])]){
    await page.locator('#snapshot-file').setInputFiles({name:'broken.json',mimeType:'application/json',buffer});
    await expect(page.locator('#import-state')).toHaveAttribute('data-state','error');
    await expect(page.locator('#quick-result')).toHaveAttribute('data-state','error');
    expect(JSON.parse(await download(page)).snapshot.head).toBe(original.snapshot.head);
  }
  await details(page,'Eigener Bereich');await page.locator('#new-entity-id').fill('custom-node');await page.locator('#new-entity-label').fill('<img src=x onerror=alert(1)>');
  await page.locator('#add-entity-button').click();await expect(page.locator('#entity-add-state')).toContainText('hinzugefügt');
  await page.locator('#entity-choice').selectOption('custom-node');await expect(page.locator('#inspector-title')).toHaveText('<img src=x onerror=alert(1)>');
  await expect(page.locator('#inspector-title img')).toHaveCount(0);
  const custom=await download(page);await page.locator('#snapshot-file').setInputFiles({name:'custom.json',mimeType:'application/json',buffer:Buffer.from(custom)});
  await expect(page.locator('#import-state')).toHaveAttribute('data-state','ready');await expect(page.locator('#world-entities')).toHaveText('20');
});
test('organism: 1000 synthetic profiles and explicit gaps retain their actual scope',async({page})=>{
  await ready(page);await page.locator('#scenario-choice').selectOption('profiles');await page.locator('#profile-count').selectOption('1000');await page.locator('#reset-button').click();
  await expect(page.locator('#world-entities')).toHaveText('1.001');await expect(page.locator('#world-processes')).toHaveText('1.000');
  await page.locator('#gap-button').click();await page.locator('#tab-history').click();await expect(page.locator('#history-gap')).toContainText('1 s');
  await page.locator('#audit-button').click();await expect(page.locator('#audit-title')).toContainText('bestanden');
  await page.locator('#step-button').click();await expect(page.locator('#audit-title')).toContainText('früheren');
  const saved=JSON.parse(await download(page));expect(saved.snapshot.entities.length).toBe(1001);expect(saved.snapshot.tick).toBe(1);expect(saved.snapshot.undocumentedGapMs).toBe(1000);
  expect(saved.snapshot.events.some(e=>e.type==='OBSERVATION_GAP')).toBe(true);
});
for(const width of [390,320])test(`organism: mobile ${width} keeps controls, result and scroll stable`,async({page},info)=>{
  await page.setViewportSize({width,height:844});await ready(page);expect(await page.evaluate(()=>scrollY)).toBe(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect(page.locator('#quick-result')).toBeVisible();
  await expect(page.locator('#controls-panel')).toBeHidden();await expect(page.locator('#controls-toggle')).toBeVisible();
  await page.screenshot({path:info.outputPath(`organism-mobile-default-${width}.png`),fullPage:false});
  await page.locator('#controls-toggle').click();await expect(page.locator('#controls-panel')).toBeVisible();
  await page.locator('#entity-choice').selectOption('brain');await page.locator('.local-step').scrollIntoViewIfNeeded();const y=await page.evaluate(()=>scrollY);
  await page.locator('.local-step').click();await expect(page.locator('#quick-result-text')).toContainText('T1');
  // The click itself may scroll a control into view. The asynchronous result
  // must preserve the resulting position rather than jumping back to a panel.
  const settledY=await page.evaluate(()=>scrollY);await page.waitForTimeout(300);expect(await page.evaluate(()=>scrollY)).toBe(settledY);
  expect(Math.abs(settledY-y)).toBeLessThan(2);await expect(page.locator('#quick-result')).toBeInViewport();
  await page.screenshot({path:info.outputPath(`organism-mobile-${width}.png`),fullPage:true});
  await page.locator('#tab-history').click();await expect(page.locator('#panel-history')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
