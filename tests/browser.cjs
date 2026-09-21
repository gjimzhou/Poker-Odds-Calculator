const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
(async () => {
 const staticSite=process.env.POKER_STATIC==='1';
 const args=staticSite?['-u','-m','http.server','8877','--bind','127.0.0.1','--directory','web']:['-m','poker_odds.server','--port','8877'];
 const server=spawn(process.env.PYTHON||'python',args);let browser;
 try{
  await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Server timeout')),10000);server.stdout.on('data',d=>{if(String(d).includes('Open http://')||String(d).includes('Serving HTTP')){clearTimeout(timeout);resolve();}});server.on('error',reject);server.on('exit',c=>{clearTimeout(timeout);reject(Error('Server exited '+c));});});
  browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1100,height:1000}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:8877');
  assert.equal(await page.locator('input').count(),0);
  const slot=(group,i)=>page.locator('[data-group="'+group+'"][data-index="'+i+'"]');
  const card=c=>page.locator('#deck [data-card="'+c+'"]');
  const pick=async(group,i,c)=>{await slot(group,i).click();await card(c).click();};
  const complete=async()=>{await page.click('#submit');await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Complete'),null,{timeout:120000});};
  const example=async i=>{await page.click('[data-example="'+i+'"]');await complete();};
  await page.click('#submit');await page.waitForSelector('#status.error');
  await slot('hand1',0).click();assert.equal(await page.locator('#deck [data-card]').count(),52);
  await card('As').click();assert.equal(await page.locator('#picker').isVisible(),true);
  assert.equal(await card('As').isDisabled(),true);
  await card('Ah').click();assert.equal(await page.locator('#picker').isVisible(),false);
  await slot('hand2',0).click();assert.equal(await card('As').isDisabled(),true);
  await card('Kc').click();await card('Kd').click();
  await page.click('[data-street="4"]');await slot('board',0).click();
  for(const c of ['2c','7d','9h','Js'])await card(c).click();
  await complete();assert.equal(await page.locator('#fraction').textContent(),'21/22');
  await slot('dead',0).click();await card('Ks').click();await card('Kh').click();await page.click('#picker-done');
  await complete();assert.equal(await page.locator('#eq1').textContent(),'100.00%');
  await slot('dead',0).click();await page.click('#remove-card');assert.equal(await page.locator('#results').isVisible(),false);
  await complete();assert.equal(JSON.parse(await page.locator('#raw').textContent()).total,43);
  await page.click('#clear-dead');await complete();assert.equal(await page.locator('#fraction').textContent(),'21/22');
  await pick('hand1',0,'Ac');assert.match(await slot('hand1',0).getAttribute('aria-label'),/Ace of clubs/);
  await slot('hand1',0).click();assert.equal(await card('As').isEnabled(),true);await page.keyboard.press('Escape');
  assert.equal(await page.locator('#picker').isVisible(),false);
  await example(3);assert.equal(await page.locator('#eq1').textContent(),'50.00%');
  await page.click('[data-street="3"]');assert.equal(await page.locator('#board .playing-card').count(),3);
  await slot('dead',0).click();assert.equal(await card('Js').isEnabled(),true);await page.click('#picker-close');
  await page.setViewportSize({width:390,height:844});await example(1);
  assert.equal(JSON.parse(await page.locator('#raw').textContent()).total,903);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await slot('hand1',0).click();assert.equal(await page.evaluate(()=>document.querySelector('#picker').scrollWidth>document.querySelector('#picker').clientWidth),false);
  await page.click('#picker-close');
  await example(0);const pre=JSON.parse(await page.locator('#raw').textContent());assert.equal(pre.total,1712304);assert.equal(pre.equity.fraction,'29603/36432');
  if(staticSite){await page.click('#submit');await page.click('#cancel');await page.waitForFunction(()=>document.querySelector('#status').textContent==='Calculation cancelled.');assert.equal(await page.locator('#submit').isEnabled(),true);}
  await page.click('#reset');assert.equal(await page.locator('#hand1 .empty').count(),2);assert.equal(await page.locator('#board .playing-card').count(),0);
  assert.deepEqual(errors,[]);console.log('PASS visual card picker: select, auto-advance, duplicates, all streets, dead cards, replacement, removal, Escape, reset, mobile and exact results.');
 }finally{if(browser)await browser.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
