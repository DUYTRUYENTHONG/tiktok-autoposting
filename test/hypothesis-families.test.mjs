import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyState} from '../src/engine.mjs';
import {hypothesisFamilyReport} from '../src/hypothesis-families.mjs';

const publication='2026-10-20T00:00:00Z',asOf='2026-10-25T00:00:00Z';
function fixture(){return {...emptyState(),angles:[{id:'family',productId:'x',name:'Same explicit hypothesis'},{id:'creative-a',productId:'x',sourceHypothesisId:'family'},{id:'creative-b',productId:'x',sourceAngleId:'family'}]};}
const post=(id,extra={})=>({id,angleId:'creative-a',productId:'x',format:'video',distribution:'organic',promotionKey:'evergreen',publishedAt:publication,...extra});
const observation=(postId,hours,views,extra={})=>({postId,observedAt:new Date(Date.parse(publication)+hours*3600000).toISOString(),views,source:'synthetic test fixture',...extra});

test('explicit related creatives use latest cumulative observation per post/window without changing source identities',()=>{
  const s=fixture();s.posts=[post('a'),post('b',{angleId:'creative-b'})];s.snapshots=[observation('a',24,100),observation('a',25,150),observation('a',48,300),observation('b',26,50)];
  const before=structuredClone(s),r=hypothesisFamilyReport(s,{asOf});assert.deepEqual(s,before);
  const early=r.groups.find(g=>g.ageFromHours===24);assert.equal(early.posts,2);assert.equal(early.views,200);assert.equal(early.medianViews,100);assert.equal(early.completePosts,0);assert.equal(early.engagementRate,null);assert.equal(early.winnerEstablished,false);
  assert.equal(r.groups.find(g=>g.ageFromHours===48).views,300);assert.equal(r.uniqueObservedPosts,2);assert.equal(r.postWindowObservations,3);
});
test('product, native format, promotion and distribution remain separate under the same family name',()=>{
  const s=fixture();s.angles.push({id:'family',productId:'y',name:'Other product'},{id:'creative-a',productId:'y',sourceHypothesisId:'family'});
  s.posts=[post('base'),post('photo',{format:'photo'}),post('paid',{distribution:'paid'}),post('unknown',{distribution:undefined}),post('offer',{promotionKey:'offer'}),post('product',{productId:'y'})];
  s.snapshots=s.posts.map(p=>observation(p.id,30,100));const r=hypothesisFamilyReport(s,{asOf});assert.equal(r.groups.length,6);assert.ok(r.groups.every(g=>g.posts===1));
});
test('exact age boundaries and future observations cannot move a count into another band',()=>{
  const s=fixture();s.posts=[post('a')];s.snapshots=[observation('a',23.99,1),observation('a',24,2),observation('a',36,3),observation('a',60,4),observation('a',72,5),observation('a',72.01,6),observation('a',200,99)];
  const r=hypothesisFamilyReport(s,{asOf});assert.deepEqual(r.groups.map(g=>[g.ageFromHours,g.views]),[[24,2],[36,3],[60,5]]);assert.equal(r.excluded.futureObservation,1);assert.equal(r.excluded.outsideAgeWindow,2);
});
test('missing parent references abstain from family grouping and no engagement data is invented',()=>{
  const s=fixture();s.angles[1].sourceHypothesisId='missing';s.posts=[post('a'),post('b',{angleId:'missing-angle'})];s.snapshots=[observation('a',30,1000),observation('b',30,1000)];
  const r=hypothesisFamilyReport(s,{asOf});assert.deepEqual(r.groups,[]);assert.equal(r.excluded.unresolvedParent,1);assert.equal(r.excluded.unattributed,1);assert.equal(r.winnerEstablished,false);
});
test('engagement uses only complete observed counters and duplicate post identities fail',()=>{
  const s=fixture();s.posts=[post('a'),post('b')];s.snapshots=[observation('a',30,100,{likes:10,comments:1,shares:2,saves:3}),observation('b',30,1000,{likes:20})];
  const r=hypothesisFamilyReport(s,{asOf}).groups[0];assert.equal(r.completePosts,1);assert.equal(r.engagementRate,.16);assert.equal(r.views,1100);assert.equal(r.winnerEstablished,false);
  s.posts.push(post('a'));assert.throws(()=>hypothesisFamilyReport(s,{asOf}),/Duplicate/);
});
