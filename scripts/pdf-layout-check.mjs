import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(process.env.RUNTIME_MODULES+'/package.json');
const {chromium}=require('playwright'),{PDFDocument,decodePDFRawStream,PDFName}=require('pdf-lib'),{PNG}=require('pngjs');
const browser=await chromium.launch({executablePath:'/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/repository-name/');
 await page.evaluate(async()=>{
  const {freshState}=await import('./src/model.js'),s=freshState();
  s.profile.name='TEST FIRST MIDDLE LAST';s.profile.department='TEST DEPARTMENT';s.profile.designation='Faculty';
  for(const type of ['dtr','fdtr']){
   s.setups[type].ready=true;s.setups[type].signatory='ATTY. TEST SIGNATORY NAME';
   s.setups[type].schedule=[{category:type==='dtr'?'laboratory':'class',days:[1,4],start:'18:00',end:'21:00'}];
  }
  localStorage.setItem('dtr-fdtr-generator-v1',JSON.stringify(s));
 });
 await page.reload();await fs.mkdir('qa',{recursive:true});
 for(const type of ['dtr','fdtr']){
  await page.locator(`[data-action="choose"][data-type="${type}"]`).click();
  await page.locator('#month').fill('2026-08');await page.locator('[data-action="preview"]').click();
  await page.locator('#reviewed:not([disabled])').waitFor();await page.locator('#reviewed').check();
  const originalHTML=await page.locator('#document-preview').innerHTML();
  for(const [mode,width] of [['desktop',1280],['mobile',390]]){
   await page.setViewportSize({width,height:900});
   const downloading=page.waitForEvent('download');await page.locator('[data-action="pdf"]').click();
   const download=await downloading;assert.equal(await download.failure(),null);
   const filename=`qa/${type}-layout-${mode}.pdf`;await download.saveAs(filename);
   const pdf=await PDFDocument.load(await fs.readFile(filename));assert.equal(pdf.getPageCount(),type==='dtr'?1:2);
   const images=pdf.context.enumerateIndirectObjects().map(([,v])=>v).filter(v=>v.dict?.get(PDFName.of('Subtype'))===PDFName.of('Image'));
   assert.equal(images.length,type==='dtr'?1:2);
   // The PDF must embed exactly the frozen preview pixels, independent of screen scale.
   for(let i=0;i<images.length;i++){
    const expected=PNG.sync.read(Buffer.from(await page.evaluate(async index=>{
     const {captureDocumentPage}=await import('./src/documents.js');
     return (await captureDocumentPage(document.querySelectorAll('section.institutional')[index])).toDataURL().split(',')[1];
    },i),'base64'));
    const raw=decodePDFRawStream(images[i]).decode();
    assert.equal(raw.length,expected.width*expected.height*3);
    let delta=0;
    for(let j=0;j<expected.width*expected.height;j++)for(let c=0;c<3;c++)delta+=Math.abs(raw[j*3+c]-expected.data[j*4+c]);
    assert.equal(delta,0,'Downloaded PDF must preserve the preview capture pixels');
    if(type==='dtr'&&mode==='desktop')await fs.writeFile('qa/pdf-layout-page.png',PNG.sync.write(expected));
   }
  }
  assert.equal(await page.locator('#document-preview').innerHTML(),originalHTML,'Export must leave the preview intact');
  await page.locator('[data-action="home"]').first().click();
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: DTR and FDTR PDF images preserve preview capture pixels at desktop and mobile sizes; preview unchanged; no browser errors.');
}finally{await browser.close();}
