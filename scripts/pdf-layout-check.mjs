import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(process.env.RUNTIME_MODULES+'/package.json');
const {chromium}=require('playwright'),{PDFDocument,PDFName}=require('pdf-lib');
const {getDocument}=await import(process.env.RUNTIME_MODULES+'/pdfjs-dist/legacy/build/pdf.mjs');
const browser=await chromium.launch({executablePath:'/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
 await page.goto('http://127.0.0.1:4173/repository-name/');
 await page.evaluate(async()=>{
  const {freshState}=await import('./src/model.js'),s=freshState();
  s.profile.name='TEST FIRST MIDDLE LAST';s.profile.department='TEST DEPARTMENT';s.profile.designation='Faculty';
  for(const type of ['dtr','fdtr']){
   s.setups[type].ready=true;s.setups[type].signatory='ATTY. TEST SIGNATORY NAME';
   s.setups[type].schedule=[{category:type==='dtr'?'laboratory':'class',days:[1,4],start:'18:00',end:'21:00'}];
  }
  s.setups.dtr.official='MTH 6:00PM–9:00PM; T 6:00 PM–8:00PM';s.setups.dtr.regular=s.setups.dtr.official;
  localStorage.setItem('dtr-fdtr-generator-v1',JSON.stringify(s));
 });
 await page.reload();await fs.mkdir('qa',{recursive:true});
 for(const type of ['dtr','fdtr']){
  await page.locator(`[data-action="choose"][data-type="${type}"]`).click();
  await page.locator('#month').fill('2026-09');await page.locator('[data-action="preview"]').click();
  await page.locator('#reviewed:not([disabled])').waitFor();await page.locator('#reviewed').check();
  const originalHTML=await page.locator('#document-preview').innerHTML();let desktopPositions;
  assert.ok((await page.locator('main').innerText()).includes('F4 portrait · 8.5 × 13 in'));
  const wordDownloading=page.waitForEvent('download');await page.locator('[data-action="word"]').click();
  const word=await wordDownloading;const wordPath=`qa/${type}-F4.docx`;await word.saveAs(wordPath);
  const dimensions=await page.evaluate(async bytes=>{
   const zip=await JSZip.loadAsync(new Uint8Array(bytes)),xml=new DOMParser().parseFromString(await zip.file('word/document.xml').async('string'),'application/xml'),ns='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
   return [...xml.getElementsByTagNameNS(ns,'pgSz')].map(p=>[+p.getAttributeNS(ns,'w'),+p.getAttributeNS(ns,'h')]);
  },[...await fs.readFile(wordPath)]);
  assert.ok(dimensions.length);assert.ok(dimensions.every(d=>d[0]===12240&&d[1]===18720),'Word page dimensions must be F4');
  for(const [mode,width] of [['desktop',1280],['mobile',390]]){
   await page.setViewportSize({width,height:900});
   const expected=await page.locator('section.institutional').evaluateAll(pages=>pages.map(p=>{
    const rect=p.getBoundingClientRect(),scale=rect.width/(612/0.75),walker=document.createTreeWalker(p,NodeFilter.SHOW_TEXT),glyphs=[];
    while(walker.nextNode()){
     const node=walker.currentNode;if(!node.textContent.trim())continue;let offset=0;const range=document.createRange();
     for(const text of node.textContent){range.setStart(node,offset);offset+=text.length;range.setEnd(node,offset);const r=range.getBoundingClientRect();if(r.width&&r.height&&!/\s/.test(text))glyphs.push({text,x:(r.left-rect.left)/scale*0.75,top:(r.top-rect.top)/scale*0.75,bottom:(r.bottom-rect.top)/scale*0.75,right:(r.right-rect.left)/scale*0.75});}
    }
    return {fit:+p.dataset.printFit,glyphs};
   }));
   assert.ok(expected.every(p=>p.fit<=1&&p.fit>0),'F4 fitting is visible in preview');
   const downloading=page.waitForEvent('download');await page.locator('[data-action="pdf"]').click();
   const download=await downloading;assert.equal(await download.failure(),null);
   const filename=`qa/${type}-vector-${mode}.pdf`;await download.saveAs(filename);
   const data=await fs.readFile(filename),pdf=await PDFDocument.load(data);assert.equal(pdf.getPageCount(),type==='dtr'?1:2);
   for(const p of pdf.getPages()){assert.ok(Math.abs(p.getWidth()-612)<0.001);assert.ok(Math.abs(p.getHeight()-936)<0.001);}
   const objects=pdf.context.enumerateIndirectObjects().map(([,v])=>v);
   assert.equal(objects.filter(v=>v.dict?.get(PDFName.of('Subtype'))===PDFName.of('Image')).length,0,'Document must contain vector text, not a page image');
   assert.ok(objects.some(v=>v.get?.(PDFName.of('FontFile2'))),'Fonts must be embedded');
   const parsed=await getDocument({data:new Uint8Array(data),disableFontFace:true}).promise,positions=[];
   for(let i=0;i<parsed.numPages;i++){
    const output=await parsed.getPage(i+1),content=await output.getTextContent({disableCombineTextItems:true}),items=content.items.filter(item=>item.str?.trim());
    const text=items.map(item=>item.str).join('').replace(/\s/g,'');
    assert.ok(text.includes('TESTFIRSTMIDDLELAST'),'Selectable name is preserved');
    if(type==='dtr')assert.ok(text.includes('SEPTEMBER1-30,2026'));
    // Compare the independent PDF parser's glyph positions with browser ranges.
    let index=0;
    for(const item of items){let first=true,last;for(const char of item.str){if(/\s/.test(char))continue;
     const glyph=expected[i].glyphs[index++];assert.equal(char,glyph.text);
     if(first)assert.ok(Math.abs(item.transform[4]-glyph.x)<0.15,'Text run starts at its preview position');first=false;last=glyph;
     const baseline=936-item.transform[5];assert.ok(baseline>=glyph.top-0.1&&baseline<=glyph.bottom+0.1,'Text baseline remains inside its preview line');
     positions.push([char,item.transform[4],item.transform[5]]);
    }assert.ok(Math.abs(item.transform[4]+item.width-last.right)<0.3,'Text run width matches preview');}
    assert.equal(index,expected[i].glyphs.length);
   }
   await parsed.destroy();
   if(mode==='desktop')desktopPositions=positions;else{assert.equal(positions.length,desktopPositions.length);positions.forEach((p,i)=>{assert.equal(p[0],desktopPositions[i][0]);for(const c of [1,2])assert.ok(Math.abs(p[c]-desktopPositions[i][c])<0.01,'Screen scale must preserve PDF geometry within 0.01 point');});}
  }
  assert.equal(await page.locator('#document-preview').innerHTML(),originalHTML,'Export leaves the preview intact');
  await page.locator('[data-action="home"]').first().click();
 }
 assert.deepEqual(errors,[]);assert.ok(requests.every(u=>u.startsWith('http://127.0.0.1:4173/')||u.startsWith('data:')));
 console.log('PASS: vector text and lines, embedded fonts, selectable content, F4 page counts, preview glyph positions, identical desktop/mobile PDF geometry, unchanged preview, no external requests.');
}finally{await browser.close();}
