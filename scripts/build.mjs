import {mkdir,cp,rm,readdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
// Version the entire module graph together: refreshed pages cannot mix an older
// raster exporter with a newer preview.
async function inventory(root){
 const files=[];for(const entry of await readdir(root,{withFileTypes:true})){
  const path=`${root}/${entry.name}`;if(entry.isDirectory())files.push(...await inventory(path));else files.push(path);
 }return files.sort();
}
const files=[...await inventory('src'),...await inventory('public')],hash=createHash('sha256');
for(const file of files){hash.update(file);hash.update(await readFile(file));}
const version=hash.digest('hex').slice(0,12),modules=(await readdir('src')).filter(n=>n.endsWith('.js'));
const versioned=name=>name.replace(/\.(js|css)$/,`.${version}.$1`);
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});
await cp('public','dist',{recursive:true});await cp('src','dist/src',{recursive:true});
for(const name of modules){
 let code=await readFile(`src/${name}`,'utf8');
 for(const dependency of modules)code=code.replaceAll(`'./${dependency}'`,`'./${versioned(dependency)}'`).replaceAll(`"./${dependency}"`,`"./${versioned(dependency)}"`);
 code=code.replace('`../templates/${type}.docx`','`../templates/${type}.docx?v='+version+'`');
 await writeFile(`dist/src/${versioned(name)}`,code);
}
await cp('src/style.css',`dist/src/${versioned('style.css')}`);
let html=await readFile('public/index.html','utf8');
html=html.replace('./src/app.js',`./src/${versioned('app.js')}`).replace('./src/style.css',`./src/${versioned('style.css')}`);
html=html.replace(/src="(\.\/vendor\/[^"?]+)"/g,`src="$1?v=${version}"`);
html=html.replace('</head>',`<meta name="app-build" content="${version}"></head>`);
await writeFile('dist/index.html',html);await writeFile('dist/build.json',JSON.stringify({version,paper:'F4 8.5 x 13 inches',pdf:'vector'},null,2)+'\n');
console.log(`Static application built in dist/ (release ${version})`);
