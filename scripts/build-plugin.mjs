import {build} from 'esbuild';
import path from 'node:path';
import {mkdir,readFile,readdir,writeFile,cp} from 'node:fs/promises';
import {root} from '../src/store.mjs';
import {createHash} from 'node:crypto';

const result=await build({entryPoints:[path.join(root,'src','mcp.mjs')],outfile:path.join(root,'dist','sakura-mcp.mjs'),bundle:true,metafile:true,platform:'node',target:'node22',format:'esm',banner:{js:"import { createRequire as __sakuraCreateRequire } from 'node:module'; const require = __sakuraCreateRequire(import.meta.url);"},legalComments:'eof'});
const voiceRoot=path.join(root,'plugins','sakura-voice-lab');
const motionResult=await build({entryPoints:[path.join(root,'src','motion-mcp.mjs')],outfile:path.join(root,'dist','sakura-motion-mcp.mjs'),bundle:true,metafile:true,platform:'node',target:'node22',format:'esm',banner:{js:"import { createRequire as __motionCreateRequire } from 'node:module'; const require = __motionCreateRequire(import.meta.url);"},legalComments:'eof'});
const voiceResult=await build({entryPoints:[path.join(root,'src','voice-mcp.mjs')],outfile:path.join(voiceRoot,'dist','voice-mcp.mjs'),bundle:true,metafile:true,platform:'node',target:'node22',format:'esm',banner:{js:"import { createRequire as __voiceCreateRequire } from 'node:module'; const require = __voiceCreateRequire(import.meta.url);"},legalComments:'eof'});
await mkdir(path.join(voiceRoot,'scripts'),{recursive:true});
await cp(path.join(root,'scripts','voice-render.py'),path.join(voiceRoot,'scripts','voice-render.py'));
await cp(path.join(root,'scripts','voice-render.ps1'),path.join(voiceRoot,'scripts','voice-render.ps1'));
await cp(path.join(root,'scripts','voice-vieneu.py'),path.join(voiceRoot,'scripts','voice-vieneu.py'));
await cp(path.join(root,'skills','vn-voiceover'),path.join(voiceRoot,'skills','vn-voiceover'),{recursive:true});
await mkdir(path.join(root,'dist','licenses'),{recursive:true});
// Preserve the full notices of every package whose code enters the bundle.
const packages=new Set();
for(const input of new Set([...Object.keys(result.metafile.inputs),...Object.keys(voiceResult.metafile.inputs),...Object.keys(motionResult.metafile.inputs)])){
  const normalized=input.replaceAll('\\','/'),offset=normalized.lastIndexOf('node_modules/');
  if(offset<0)continue;
  const tail=normalized.slice(offset+13).split('/'),count=tail[0].startsWith('@')?2:1;
  packages.add(normalized.slice(0,offset+13)+tail.slice(0,count).join('/'));
}
const notices=[];
for(const relative of [...packages].sort()){
  const directory=path.resolve(root,relative),pkg=JSON.parse(await readFile(path.join(directory,'package.json'),'utf8'));
  const licenses=(await readdir(directory,{withFileTypes:true})).filter(f=>f.isFile()&&/^licen[cs]e(?:[.-].*)?$/i.test(f.name));
  if(!licenses.length&&pkg.name==='@cfworker/json-schema'&&pkg.version==='4.1.1'&&pkg.license==='MIT'){
    const notice=await readFile(path.join(root,'third-party/cfworker-json-schema-4.1.1-LICENSE.txt'));
    if(createHash('sha256').update(notice).digest('hex')!=='376944252ab78ca6b41aee44ddea8894927ee67891e77e61eb9d59af63e35094')throw Error('Reviewed cfworker license notice changed');
    const target='cfworker-json-schema-4.1.1-LICENSE.txt';await writeFile(path.join(root,'dist/licenses',target),notice);
    notices.push(`${pkg.name}@${pkg.version}: MIT; ${target}; upstream provenance in third-party/README.md`);continue;
  }
  if(!licenses.length)throw Error(`License notice missing for ${pkg.name}`);
  for(const file of licenses){
    const target=`${pkg.name.replaceAll('/','-').replace('@','')}-${pkg.version}-${file.name}.txt`;
    await writeFile(path.join(root,'dist','licenses',target),(await readFile(path.join(directory,file.name),'utf8')).trimEnd()+'\n','utf8');
    notices.push(`${pkg.name}@${pkg.version}: ${pkg.license}; ${target}`);
  }
}
await writeFile(path.join(root,'dist','licenses','NOTICE.txt'),notices.join('\n')+'\n','utf8');
for(const name of ['animate-MIT.txt','digitalsamba-video-toolkit-MIT.txt'])await cp(path.join(root,'third-party',name),path.join(root,'dist/licenses',name));
await cp(path.join(root,'dist','licenses'),path.join(voiceRoot,'dist','licenses'),{recursive:true});
console.log('Built dist/sakura-mcp.mjs with dependency notices.');
