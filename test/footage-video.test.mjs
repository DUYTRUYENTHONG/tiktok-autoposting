import test from 'node:test';
import assert from 'node:assert/strict';
import {createFootageEdl,footageStories,wrapVideoText,transitionGraph,bindProductReference} from '../src/footage-video.mjs';
const q={id:'sakura-101',phase:'voice-test',account:'saigomlia',status:'needs_video_review',promotionKey:'buy1-get1-tiktok-first50',leadCode:'GIỌNG101'};
const audio={provider:'vieneu',voice:'Thùy Dung',speed:1.2,referenceStyle:'speaker-only',path:'voice.wav',sha256:'a'.repeat(64),qa:{durationSeconds:13},script:'Mua một, tặng một!',copyRevision:'test'};
const rag={status:'retrieved',corpusHash:'corpus',sources:[{id:'sakura:editorial:footage-video-policy'},{id:'sakura:offer:buy1-get1-tiktok-first50'}]};
const review={clips:footageStories[q.id].clips.map(id=>({id,allowedForRootNeutralPool:true,catalogHashMatches:true,intervalContactSheet:{visuallyInspected:true},duration:10,source:id+'.mp4',sourceSha256:'b'.repeat(64),sourceUrl:'https://www.pexels.com/video/example/',width:1920,height:1080})),recommendedRanges:footageStories[q.id].clips.map(id=>({id,start:1,end:4,cropCenterX:0.28}))};
test('footage EDL requires an unsubmitted account-matched current-offer test and reviewed intervals',()=>{
  const edl=createFootageEdl(q,review,audio,rag);assert.equal(edl.seconds,20);assert.equal(edl.scenes.length,5);assert.equal(edl.packshotSeconds,6.25);assert.equal(edl.scenes.length*3+edl.packshotSeconds-edl.transitions.count*edl.transitions.duration,edl.seconds);assert.equal(edl.scenes[0].cropCenterX,0.28);assert.equal(edl.stockIsSakuraDemo,false);assert.equal(edl.publicationVerified,false);
  for(const changed of [{account:'other'},{status:'submitting'},{receipt:{id:'1'}},{promotionKey:'buy3-get1'}])assert.throws(()=>createFootageEdl({...q,...changed},review,audio,rag));
  assert.throws(()=>createFootageEdl(q,{...review,recommendedRanges:[]},audio,rag));
  assert.throws(()=>createFootageEdl(q,review,{...audio,voice:'Unaccepted voice'},rag));
  assert.throws(()=>createFootageEdl(q,review,audio,{...rag,sources:[]}));
});
test('crossfades stay within reviewed clips and retain the planned final duration',()=>{
  const graph=transitionGraph(6);assert.equal(graph.output,'mix5');assert.match(graph.filters.at(-1),/offset=13.75/);assert.throws(()=>transitionGraph(6,{duration:1}));
});
test('edited media revision changes with its authentic product reference',()=>{
  const edl=createFootageEdl(q,review,audio,rag),a={path:'product.jpg',sha256:'c'.repeat(64),role:'user_supplied_product_reference'};
  assert.notEqual(bindProductReference(edl,a).revision,bindProductReference(edl,{...a,sha256:'d'.repeat(64)}).revision);
  assert.throws(()=>bindProductReference(edl,{...a,sha256:'unverified'}));
});
test('Vietnamese title wrapping retains accents and words for mobile overlays',()=>{
  const text='Tan ca rồi, vẫn phải tăng ca ở bếp?';assert.equal(wrapVideoText(text).replaceAll('\n',' '),text);assert.ok(wrapVideoText(text).split('\n').every(line=>line.length<=27));
});
