import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {emptyState} from '../src/engine.mjs';
import {saveState,root} from '../src/store.mjs';
test('additional voice tests are idempotent and preserve the accepted photo queue',async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'voice-plan-')),file=path.join(dir,'campaign.json');
  try{
    const queue=Array.from({length:10},(_,i)=>({id:`sakura-${String(i+29).padStart(3,'0')}`,account:'saigomlia',productId:'sakura-cleaner-500ml',angleId:'a',variantId:'photo',format:'photo',phase:'daily',title:'Tiêu đề',caption:'Góc bếp?\n\nMột tình huống minh họa.\n\nNhắn BẾP029',leadCode:'BẾP029',assets:Array.from({length:5},()=>({path:'fixture.png',sha256:'a'.repeat(64)})),status:'scheduled',receipt:{platformId:String(i+1),scheduledAt:`2026-10-28T${String(i+8).padStart(2,'0')}:00:00+07:00`,scheduledVerifiedAt:'2026-10-27T12:00:00Z'}}));
    await saveState({...emptyState(),queue,angles:[{id:'a',name:'Góc bếp',productId:'sakura-cleaner-500ml',format:'photo'}],campaign:{}},file);
    const run=()=>spawnSync(process.execPath,[path.join(root,'scripts','prepare-voice-tests.mjs')],{env:{...process.env,TIKTOK_CAMPAIGN_FILE:file},encoding:'utf8'});
    assert.equal(run().status,0);assert.equal(run().status,0);
    const state=JSON.parse(await readFile(file,'utf8'));assert.deepEqual(state.queue.slice(0,10),queue);assert.equal(state.queue.length,20);
    const tests=state.queue.slice(10);assert.equal(new Set(tests.map(q=>q.leadCode)).size,10);assert.ok(tests.every(q=>q.format==='video'&&q.phase==='voice-test'&&!q.receipt&&!q.assetsVerified));
    assert.equal(state.angles.find(a=>a.id===tests[0].angleId).format,'video');
    const first=tests[0];first.angleId='sakura-pain-tan-ca-voice';state.campaign.currentPromotion={key:'buy1-get1-tiktok-first50',text:'Mua 1 tặng 1 cho 50 đơn đầu tiên từ TikTok'};await saveState(state,file);assert.equal(run().status,0);
    const limited=JSON.parse(await readFile(file,'utf8'));assert.ok(limited.queue.find(q=>q.id===first.id).caption.startsWith(state.campaign.currentPromotion.text));assert.deepEqual(limited.queue.slice(0,10),queue);
  }finally{await rm(dir,{recursive:true,force:true});}
});
