import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const require=createRequire(process.env.RUNTIME_MODULES+'/package.json'),{chromium}=require('playwright'),{PDFDocument,PDFName}=require('pdf-lib');
const browser=await chromium.launch({executablePath:'/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/repository-name/');
 await page.evaluate(async()=>{const {freshState}=await import('./src/model.js'),s=freshState();s.profile={name:'TEST FACULTY',department:'TEST DEPARTMENT',designation:'Faculty',signatureName:''};for(const t of ['dtr','fdtr']){s.setups[t].ready=true;s.setups[t].signatory='TEST HEAD';}s.setups.dtr.schedule=[{category:'lecture',start:'18:00',end:'20:00',days:[2]}];s.setups.fdtr.schedule=[{category:'consultation',start:'08:00',end:'10:00',days:[1,2,3,4,5]},{category:'others',start:'10:00',end:'12:00',days:[1,2,3,4,5]},{category:'class',start:'13:00',end:'19:00',days:[1,2,3,4,5]}];localStorage.setItem('dtr-fdtr-generator-v1',JSON.stringify(s));});
 await page.reload();const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('dtr-fdtr-generator-v1')).setups);
 await page.locator('[data-action="choose"][data-type="fdtr"]').click();await page.locator('#month').fill('2026-09');
 await page.locator('[data-action="add-change"]').click();await page.locator('#change-kind').selectOption('Related activity');
 await page.locator('#activity-description').fill('Research Week');await page.locator('#activity-reference').fill('SO 123, series of 2026');await page.locator('#activity-scope').selectOption('morning');
 assert.equal(await page.locator('[data-period]').count(),1);await page.getByRole('button',{name:'Apply change'}).click();
 let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('dtr-fdtr-generator-v1')));assert.equal(saved.months.fdtr['2026-09'].changes[1].scope,'morning');assert.deepEqual(saved.setups,before);assert.deepEqual(saved.months.dtr,{});
 await page.locator('[data-action="edit-change"][data-day="1"]').first().click();assert.equal(await page.locator('#activity-reference').inputValue(),'SO 123, series of 2026');await page.locator('#activity-scope').selectOption('full');assert.equal(await page.locator('[data-period]').count(),2);await page.getByRole('button',{name:'Apply change'}).click();
 await page.locator('[data-action="preview"]').click();await page.locator('#reviewed:not([disabled])').waitFor();assert.equal(await page.locator('section.institutional').count(),2);assert.ok((await page.locator('#document-preview').innerText()).includes('Research Week'));
 await page.locator('#reviewed').check();await fs.mkdir('qa',{recursive:true});let downloading=page.waitForEvent('download');await page.locator('[data-action="word"]').click();await(await downloading).saveAs('qa/fdtr-activity.docx');
 downloading=page.waitForEvent('download');await page.locator('[data-action="pdf"]').click();await(await downloading).saveAs('qa/fdtr-activity.pdf');
 const pdf=await PDFDocument.load(await fs.readFile('qa/fdtr-activity.pdf'));assert.equal(pdf.getPageCount(),2);assert.ok(Math.abs(pdf.getPages()[0].getWidth()-612)<0.001);assert.ok(Math.abs(pdf.getPages()[0].getHeight()-936)<0.001);assert.equal(pdf.context.enumerateIndirectObjects().filter(([,v])=>v.dict?.get(PDFName.of('Subtype'))===PDFName.of('Image')).length,0);
 await page.screenshot({path:'qa/fdtr-activity-preview.png',fullPage:true});
 await page.locator('[data-action="month"]').click();await page.locator('#month').fill('2026-10');assert.equal(await page.locator('.changes-list li').count(),0);
 await page.locator('#month').fill('2026-09');await page.locator('[data-action="edit-change"][data-day="1"]').first().click();await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:'qa/fdtr-activity-mobile.png',fullPage:true});
 assert.deepEqual(errors,[]);console.log('PASS: monthly full/half day activity, reference/editing, setup and DTR isolation, description in Word/preview, vector F4 PDF, month isolation and mobile dialog.');
}finally{await browser.close();}
