import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {acceptedVoiceProfile,checkCaptionOptOut,scaleHash,scalePostHash} from '../src/scale-campaign.mjs';
import {hashFile} from '../src/store.mjs';

const now='2026-11-02T05:00:00Z';
test('alternate speed requires a separately validated exact reviewed source profile',()=>{
 const spoken='Lời nói rõ ràng',voice={voice:'Thùy Dung',speed:1.1,referenceStyle:'speaker-only',scriptSha256:scaleHash(spoken)};
 assert.equal(acceptedVoiceProfile(voice,spoken),false);
 assert.equal(acceptedVoiceProfile(voice,spoken,true),true);
 assert.equal(acceptedVoiceProfile({...voice,voice:'Other'},spoken,true),false);
 assert.equal(acceptedVoiceProfile(voice,'Changed script',true),false);
 assert.equal(acceptedVoiceProfile({...voice,speed:1.2},spoken),true);
});
test('caption opt-out is registered and bound to intent, account, exact audio, script and ordered assets',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'caption-optout-'));
 try {
  const item={id:'sakura-scale-10096',intentHash:'i'.repeat(64),account:'saigomlia',format:'video',proposedPublishAt:'2026-11-02T15:00:00+07:00',creative:{videoScript:'test'}};
  const evidence={account:item.account,caption:'test',location:'test',spokenScript:'Lời nói rõ ràng',voice:{sha256:'a'.repeat(64)},assets:[{order:1,sha256:'b'.repeat(64)}],music:{soundId:'123'},demoKind:'product_identity'};
  const approval={verified:true,reviewer:'user',source:'chat:explicit-choice',verifiedAt:'2026-11-02T04:00:00Z',mode:'no-captions',intentId:item.id,intentHash:item.intentHash,account:item.account,audioSha256:evidence.voice.sha256,scriptSha256:scaleHash(evidence.spokenScript),assetSha256:[evidence.assets[0].sha256]};
  const file=path.join(dir,'approval.json');await writeFile(file,JSON.stringify(approval));const ref={path:file,sha256:await hashFile(file)};evidence.captionOptOut=ref;const state={campaign:{captionOptOutApproval:ref}};
  assert.equal(await checkCaptionOptOut(item,evidence,state,now),true);
  assert.notEqual(scalePostHash(item,evidence),scalePostHash(item,{...evidence,captionOptOut:undefined}));
  for(const changed of [{...evidence,spokenScript:'changed'},{...evidence,voice:{sha256:'c'.repeat(64)}},{...evidence,assets:[{order:1,sha256:'d'.repeat(64)}]},{...evidence,captionOptOut:{...ref,sha256:'e'.repeat(64)}}])assert.equal(await checkCaptionOptOut(item,changed,state,now),false);
  assert.equal(await checkCaptionOptOut({...item,id:'sakura-scale-10097'},evidence,state,now),false);
  assert.equal(await checkCaptionOptOut(item,evidence,{campaign:{}},now),false);
  await writeFile(file,JSON.stringify({...approval,reviewer:'agent'}));assert.equal(await checkCaptionOptOut(item,evidence,state,now),false);
 } finally {await rm(dir,{recursive:true,force:true});}
});
