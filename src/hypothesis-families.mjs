import {timestamp} from './engine.mjs';

const bands=[[24,36],[36,48],[48,60],[60,72]];
const median=values=>{const sorted=[...values].sort((a,b)=>a-b),mid=Math.floor(sorted.length/2);return sorted.length%2?sorted[mid]:(sorted[mid-1]+sorted[mid])/2;};

// Descriptive parent-hypothesis comparison; creative IDs and winner decisions stay separate.
export function hypothesisFamilyReport(state,{asOf=new Date().toISOString()}={}){
  const when=timestamp(asOf),angles=new Map(state.angles.map(a=>[JSON.stringify([a.productId,a.id]),a]));
  const posts=new Map();for(const p of state.posts){if(posts.has(p.id))throw Error('Duplicate published post identity');posts.set(p.id,p);}
  const latest=new Map(),excluded={unattributed:0,unresolvedParent:0,outsideAgeWindow:0,futureObservation:0};
  for(const s of state.snapshots){
    const p=posts.get(s.postId);if(!p)continue;
    const observed=timestamp(s.observedAt),published=timestamp(p.publishedAt),age=(observed-published)/3600000;
    if(observed>when){excluded.futureObservation++;continue;}
    const band=bands.find(([from,to],i)=>age>=from&&(age<to||i===bands.length-1&&age===to));
    if(!band){excluded.outsideAgeWindow++;continue;}
    if(!Number.isSafeInteger(s.views)||s.views<0)throw Error('Invalid observed views');
    const key=JSON.stringify([p.id,band[0]]),old=latest.get(key);
    if(!old||observed>Date.parse(old.snapshot.observedAt))latest.set(key,{post:p,snapshot:s,age,band});
  }
  const groups=new Map(),observedPosts=new Set();
  for(const row of latest.values()){
    const p=row.post,angle=angles.get(JSON.stringify([p.productId,p.angleId]));
    if(!angle){excluded.unattributed++;continue;}
    const familyId=angle.sourceHypothesisId??angle.sourceAngleId??angle.id;
    const family=angles.get(JSON.stringify([p.productId,familyId]));
    if(!family){excluded.unresolvedParent++;continue;}
    const distribution=p.distribution??'unknown',promotionKey=p.promotionKey??'unknown';
    const key=JSON.stringify([p.productId,p.format,distribution,promotionKey,familyId,row.band[0]]);
    if(!groups.has(key))groups.set(key,{productId:p.productId,format:p.format,distribution,promotionKey,familyId,familyName:family.name??family.id,ageFromHours:row.band[0],ageThroughHours:row.band[1],upperAgeInclusive:row.band[1]===72,rows:[]});
    groups.get(key).rows.push(row);observedPosts.add(p.id);
  }
  const output=[...groups.values()].map(({rows,...group})=>{
    const complete=rows.filter(({snapshot:s})=>['likes','comments','shares','saves'].every(k=>Number.isSafeInteger(s[k])&&s[k]>=0));
    const completeViews=complete.reduce((n,r)=>n+r.snapshot.views,0);
    return {...group,posts:rows.length,completePosts:complete.length,views:rows.reduce((n,r)=>n+r.snapshot.views,0),medianViews:median(rows.map(r=>r.snapshot.views)),engagementRate:completeViews?complete.reduce((n,{snapshot:s})=>n+s.likes+s.comments+s.shares+s.saves,0)/completeViews:null,minObservedAgeHours:Math.min(...rows.map(r=>r.age)),maxObservedAgeHours:Math.max(...rows.map(r=>r.age)),lastObservedAt:rows.map(r=>r.snapshot.observedAt).sort((a,b)=>Date.parse(b)-Date.parse(a))[0],observations:rows.map(({post:p,snapshot:s,age})=>({postId:p.id,angleId:p.angleId,publishedAt:p.publishedAt,observedAt:s.observedAt,ageHours:age,views:s.views,source:s.source})),winnerEstablished:false};
  }).sort((a,b)=>a.productId.localeCompare(b.productId)||a.familyId.localeCompare(b.familyId)||a.ageFromHours-b.ageFromHours||a.format.localeCompare(b.format)||a.promotionKey.localeCompare(b.promotionKey)||a.distribution.localeCompare(b.distribution));
  return {asOf,scope:'descriptive_parent_hypothesis_by_observation_age',groups:output,uniqueObservedPosts:observedPosts.size,postWindowObservations:output.reduce((n,g)=>n+g.posts,0),excluded,winnerEstablished:false,limitation:'Related creatives are not identical replications. Compare within the same product/format/distribution/promotion and12-hour age band. One post may appear in multiple bands; do not add band totals. Music, script and footage differences remain confounders. No calls or orders are inferred.'};
}
