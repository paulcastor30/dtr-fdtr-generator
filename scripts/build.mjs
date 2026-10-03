import {mkdir,cp,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true}); await mkdir('dist',{recursive:true});
await cp('public','dist',{recursive:true});await cp('src','dist/src',{recursive:true});
console.log('Static application built in dist/');
