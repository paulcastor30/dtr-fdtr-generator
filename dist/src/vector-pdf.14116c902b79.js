import {PAPER,CSS_PAPER} from './paper-size.14116c902b79.js';
const fontFiles={regular:'Regular',bold:'Bold',italic:'Italic',boldItalic:'BoldItalic'};
let fontBytesPromise;
function fontBytes(){return fontBytesPromise??=Promise.all(Object.entries(fontFiles).map(async([key,name])=>{
 const response=await fetch(new URL(`../fonts/LiberationSerif-${name}.ttf`,import.meta.url));
 if(!response.ok)throw Error('The print font could not be loaded.');
 return [key,new Uint8Array(await response.arrayBuffer())];
})).then(Object.fromEntries).catch(error=>{fontBytesPromise=null;throw error;});}
// Show the same F4 fit used by the export, including unusually tall browser tables.
export function fitDocumentPages(container){
 for(const page of container.querySelectorAll('section.institutional')){
  const style=getComputedStyle(page),width=page.offsetWidth,height=Math.max(page.offsetHeight,page.scrollHeight);
  const content=document.createElement('div');content.className='form-page-content';
  content.style.cssText=`box-sizing:border-box;width:${width}px;height:${height}px;padding:${style.padding};position:absolute;transform-origin:top left;`;
  while(page.firstChild)content.append(page.firstChild);
  const fit=Math.min(CSS_PAPER.width/width,CSS_PAPER.height/height);
  content.style.transform=`scale(${fit})`;content.style.left=`${(CSS_PAPER.width-width*fit)/2}px`;content.style.top=`${(CSS_PAPER.height-height*fit)/2}px`;
  page.style.width=`${CSS_PAPER.width}px`;page.style.height=`${CSS_PAPER.height}px`;page.style.minHeight='0';page.style.padding='0';page.style.position='relative';
  page.dataset.printFit=String(fit);page.append(content);
 }
}
function color(value){const numbers=value.match(/[\d.]+/g);return numbers?PDFLib.rgb(+numbers[0]/255,+numbers[1]/255,+numbers[2]/255):PDFLib.rgb(0,0,0);}
function textScale(element,page){let scale=1;for(let el=element;el&&el!==page;el=el.parentElement){const t=getComputedStyle(el).transform;if(t!=='none')scale*=new DOMMatrix(t).a;}return scale;}
// Read text positions from the displayed DOM. No second line-wrapping algorithm.
export function measurePage(page){
 const pageRect=page.getBoundingClientRect(),outerScale=pageRect.width/CSS_PAPER.width;
 const local=rect=>({x:(rect.left-pageRect.left)/outerScale,y:(rect.top-pageRect.top)/outerScale,width:rect.width/outerScale,height:rect.height/outerScale});
 const texts=[],lines=new Map(),rectangles=[],baselines=new Map();
 const probe=document.createElement('span'),sample=document.createTextNode('Hg'),marker=document.createElement('span');
 probe.style.cssText='position:fixed;left:-10000px;top:0;white-space:nowrap;visibility:hidden;';
 marker.style.cssText='display:inline-block;width:0;height:0;vertical-align:baseline;';probe.append(sample,marker);document.body.append(probe);
 function baselineOffset(style){
  const key=[style.fontSize,style.fontWeight,style.fontStyle].join('/');
  if(!baselines.has(key)){
   probe.style.fontFamily='FormSerif';probe.style.fontSize=style.fontSize;probe.style.fontWeight=style.fontWeight;probe.style.fontStyle=style.fontStyle;
   const range=document.createRange();range.selectNodeContents(sample);
   baselines.set(key,marker.getBoundingClientRect().top-range.getBoundingClientRect().top);
  }
  return baselines.get(key);
 }
 function line(x1,y1,x2,y2,width,paint){if(width<=0)return;const key=[x1,y1,x2,y2].map(v=>v.toFixed(2)).join(',');if(!lines.has(key)||lines.get(key).width<width)lines.set(key,{x1,y1,x2,y2,width,color:paint});}
 for(const element of page.querySelectorAll('*')){
  const style=getComputedStyle(element);if(style.display==='none'||style.visibility==='hidden')continue;
  const r=local(element.getBoundingClientRect()),scale=textScale(element,page);
  if(style.backgroundColor!=='rgba(0, 0, 0, 0)'&&style.backgroundColor!=='transparent'&&r.width&&r.height)rectangles.push({...r,color:style.backgroundColor});
  for(const edge of ['Top','Right','Bottom','Left']){
   const width=parseFloat(style[`border${edge}Width`])*scale;
   if(!width||['none','hidden'].includes(style[`border${edge}Style`]))continue;
   const paint=style[`border${edge}Color`];
   if(edge==='Top')line(r.x,r.y,r.x+r.width,r.y,width,paint);
   if(edge==='Bottom')line(r.x,r.y+r.height,r.x+r.width,r.y+r.height,width,paint);
   if(edge==='Left')line(r.x,r.y,r.x,r.y+r.height,width,paint);
   if(edge==='Right')line(r.x+r.width,r.y,r.x+r.width,r.y+r.height,width,paint);
  }
 }
 const walker=document.createTreeWalker(page,NodeFilter.SHOW_TEXT);
 while(walker.nextNode()){
  const node=walker.currentNode,element=node.parentElement,style=getComputedStyle(element);
  if(!node.textContent.trim()||style.visibility==='hidden'||style.display==='none')continue;
  const size=parseFloat(style.fontSize),scale=textScale(element,page),font=(+style.fontWeight>=600?'bold':'')+(style.fontStyle==='italic'?'Italic':'');
  const key=font==='boldItalic'?'boldItalic':font==='bold'?'bold':font==='Italic'?'italic':'regular';
  const ascent=baselineOffset(style);
  const range=document.createRange();let offset=0;
  const underlines=new Map();
  for(const character of node.textContent){
   range.setStart(node,offset);offset+=character.length;range.setEnd(node,offset);
   const rect=range.getBoundingClientRect();if(!rect.width||!rect.height)continue;
   const r=local(rect),baseline=r.y+ascent*scale;
   texts.push({text:character,x:r.x,y:baseline,size:size*scale,font:key,color:style.color});
   if(style.textDecorationLine.includes('underline')){
    const row=baseline.toFixed(2),u=underlines.get(row);if(u){u.x=Math.min(u.x,r.x);u.end=Math.max(u.end,r.x+r.width);}else underlines.set(row,{x:r.x,end:r.x+r.width,baseline});
   }
  }
  for(const u of underlines.values())line(u.x,u.baseline+size*scale*0.1,u.end,u.baseline+size*scale*0.1,Math.max(0.5,size*0.05)*scale,style.color);
 }
 probe.remove();
 return {texts,lines:[...lines.values()],rectangles};
}
export async function makePDF(container){
 await document.fonts.ready;
 const sections=[...container.querySelectorAll('section.institutional')];if(!sections.length)throw Error('Open the preview before downloading.');
 const pdf=await PDFLib.PDFDocument.create();pdf.registerFontkit(fontkit);
 const bytes=await fontBytes(),fonts={};
 for(const [key,data]of Object.entries(bytes))fonts[key]=await pdf.embedFont(data,{subset:true});
 for(const section of sections){
  const page=pdf.addPage([PAPER.width,PAPER.height]),layout=measurePage(section),pt=0.75;
  for(const r of layout.rectangles)page.drawRectangle({x:r.x*pt,y:PAPER.height-(r.y+r.height)*pt,width:r.width*pt,height:r.height*pt,color:color(r.color)});
  for(const l of layout.lines)page.drawLine({start:{x:l.x1*pt,y:PAPER.height-l.y1*pt},end:{x:l.x2*pt,y:PAPER.height-l.y2*pt},thickness:l.width*pt,color:color(l.color)});
  for(const t of layout.texts)page.drawText(t.text,{x:t.x*pt,y:PAPER.height-t.y*pt,size:t.size*pt,font:fonts[t.font],color:color(t.color)});
 }
 return new Blob([await pdf.save()],{type:'application/pdf'});
}
