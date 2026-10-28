import test from 'node:test';
import assert from 'node:assert/strict';
import {selectMusic} from '../src/music-policy.mjs';
const now=new Date('2026-10-28T02:00:00Z');
const track={soundId:'123',title:'Synthetic test track',region:'VN',businessUseVerified:true,availableInAccount:true,trendRank:2,sourceUrl:'https://ads.tiktok.com/creative/creativeCenter/trends',checkedAt:now.toISOString(),moods:['calm']};
test('music selection requires fresh trend, commercial evidence and distinct sound',()=>{
  assert.equal(selectMusic([track],[],{now,mood:'calm'}).soundId,'123');
  for(const change of [{region:'US'},{businessUseVerified:false},{availableInAccount:false},{trendRank:null},{checkedAt:'2026-10-01T00:00:00Z'},{sourceUrl:'https://example.com/chart'}])assert.equal(selectMusic([{...track,...change}],[],{now}).status,'needs_selection');
  assert.equal(selectMusic([track],[{soundId:'123'}],{now}).status,'needs_selection');
  assert.equal(selectMusic([{...track,soundId:'456',moods:undefined,trendRank:1},track],[],{now,mood:'calm'}).soundId,'123');
});
