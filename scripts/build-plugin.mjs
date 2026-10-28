import {build} from 'esbuild';
import path from 'node:path';
import {mkdir,readFile,readdir,writeFile,cp} from 'node:fs/promises';
import {root} from '../src/store.mjs';

const result=await build({entryPoints:[path.join(root,'src','mcp.mjs')],outfile:path.join(root,'dist','sakura-mcp.mjs'),bundle:true,metafile:true,platform:'node',target:'node22',format:'esm',banner:{js:"import { createRequire as __sakuraCreateRequire } from 'node:module'; const require = __sakuraCreateRequire(import.meta.url);"},legalComments:'eof'});
const voiceRoot=path.join(root,'plugins','sakura-voice-lab');
await build({entryPoints:[path.join(root,'src','voice-mcp.mjs')],outfile:path.join(voiceRoot,'dist','voice-mcp.mjs'),bundle:true,platform:'node',target:'node22',format:'esm',banner:{js:"import { createRequire as __voiceCreateRequire } from 'node:module'; const require = __voiceCreateRequire(import.meta.url);"},legalComments:'eof'});
await mkdir(path.join(voiceRoot,'scripts'),{recursive:true});
await cp(path.join(root,'scripts','voice-render.py'),path.join(voiceRoot,'scripts','voice-render.py'));
await cp(path.join(root,'scripts','voice-render.ps1'),path.join(voiceRoot,'scripts','voice-render.ps1'));
await cp(path.join(root,'scripts','voice-vieneu.py'),path.join(voiceRoot,'scripts','voice-vieneu.py'));
await cp(path.join(root,'skills','vn-voiceover'),path.join(voiceRoot,'skills','vn-voiceover'),{recursive:true});
await mkdir(path.join(root,'dist','licenses'),{recursive:true});
// Preserve the full notices of every package whose code enters the bundle.
const packages=new Set();
for(const input of Object.keys(result.metafile.inputs)){
  const normalized=input.replaceAll('\\','/'),offset=normalized.lastIndexOf('node_modules/');
  if(offset<0)continue;
  const tail=normalized.slice(offset+13).split('/'),count=tail[0].startsWith('@')?2:1;
  packages.add(normalized.slice(0,offset+13)+tail.slice(0,count).join('/'));
}
const notices=[];
for(const relative of [...packages].sort()){
  const directory=path.resolve(root,relative),pkg=JSON.parse(await readFile(path.join(directory,'package.json'),'utf8'));
  const licenses=(await readdir(directory,{withFileTypes:true})).filter(f=>f.isFile()&&/^licen[cs]e(?:[.-].*)?$/i.test(f.name));
  if(!licenses.length)throw Error(`License notice missing for ${pkg.name}`);
  for(const file of licenses){
    const target=`${pkg.name.replaceAll('/','-').replace('@','')}-${pkg.version}-${file.name}.txt`;
    await writeFile(path.join(root,'dist','licenses',target),(await readFile(path.join(directory,file.name),'utf8')).trimEnd()+'\n','utf8');
    notices.push(`${pkg.name}@${pkg.version}: ${pkg.license}; ${target}`);
  }
}
await writeFile(path.join(root,'dist','licenses','NOTICE.txt'),notices.join('\n')+'\n','utf8');
await cp(path.join(root,'dist','licenses'),path.join(voiceRoot,'dist','licenses'),{recursive:true});
console.log('Built dist/sakura-mcp.mjs with dependency notices.');
