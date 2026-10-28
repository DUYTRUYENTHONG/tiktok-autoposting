import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {emptyState} from '../src/engine.mjs';
import {saveState,root,hashFile} from '../src/store.mjs';

test('reviewed cover import preserves times and refuses to rewrite accepted posts',async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'sakura-covers-'));
  const file=path.join(dir,'campaign.json'),manifest=path.join(dir,'review.json'),output=path.join(dir,'upload.json'),image=path.join(dir,'new.png');
  try{
    await writeFile(image,Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aF1cAAAAASUVORK5CYII=','base64'));
    const assets=Array.from({length:5},()=>({path:'old.png',kind:'image',sha256:'b'.repeat(64)}));
    const item={id:'sakura-900',productId:'p',angleId:'a',phase:'daily',publishAt:'2026-10-28T09:40:00+07:00',status:'needs_generation',assets,requiresFreshCover:true};
    const state={...emptyState(),queue:[item,{...item,id:'sakura-901',status:'scheduled',receipt:{platformId:'accepted'}}]};
    await saveState(state,file);
    const entry={id:item.id,destination:image,visuallyVerified:true};
    await writeFile(manifest,JSON.stringify([entry]));
    const run=()=>spawnSync(process.execPath,[path.join(root,'scripts','register-covers.mjs'),manifest],{cwd:root,encoding:'utf8',env:{...process.env,TIKTOK_CAMPAIGN_FILE:file,TIKTOK_UPLOAD_MANIFEST_FILE:output}});
    assert.equal(run().status,0);assert.equal(run().status,0);
    const updated=JSON.parse(await readFile(file,'utf8'));
    assert.equal(updated.queue[0].publishAt,item.publishAt);
    assert.equal(updated.queue[0].assets[0].sha256,await hashFile(image));
    assert.equal(updated.queue[0].assetsVerified,true);
    assert.equal(JSON.parse(await readFile(output,'utf8')).length,1);
    await writeFile(manifest,JSON.stringify([{...entry,id:'sakura-901'}]));
    assert.notEqual(run().status,0);
    assert.equal(JSON.parse(await readFile(file,'utf8')).queue[1].assets[0].sha256,'b'.repeat(64));
  }finally{await rm(dir,{recursive:true,force:true});}
});
