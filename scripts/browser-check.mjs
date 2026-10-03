import {createRequire} from 'node:module';import fs from 'node:fs/promises';
const require=createRequire(process.env.RUNTIME_MODULES+'/package.json');const {chromium}=require('playwright');
const browser=await chromium.launch({executablePath:'/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',headless:true});const page=await browser.newPage({viewport:{width:1365,height:1000}});page.on('pageerror',e=>console.log('PAGEERROR',e.message));
await page.goto('http://127.0.0.1:4173/repository-name/');await page.getByRole('heading',{name:'What do you want to create?'}).waitFor();await page.screenshot({path:'qa/landing.png',fullPage:true});console.log('Landing loaded');
if(process.env.SMOKE_ONLY){await browser.close();process.exit(0);}
const fixture=JSON.parse(await fs.readFile('qa/august-fixture.json','utf8'));
const state=await page.evaluate(async fixture=>{const {freshState}=await import('./src/model.js');const s=freshState();s.profile=fixture.profile;for(const type of ['dtr','fdtr']){s.setups[type].ready=true;s.setups[type].signatory=fixture.signatories[type];s.setups[type].schedule=[{category:type==='dtr'?'laboratory':'class',days:[1],start:'18:00',end:'21:00'}];s.setups[type].regular=type==='dtr'?'MTH 6:00 PM – 9:00 PM; T 6:00 PM – 8:00 PM':'';s.months[type]['2026-08']={changes:{}};for(const [day,r]of Object.entries(fixture[type]))s.months[type]['2026-08'].changes[day]={kind:r.label?'Other':'Changed Schedule',label:r.label,sessions:r.sessions};}localStorage.setItem('dtr-fdtr-generator-v1',JSON.stringify(s));return s;},fixture);
await page.reload();
for(const type of ['dtr','fdtr']){
 await page.locator(`[data-action="choose"][data-type="${type}"]`).click();await page.locator('#month').fill('2026-08');await page.locator('[data-action="preview"]').click();await page.waitForFunction(()=>document.querySelectorAll('section.institutional').length>0||document.querySelector('#preview-status .errors'));await page.waitForTimeout(800);
 console.log(type,await page.locator('#preview-status').innerText());console.log('PAGE METRICS',await page.locator('section.institutional').evaluateAll(p=>p.map(n=>({w:n.offsetWidth,h:n.offsetHeight,scroll:n.scrollHeight}))));
 await page.locator('[data-action="actual"]').click();await page.screenshot({path:`qa/${type}-preview.png`,fullPage:true});
 const bytes=await page.evaluate(async({state,type})=>{const {generateDocx}=await import('./src/documents.js');return Array.from(new Uint8Array(await(await generateDocx(state,type,'2026-08')).arrayBuffer()));},{state,type});await fs.writeFile(`qa/${type}-august.docx`,Buffer.from(bytes));
 await page.addStyleTag({content:'.preview-toolbar{position:static!important}'});for(let i=0;i<await page.locator('section.institutional').count();i++)await page.locator('section.institutional').nth(i).screenshot({path:`qa/${type}-browser-page-${i+1}.png`});
 if(await page.locator('#reviewed').isEnabled()){
  await page.locator('#reviewed').check();const dl=page.waitForEvent('download');await page.locator('[data-action="pdf"]').click();await(await dl).saveAs(`qa/${type}-august.pdf`);console.log('PDF downloaded',type);
 }
 await page.locator('[data-action="home"]').first().click();
}
await browser.close();
