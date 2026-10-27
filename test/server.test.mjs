import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {createServer} from '../src/server.mjs';
import {saveState} from '../src/store.mjs';
import {emptyState} from '../src/engine.mjs';

test('dashboard is read-only, rejects DNS rebinding, does not expose arbitrary files',async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'tiktok-http-'));const file=path.join(dir,'state.json');
  const state=emptyState();state.products=[{id:'x',name:'Sakura',facts:{},sourceDirectory:'private-path',assets:[{path:'private-file',name:'photo.png'}]}];
  await saveState(state,file);const server=createServer(file);await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base=`http://127.0.0.1:${server.address().port}`;
  try{
    const api=await fetch(`${base}/api/state`);assert.equal(api.status,200);assert.equal(api.headers.get('access-control-allow-origin'),null);
    const data=await api.json();assert.equal(data.products[0].sourceDirectory,undefined);assert.equal(data.products[0].assets[0].path,undefined);
    assert.equal((await fetch(`${base}/api/state`,{method:'POST'})).status,405);
    assert.equal((await fetch(`${base}/state/campaign.json`)).status,404);
    const rebound=await new Promise((resolve,reject)=>{const req=http.get(base,{headers:{Host:'evil.example'}},res=>{res.resume();resolve(res.statusCode);});req.on('error',reject);});
    assert.equal(rebound,403);
    const page=await fetch(base);assert.equal(page.status,200);assert.match(await page.text(),/lang="vi"/);
  }finally{await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
});
