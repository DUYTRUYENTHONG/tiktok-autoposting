import test from 'node:test';
import assert from 'node:assert/strict';
import {isTenDayPolicy,rollingLimits,tenDayReference} from '../src/ten-day-cadence.mjs';
import {dailyKpi} from '../src/daily-kpi.mjs';
import {buildScaleCampaign,bindScaleCreative} from '../src/scale-campaign.mjs';
test('new captions require the exact brand hashtag, without changing accepted captions',async()=>{
 const now='2026-10-28T08:00:00Z',state={campaign:{publicPostCodes:false,requiredHashtags:['#duytruyenthong']},queue:[],posts:[]},item=buildScaleCampaign(state,{now}).items[0];
 for(const [caption,missing] of [['Gọi số điện thoại trong bio #duytruyenthongx',true],['Gọi số điện thoại trong bio #duytruyenthong',false]]){
  const r=await bindScaleCreative(item,{caption,account:'saigomlia',location:item.location,publicPostCodes:false},{state,now});assert.equal(r.readiness.blockers.includes('required_campaign_hashtag_missing'),missing);
 }
});
test('exact ten-day50/day permission rejects shorter spacing and wider dates',()=>{
 const policy={startDay:'2026-11-01',endDay:'2026-11-10',dailyTotal:50,targetTotal:500,targetPhoto:50,targetVideo:0,minSpacingMinutes:15,policyReference:tenDayReference};
 assert.equal(isTenDayPolicy(policy),true);
 for(const delta of [{startDay:'2026-10-31'},{endDay:'2026-11-11'},{minSpacingMinutes:5},{dailyTotal:60},{policyReference:'unapproved'}])assert.equal(isTenDayPolicy({...policy,...delta}),false);
 const state={campaign:{rollingGoal:{...policy,dailyTarget:50}}};
 for(const day of ['2026-11-01','2026-11-10'])assert.deepEqual(rollingLimits(state,day+'T08:00:00+07:00'),{cap:50,spacingMinutes:15});
 for(const day of ['2026-10-31','2026-11-11'])assert.throws(()=>rollingLimits(state,day+'T08:00:00+07:00'),/Outside/);
 assert.deepEqual(rollingLimits({campaign:{rollingGoal:{dailyTarget:20}}},'2026-11-01'),{cap:20,spacingMinutes:20});
});
test('ten-day target counts no proposed rows as scheduled or published',()=>{
 const state={campaign:{dailyTarget:20,dailyTargetSchedule:{fromDay:'2026-11-01',throughDay:'2026-11-10',target:50}},queue:[]};
 for(const day of ['2026-11-01','2026-11-10']){const r=dailyKpi(state,day);assert.equal(r.target,50);assert.equal(r.published,0);assert.equal(r.scheduled,0);assert.equal(r.toPrepare,50);}
 assert.equal(dailyKpi(state,'2026-10-31').target,20);
});
