import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(process.env.RUNTIME_MODULES+'/package.json');
const {chromium}=require('playwright'),{PDFDocument,PDFName}=require('pdf-lib');
const browser=await chromium.launch({executablePath:'/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',headless:true});
try {
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/repository-name/');
 await page.evaluate(async()=>{
  const {freshState}=await import('./src/model.js'),s=freshState();
  s.profile.name='TEST FACULTY';s.setups.dtr.ready=true;s.setups.dtr.signatory='TEST SIGNATORY';
  // Valid entries every day cause docx-preview to grow its single page beyond F4.
  s.setups.dtr.schedule=[{category:'lecture',days:[0,1,2,3,4,5,6],start:'08:00',end:'09:00'}];
  localStorage.setItem('dtr-fdtr-generator-v1',JSON.stringify(s));
 });
 await page.reload();
 await page.locator('[data-action="choose"][data-type="dtr"]').click();
 await page.locator('#month').fill('2026-08');await page.locator('[data-action="preview"]').click();
 await page.locator('#reviewed:not([disabled])').waitFor();
 assert.equal(await page.locator('section.institutional').count(),1);
 const metrics=await page.locator('section.institutional').evaluate(p=>({width:p.offsetWidth,height:p.offsetHeight}));
 assert.ok(await page.locator('section.institutional').evaluate(p=>+p.dataset.printFit<1),'Tall content must already fit within the F4 preview');
 assert.equal(await page.locator('#preview-status .errors').count(),0);
 assert.ok(await page.locator('[data-action="pdf"]').isDisabled());
 await page.locator('#reviewed').check();
 await fs.mkdir('qa',{recursive:true});
 for(const kind of ['word','pdf']){
  assert.ok(await page.locator(`[data-action="${kind}"]`).isEnabled());
  const downloading=page.waitForEvent('download');await page.locator(`[data-action="${kind}"]`).click();
  const download=await downloading;assert.equal(await download.failure(),null);
  await download.saveAs(`qa/print-regression.${kind==='word'?'docx':'pdf'}`);
 }
 const pdf=await PDFDocument.load(await fs.readFile('qa/print-regression.pdf'));
 assert.equal(pdf.getPageCount(),1);
 const output=pdf.getPage(0);assert.ok(Math.abs(output.getWidth()-612)<0.01);assert.ok(Math.abs(output.getHeight()-936)<0.01);
 assert.equal(pdf.context.enumerateIndirectObjects().filter(([,v])=>v.dict?.get(PDFName.of('Subtype'))===PDFName.of('Image')).length,0,'PDF must use crisp vector text');
 await page.locator('[data-action="actual"]').click();await page.screenshot({path:'qa/print-regression.png',fullPage:true});
 assert.deepEqual(errors,[]);
 console.log('PASS: valid tall DTR preview, review gate, Word and PDF downloads, one F4 PDF page, F4 preview fit, vector output, no browser errors.');
} finally {await browser.close();}
