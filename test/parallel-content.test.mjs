import {test} from 'node:test';
import assert from 'node:assert/strict';
import {runBounded,validateContentJobs} from '../src/parallel-content.mjs';

test('rejects duplicates before launching any content jobs',()=>{
  assert.throws(()=>validateContentJobs([{id:'one',query:'a'},{id:'one',query:'b'}]),/unique/);
  assert.throws(()=>validateContentJobs([{id:'../unsafe',query:'a'}]),/unique/);
  assert.throws(()=>validateContentJobs([{id:'one',query:'Nước lau'},{id:'two',query:' nước  lau '}]),/distinct/);
});

test('bounds concurrency, preserves input order and isolates failures',async()=>{
  const jobs=Array.from({length:8},(_,i)=>({id:`job-${i}`}));
  let active=0,max=0;
  const result=await runBounded(jobs,async job=>{
    active++;max=Math.max(max,active);
    await new Promise(resolve=>setTimeout(resolve,5));
    active--;
    if(job.id==='job-2')throw Error('isolated');
    return job.id;
  },3);
  assert.equal(max,3);
  assert.deepEqual(result.map(r=>r.id),jobs.map(j=>j.id));
  assert.equal(result[2].status,'failed');
  assert.equal(result.filter(r=>r.status==='completed').length,7);
});
