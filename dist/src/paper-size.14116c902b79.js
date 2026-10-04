// Institution-required F4 portrait. One definition for Word, preview, and PDF.
const widthMM=215.9,heightMM=330.2;
export const PAPER={name:'F4',widthMM,heightMM,width:widthMM*72/25.4,height:heightMM*72/25.4,wordWidth:Math.round(widthMM*1440/25.4),wordHeight:Math.round(heightMM*1440/25.4),label:'F4 portrait · 8.5 × 13 in'};
export const CSS_PAPER={width:PAPER.width/0.75,height:PAPER.height/0.75};
