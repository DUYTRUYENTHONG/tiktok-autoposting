import test from 'node:test';
import assert from 'node:assert/strict';
import {vietnamDay,dailyKpi,planDailySlots} from '../src/daily-kpi.mjs';

test('Vietnam calendar day handles UTC midnight boundary',()=>{
  assert.equal(vietnamDay('2026-10-27T18:00:00Z'),'2026-10-28');
});
test('dated30/day target applies only inside the authorized window and rejects malformed policy',()=>{
  const state={campaign:{dailyTarget:20,dailyTargetSchedule:{fromDay:'2026-10-31',throughDay:'2026-11-29',target:30}},queue:[]};
  for(const day of ['2026-10-31','2026-11-29'])assert.equal(dailyKpi(state,day).target,30);
  for(const day of ['2026-10-30','2026-11-30'])assert.equal(dailyKpi(state,day).target,20);
  assert.equal(dailyKpi(state,'2026-10-31').published,0);
  state.campaign.dailyTargetSchedule.fromDay='2026-02-31';assert.throws(()=>dailyKpi(state,'2026-10-31'),/dated daily target/);
});
test('daily quota counts unique verified publications and preserved schedules separately',()=>{
  const state={campaign:{dailyTarget:20},queue:[
    {id:'a',status:'published',receipt:{platformId:'1',publishedAt:'2026-10-27T09:00:00+07:00',publishedVerifiedAt:'2026-10-27T02:01:00Z'}},
    {id:'duplicate',status:'published',receipt:{platformId:'1',publishedAt:'2026-10-27T09:00:00+07:00',publishedVerifiedAt:'2026-10-27T02:01:00Z'}},
    {id:'b',status:'scheduled',receipt:{platformId:'2',scheduledAt:'2026-10-27T19:00:00+07:00',scheduledVerifiedAt:'2026-10-27T02:01:00Z'}},
    {id:'c',status:'under_review',receipt:{platformId:'3',submittedVerifiedAt:'2026-10-27T02:05:00Z'}},
    {id:'stale-c',status:'under_review',receipt:{platformId:'2',submittedVerifiedAt:'2026-10-27T02:05:00Z'}},
    {id:'d',status:'published',receipt:null}
  ]};
  const result=dailyKpi(state,'2026-10-27');
  assert.equal(result.published,1);assert.equal(result.scheduled,1);assert.equal(result.underReview,1);
  assert.equal(result.toPrepare,17);assert.equal(result.toPublish,19);
});
test('daily planner includes existing schedules and excludes past/nearby slots',()=>{
  const state={campaign:{dailyTarget:3},queue:[{status:'scheduled',receipt:{platformId:'1',scheduledAt:'2026-10-28T12:00:00+07:00',scheduledVerifiedAt:'2026-10-27T02:00:00Z'}}]};
  const result=planDailySlots(state,'2026-10-28',new Date('2026-10-27T10:00:00Z'));
  assert.equal(result.slots.length,2);assert.ok(result.slots.every(t=>Math.abs(Date.parse(t)-Date.parse('2026-10-28T12:00:00+07:00'))>=20*60000));
  assert.equal(planDailySlots(state,'2026-10-27',new Date('2026-10-27T17:00:00Z')).slots.length,0);
});
test('an uncertain submission blocks planning to avoid duplicates',()=>{
  const result=planDailySlots({queue:[{id:'x',status:'submitting'}]},'2026-10-28');
  assert.deepEqual(result.blockedBy,['x']);assert.equal(result.slots.length,0);
});
