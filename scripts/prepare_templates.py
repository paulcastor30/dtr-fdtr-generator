from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from copy import deepcopy
import json,hashlib,argparse,re
parser=argparse.ArgumentParser();parser.add_argument("--dtr",required=True);parser.add_argument("--fdtr",required=True);args=parser.parse_args()
from lxml import etree as E
from docx import Document
from docx.shared import Pt, Inches, Mm
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.table import WD_TABLE_ALIGNMENT,WD_CELL_VERTICAL_ALIGNMENT,WD_ROW_HEIGHT_RULE
from docx.enum.text import WD_ALIGN_PARAGRAPH
from openpyxl import load_workbook
ROOT=Path(__file__).resolve().parents[1]
W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';N={'w':W}
def el(tag,**attrs):
 x=E.Element('{%s}%s'%(W,tag))
 for k,v in attrs.items():x.set('{%s}%s'%(W,k),str(v))
 return x
def text(p,value):
 rpr=p.find('.//w:rPr',N);rpr=deepcopy(rpr) if rpr is not None else el('rPr')
 for c in list(p):
  if c.tag!='{%s}pPr'%W:p.remove(c)
 r=el('r');r.append(rpr);t=el('t');t.text=value;t.set('{http://www.w3.org/XML/1998/namespace}space','preserve');r.append(t);p.append(r)
def setp(p,value,size=10,bold=False):
 text(p,value)
 pp=p.find('w:pPr',N)
 if pp is None: pp=el('pPr');p.insert(0,pp)
 for x in list(pp):
  if E.QName(x).localname in ['jc','spacing','tabs','ind']:pp.remove(x)
 pp.append(el('spacing',before=0,after=0,line=240,lineRule='exact'));pp.append(el('jc',val='left'))
 for rpr in p.findall('.//w:rPr',N):
  for x in list(rpr):
   if E.QName(x).localname in ['sz','szCs','u']:rpr.remove(x)
  rpr.append(el('sz',val=round(size*2)));rpr.append(el('szCs',val=round(size*2)))
  if bold:rpr.append(el('b'))
source=Path(args.dtr)
with ZipFile(source) as z:
 parts={n:z.read(n) for n in z.namelist()}
d=E.fromstring(parts['word/document.xml']);body=d.find('w:body',N);children=list(body);sect=deepcopy(children[-1]);pg=sect.find('w:pgSz',N);pg.set(qn('w:w'),'12240');pg.set(qn('w:h'),'18720');cols=sect.find('w:cols',N);sect.remove(cols)
for c in list(body):body.remove(c)
outer=el('tbl');pr=el('tblPr');pr.append(el('tblW',w=10466,type='dxa'));pr.append(el('tblLayout',type='fixed'));pr.append(el('tblInd',w=0,type='dxa'));mar=el('tblCellMar')
for side in ['top','left','bottom','right']:mar.append(el(side,w=0,type='dxa'))
pr.append(mar);outer.append(pr);grid=el('tblGrid')
for w in [5063,340,5063]:grid.append(el('gridCol',w=w))
outer.append(grid);row=el('tr');outer.append(row)
for copy_index,indices in enumerate([range(0,18),range(19,35)]):
 if copy_index:
  gap=el('tc');gp=el('tcPr');gp.append(el('tcW',w=340,type='dxa'));gap.append(gp);gap.append(el('p'));row.append(gap)
 tc=el('tc');tcp=el('tcPr');tcp.append(el('tcW',w=5063,type='dxa'));tc.append(tcp);row.append(tc)
 for i in indices:
  c=deepcopy(children[i]);s=''.join(c.xpath('.//w:t/text()',namespaces=N))
  if c.tag==qn('w:tbl'):
   widths=[round(v*5063/5024) for v in [678,573,576,1139,1139,919]]
   for node,w in zip(c.findall('w:tblGrid/w:gridCol',N),widths):node.set(qn('w:w'),str(w))
   rows=c.findall('w:tr',N);normal=deepcopy(rows[1])
   for rr in rows[1:]:c.remove(rr)
   for day in range(1,32):
    rr=deepcopy(normal)
    for ci,cell in enumerate(rr.findall('w:tc',N)):
     text(cell.find('w:p',N),'{{D%d}}'%day if ci==0 else '{{D%d_%d}}'%(day,ci-1))
    c.append(rr)
   for rr in c.findall('w:tr',N):
    trp=rr.find('w:trPr',N)
    if trp is None:trp=el('trPr');rr.insert(0,trp)
    for h in trp.findall('w:trHeight',N):trp.remove(h)
    trp.append(el('trHeight',val=320,hRule='exact'));trp.append(el('cantSplit'))
    pos=0
    for ci,cell in enumerate(rr.findall('w:tc',N)):
     tcp=cell.find('w:tcPr',N);span=tcp.find('w:gridSpan',N);span=int(span.get(qn('w:val'))) if span is not None else 1
     cw=tcp.find('w:tcW',N);cw.set(qn('w:type'),'dxa');cw.set(qn('w:w'),str(sum(widths[pos:pos+span])));pos+=span
     p=cell.find('w:p',N);setp(p,''.join(p.xpath('.//w:t/text()',namespaces=N)),9)
     p.find('w:pPr/w:jc',N).set(qn('w:val'),'center')
     if rr is not c.findall('w:tr',N)[0] and ci in [1,2]:
      for sz in p.findall('.//w:sz',N):sz.set(qn('w:val'),'16')
      p.find('w:pPr/w:spacing',N).set(qn('w:line'),'150')
      margins=tcp.find('w:tcMar',N)
      if margins is not None:
       for edge in margins:edge.set(qn('w:w'),'0')
   c.find('w:tblPr/w:tblW',N).set(qn('w:type'),'dxa');c.find('w:tblPr/w:tblW',N).set(qn('w:w'),'5063')
   tc.append(c);continue
  if i in [0,19]:setp(c,'Name:   {{NAME}}',10)
  elif i in [1,20]:setp(c,'Month:   {{MONTH}}',10)
  elif i in [2,21]:setp(c,'Official hours for: {{OFFICIAL}}',9)
  elif i in [3,22]:setp(c,'Regular days: {{REGULAR}}',9)
  elif i in [4,23]:setp(c,'Saturdays: {{SATURDAY}}',10)
  elif i in [5,24]:setp(c,'Sundays: {{SUNDAY}}',10)
  elif i in [8,27]:setp(c,'LEC – {{LEC}}             LAB – {{LAB}}',10,True)
  elif i in [15,32]:setp(c,'{{NAME}}       {{SIGNATORY}}',8)
  elif i in [16,33]:setp(c,' CERTIFIED as the                     In – charge',9)
  elif i in [17,34]:setp(c,'prescribed office hours',9)
  else:setp(c,s,8 if s else 8)
  if i in [0,19,1,20,15,32]:
   run=c.find('w:r',N);value=run.find('w:t',N).text
   if i in [0,19,1,20]:
    label,slot=value.split('{{',1);run.find('w:t',N).text=label
    fieldrun=deepcopy(run);fieldrun.find('w:t',N).text='{{'+slot;fieldrun.find('w:rPr',N).append(el('u',val='single'));c.append(fieldrun)
   else:run.find('w:rPr',N).append(el('u',val='single'))
  tc.append(c)
 if tc[-1].tag!=qn('w:p'):tc.append(el('p'))
body.append(outer);end=el('p');pp=el('pPr');pp.append(el('spacing',after=0,before=0,line=20,lineRule='exact'));end.append(pp);body.append(end);body.append(sect)
parts['word/document.xml']=E.tostring(d,xml_declaration=True,encoding='UTF-8',standalone=True)
# Remove personal package metadata and thumbnails; the original file stays untouched.
for part in ['docProps/core.xml','docProps/app.xml']:
 if part in parts:
  root=E.fromstring(parts[part])
  for node in root:
   if E.QName(node).localname in ['creator','lastModifiedBy','Company','Manager']:node.text=''
  parts[part]=E.tostring(root,xml_declaration=True,encoding='UTF-8',standalone=True)
with ZipFile(ROOT/'public/templates/dtr.docx','w',ZIP_DEFLATED) as z:
 for n,b in parts.items():
  if n.startswith('docProps/thumbnail'):continue
  z.writestr(n,b)
# FDTR: convert source's real grid, styles, and merges to native Word tables.
s=load_workbook(args.fdtr).active
doc=Document();sec=doc.sections[0];sec.page_width=Inches(8.5);sec.page_height=Inches(13);sec.top_margin=Inches(.5);sec.bottom_margin=Inches(.5);sec.left_margin=Inches(.3);sec.right_margin=Inches(.25)
doc.styles['Normal'].font.name='Times New Roman';doc.styles['Normal'].font.size=Pt(7.5);doc.styles['Normal'].paragraph_format.space_after=Pt(0)
for page,(start,end) in enumerate([(1,58),(63,123)]):
 if page:doc.add_page_break()
 table=doc.add_table(rows=end-start+1,cols=14);table.autofit=False;table.alignment=WD_TABLE_ALIGNMENT.CENTER
 table._tbl.tblPr.find(qn('w:tblW')).set(qn('w:type'),'dxa');table._tbl.tblPr.find(qn('w:tblW')).set(qn('w:w'),'11116')
 for col in table.columns:col.width=Pt(39.685)
 for row in table.rows:
  row.height=Pt(12);row.height_rule=WD_ROW_HEIGHT_RULE.EXACTLY
  trpr=row._tr.get_or_add_trPr();trpr.append(el('cantSplit'))
  for cell in row.cells:
   cell.width=Pt(39.685);cell.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
   margin=el('tcMar')
   for side in ['top','left','bottom','right']:margin.append(el(side,w=0,type='dxa'))
   cell._tc.get_or_add_tcPr().append(margin)
 for r in range(start,end+1):
  for col in range(1,15):
   src=s.cell(r,col);cell=table.cell(r-start,col-1);p=cell.paragraphs[0];p.paragraph_format.space_after=Pt(0);p.paragraph_format.space_before=Pt(0);p.paragraph_format.line_spacing=Pt(9)
   p.alignment={'center':WD_ALIGN_PARAGRAPH.CENTER,'right':WD_ALIGN_PARAGRAPH.RIGHT}.get(src.alignment.horizontal,WD_ALIGN_PARAGRAPH.LEFT)
   v='' if src.value is None else str(src.value);v='' if r in range(14,59) or r in range(67,115) else v
   mapping={'A7':'For the month of {{MONTH}}','A9':'NAME: {{NAME}}','I9':'DEPARTMENT: {{DEPARTMENT}}','A116':'of Technology during the month of {{MONTH_TITLE}}.','B120':'{{SIGNATURE_NAME}}','B122':'{{DESIGNATION}}','I121':'{{SIGNATORY}}'}
   v=mapping.get(src.coordinate,v)
   run=p.add_run(v);run.font.name='Times New Roman';run.font.size=Pt((src.font.sz or 10)*.75);run.bold=src.font.b;run.italic=src.font.i;run.underline=bool(src.font.u)
   borders=el('tcBorders')
   for side in ['left','right','top','bottom']:
    edge=getattr(src.border,side);borders.append(el(side,val='single' if edge and edge.style else 'nil',sz=4,color='000000'))
   cell._tc.get_or_add_tcPr().append(borders)
 # Preserve source header/footer merges. Daily groups normalized from a populated day.
 merges=[]
 for m in s.merged_cells.ranges:
  if m.min_row<start or m.max_row>end:continue
  if (14<=m.min_row<=58) or (67<=m.min_row<=114):continue
  merges.append((m.min_row,m.min_col,m.max_row,m.max_col))
 merges += ([(9,1,9,8)] if page==0 else [(115,2,115,14),(116,1,116,14)])
 for a,b,c,e in merges:
  first=table.cell(a-start,b-1);value=first.text;merged=first.merge(table.cell(c-start,e-1));setp(merged._tc.find('w:p',N),value,(s.cell(a,b).font.sz or 10)*.75, bool(s.cell(a,b).font.b))
  merged._tc.find('w:p/w:pPr/w:jc',N).set(qn('w:val'),s.cell(a,b).alignment.horizontal or 'left')
 for day in range(1 if page==0 else 16,16 if page==0 else 32):
  rr=14+(day-1)*3 if page==0 else 67+(day-16)*3
  for col in [0,13]:
   cc=table.cell(rr-start,col).merge(table.cell(rr-start+2,col));text(cc.paragraphs[0]._p,'{{DAY%d}}'%day if col==0 else '{{TOTAL%d}}'%day)
  for slot in range(3):
   for cat in range(4):
    for k,key in enumerate(['in','out','hours']):
     cell=table.cell(rr-start+slot,1+cat*3+k);text(cell.paragraphs[0]._p,'{{F%d_%d_%d_%s}}'%(day,cat,slot,key))
     cell.paragraphs[0].alignment=WD_ALIGN_PARAGRAPH.CENTER
     borders=cell._tc.get_or_add_tcPr().find(qn('w:tcBorders'))
     for b in borders:b.set(qn('w:val'),'single')
     for rpr in cell._tc.findall('.//w:rPr',N):
      for sz in rpr.findall('w:sz',N):sz.set(qn('w:val'),'15')
 for cell in table._tbl.findall('.//w:tc',N):
  paras=cell.findall('w:p',N)
  for extra in paras[1:]:cell.remove(extra)
 for p in table._tbl.findall('.//w:p',N):
  pp=p.find('w:pPr',N)
  if pp is not None:
   spacing=pp.find('w:spacing',N)
   if spacing is not None:spacing.set(qn('w:line'),'180');spacing.set(qn('w:lineRule'),'exact')
doc.core_properties.author='';doc.core_properties.last_modified_by='';doc.save(ROOT/'public/templates/fdtr.docx')
# Private source-month fixture (not part of deployable output).
name=str(s['A9'].value).split(':',1)[1].strip()
profile={'name':name,'department':str(s['I9'].value).split(':',1)[1].strip(),'signatureName':str(s['B120'].value),'designation':str(s['B122'].value)}
signature_line=next(p.text for p in Document(source).paragraphs if p.text.startswith(name+'   '))
fixture={'profile':profile,'signatories':{'dtr':signature_line[len(name):].strip(),'fdtr':str(s['I121'].value)},'dtr':{},'fdtr':{}}
for day in range(1,32):
 rr=14+(day-1)*3 if day<=15 else 67+(day-16)*3
 sessions=[]
 for cat in range(4):
  for slot in range(3):
   a=s.cell(rr+slot,2+cat*3).value;b=s.cell(rr+slot,3+cat*3).value
   if hasattr(a,'hour') and hasattr(b,'hour'):
    h1=a.hour+(12 if day in [17,24] and cat==3 else 0);h2=b.hour+(12 if day in [17,24] and cat==3 else 0)
    sessions.append({'category':['class','consultation','related','others'][cat],'start':f'{h1:02}:{a.minute:02}','end':f'{h2:02}:{b.minute:02}'})
 label=s.cell(rr,2).value
 fixture['fdtr'][str(day)]={'sessions':sessions,'label':label if label in ['HOLIDAY','SATURDAY','SUNDAY'] else ''}
from docx import Document as D
for i,row in enumerate(D(source).tables[0].rows[1:],1):
 cs=[c.text for c in row.cells];sessions=[]
 if cs[3].endswith('PM'):
  import datetime
  cv=lambda x:datetime.datetime.strptime(x,'%I:%M %p').strftime('%H:%M')
  sessions=[{'category':'lecture' if cs[5].startswith('2') else 'laboratory','start':cv(cs[3]),'end':cv(cs[4])}]
 fixture['dtr'][str(i)]={'sessions':sessions,'label':cs[1] if cs[1] in ['HOLIDAY','SATURDAY','SUNDAY'] else ''}
(ROOT/'qa/august-fixture.json').write_text(json.dumps(fixture,indent=2))
(ROOT/'qa/source-hashes.json').write_text(json.dumps({str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in [source,Path(args.fdtr)]},indent=2))
print('Prepared sanitized F4 templates and private QA fixture')
