import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {buildScaleCampaign,bindScaleCreative,scalePostHash} from '../src/scale-campaign.mjs';
import {tenDayReference} from '../src/ten-day-cadence.mjs';
import {hashFile} from '../src/store.mjs';
test('five-image native adaptation is scoped, hash-bound, ordered and cannot claim attached voice',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'five-photo-'));try{
  const now='2026-10-31T10:00:00Z',state={campaign:{publicPostCodes:false,requiredHashtags:['#duytruyenthong'],rollingGoal:{policyReference:tenDayReference,startDay:'2026-11-01',endDay:'2026-11-10',dailyTarget:50,minSpacingMinutes:15}},queue:[],posts:[]};
  const original=buildScaleCampaign(state,{now:'2026-10-28T08:00:00Z'}).items[0],item={...original,proposedPublishAt:'2026-11-01T08:00:00+07:00',scheduleRevision:{policyKind:'scale-rolling-policy',policyReference:tenDayReference,originalPublishAt:original.proposedPublishAt}};
  const assets=[];for(let i=0;i<5;i++){const file=path.join(dir,'fixture-'+i+'.png');await fs.writeFile(file,'synthetic test fixture '+i);assets.push({path:file,sha256:await hashFile(file),order:i+1});}
  const evidence={account:item.account,location:item.location,publicPostCodes:false,caption:'Gọi số điện thoại trong bio để được tư vấn. #duytruyenthong',assets,spokenScript:'',photoStory:{adapter:'native-five-photo-v1',sourceIntentHash:item.intentHash,assetCount:5,voiceOverAttached:false},demoKind:'product_identity',authenticProductReferenceVerified:true,music:{soundId:'7700000000000000009',availableInAccount:true,selectedInUi:true,businessUseVerified:true,verifiedAt:now},scheduleWindow:{account:item.account,format:'photo',verified:true,verifiedAt:now,earliest:'2026-11-01T00:00:00+07:00',latest:'2026-11-10T23:55:00+07:00'}};
  evidence.photoTitle='Lau hoài vẫn còn vệt?';
  const review=e=>{const postHash=scalePostHash(item,e);return {...e,visualReview:{verified:true,postHash,verifiedAt:now},offerReview:{verified:true,postHash,verifiedAt:now,containsDiscount:false}};};
  const good=review(evidence),r=await bindScaleCreative(item,good,{state,now});assert.equal(r.readiness.ready,true,JSON.stringify(r.readiness.blockers));assert.equal(original.requirements.assetCount,6);
  for(const changed of [{...good,photoStory:undefined},{...good,photoStory:{...good.photoStory,sourceIntentHash:'f'.repeat(64)}},{...good,photoStory:{...good.photoStory,voiceOverAttached:true}},{...good,spokenScript:'new unreviewed speech'},{...good,assets:[assets[0],assets[0],...assets.slice(2)]}])assert.equal((await bindScaleCreative(item,changed,{state,now})).readiness.ready,false);
  const oldState={...state,campaign:{...state.campaign,rollingGoal:{dailyTarget:20}}};assert.equal((await bindScaleCreative(item,good,{state:oldState,now})).readiness.ready,false);
  assert.notEqual(scalePostHash(item,good),scalePostHash(item,{...good,photoStory:{...good.photoStory,voiceOverAttached:true}}));
  assert.notEqual(scalePostHash(item,good),scalePostHash(item,{...good,photoTitle:'Changed public title'}));
  const badTitle=await bindScaleCreative(item,review({...evidence,photoTitle:'Mua 1 tặng 1'}),{state,now});assert.ok(badTitle.readiness.blockers.includes('discount_not_verified_for_actual_publication_time'));
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
