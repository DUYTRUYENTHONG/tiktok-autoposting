import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {ingestFolder, loadState, saveState, updateState} from '../src/store.mjs';
import {emptyState,mergeImport} from '../src/engine.mjs';

test('folder intake keeps facts and references, excludes hidden/private files',async()=>{
  const root=await mkdtemp(path.join(tmpdir(),'tiktok-intake-'));
  try{
    await mkdir(path.join(root,'san-pham')); await mkdir(path.join(root,'.private'));
    await writeFile(path.join(root,'san-pham','product.json'),JSON.stringify({name:'Nước rửa',price:35000}));
    await writeFile(path.join(root,'san-pham','anh.jpg'),'fixture');
    await writeFile(path.join(root,'.private','secret.jpg'),'private');
    const result=await ingestFolder(root,'TP.HCM');
    assert.equal(result.length,1); assert.equal(result[0].name,'Nước rửa');
    assert.equal(result[0].facts.price,35000); assert.equal(result[0].assets.length,1);
    assert.match(result[0].assets[0].sha256,/^[a-f0-9]{64}$/);
    await writeFile(path.join(root,'san-pham','product.json'),JSON.stringify({name:'Tên mới'}));
    assert.equal((await ingestFolder(root,'TP.HCM'))[0].id,result[0].id);
  }finally{await rm(root,{recursive:true,force:true});}
});
test('state persists in selected file and repeated snapshots are idempotent',async()=>{
  const root=await mkdtemp(path.join(tmpdir(),'tiktok-state-')); const file=path.join(root,'state.json');
  try{
    let state=emptyState();
    const input={posts:[{id:'p',format:'video',publishedAt:'2026-10-20T00:00:00Z'}],snapshots:[{postId:'p',observedAt:'2026-10-21T00:00:00Z',views:50,source:'TikTok Studio'}]};
    state=mergeImport(state,input); state=mergeImport(state,input);
    assert.equal(state.snapshots.length,1); await saveState(state,file);
    assert.equal((await loadState(file)).snapshots.length,1);
    await Promise.all([updateState(s=>({...s,marker:'one'}),file),updateState(s=>({...s,other:'two'}),file)]);
    const final=JSON.parse(await readFile(file,'utf8'));
    assert.equal(final.marker,'one'); assert.equal(final.other,'two');
  }finally{await rm(root,{recursive:true,force:true});}
});
