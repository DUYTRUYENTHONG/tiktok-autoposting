import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {buildScaleCampaign,bindScaleCreative,scalePostHash,scaleHash} from '../src/scale-campaign.mjs';
import {hashFile} from '../src/store.mjs';

const now='2026-10-28T08:00:00Z',state=()=>({account:'saigomlia',campaign:{},queue:[],posts:[],angles:[]});
async function fixture(){const dir=await mkdtemp(path.join(tmpdir(),'scale-native-music-')),item=buildScaleCampaign(state(),{now}).items[0],assets=[];
  for(let i=0;i<6;i++){const file=path.join(dir,`asset-${i}.png`);await writeFile(file,`synthetic slide ${i}`);assets.push({path:file,sha256:await hashFile(file),order:i+1});}
  const catalog=path.join(dir,'catalog.png'),selection=path.join(dir,'selected.png');await writeFile(catalog,'Synthetic native royalty-free Vietnamese catalogue view');await writeFile(selection,'Synthetic native composer selected-track view');
  const music={soundId:null,title:'Nhớ Về Em',artist:'Nguyễn A',duration:'03:10',language:'Vietnamese',identitySource:'https://www.tiktok.com/tiktokstudio/sound-library',catalogEvidence:{path:catalog,sha256:await hashFile(catalog)},selectionEvidence:{path:selection,sha256:await hashFile(selection)},businessUseVerified:true,availableInAccount:true,selectedInUi:true,verifiedAt:now};
  const evidence={account:item.account,location:item.location,caption:`Hỏi vật liệu và nhu cầu trước khi đặt. Nhắn ${item.leadCode}.`,assets,demoKind:'product_identity',authenticProductReferenceVerified:true,music,scheduleWindow:{verified:true,account:item.account,verifiedAt:now,earliest:'2026-10-29T00:00:00+07:00',latest:'2026-11-01T23:00:00+07:00'}};
  const review=e=>{const postHash=scalePostHash(item,e);return {...e,visualReview:{verified:true,postHash,verifiedAt:now},offerReview:{verified:true,containsDiscount:false,postHash,verifiedAt:now}};};
  return {dir,item,evidence:review(evidence),review,cleanup:()=>rm(dir,{recursive:true,force:true})};
}
test('exact native Vietnamese identity and two byte-verified proofs permit a no-ID binding',async()=>{const f=await fixture();try{const bound=await bindScaleCreative(f.item,f.evidence,{state:state(),now});assert.equal(bound.status,'ready');assert.equal(bound.postHash,scalePostHash(f.item,f.evidence));assert.equal(bound.boundCreative.music.soundId,null);
  const altered={...f.evidence,music:{...f.evidence.music,title:'Another title'}};assert.notEqual(scalePostHash(f.item,altered),bound.postHash);assert.ok((await bindScaleCreative(f.item,altered,{state:state(),now})).readiness.blockers.includes('bound_visual_review_missing'));
}finally{await f.cleanup();}});
test('observed non_vocal catalogue identity is allowed and hash-bound while English remains rejected',async()=>{const f=await fixture();try{
  const native=f.review({...f.evidence,music:{...f.evidence.music,title:'Nhớ Người Hay Nhớ (Special Remix)',artist:'Châu Đăng Khoa',duration:'01:00',language:'non_vocal'}}),bound=await bindScaleCreative(f.item,native,{state:state(),now});assert.equal(bound.status,'ready');assert.equal(bound.postHash,scalePostHash(f.item,native));assert.notEqual(bound.postHash,scalePostHash(f.item,f.evidence));
  const english=f.review({...native,music:{...native.music,language:'English'}});assert.ok((await bindScaleCreative(f.item,english,{state:state(),now})).readiness.blockers.includes('exact_native_music_identity_missing'));
}finally{await f.cleanup();}});
test('missing title, artist, duration, native URL or proof rejects no-ID binding',async()=>{const f=await fixture();try{for(const change of [{title:''},{artist:' '},{duration:'03:99'},{language:'English'},{identitySource:'https://example.com/sound-library'},{catalogEvidence:null},{selectionEvidence:null},{selectionEvidence:f.evidence.music.catalogEvidence}]){const e=f.review({...f.evidence,music:{...f.evidence.music,...change}}),bound=await bindScaleCreative(f.item,e,{state:state(),now});assert.equal(bound.status,'planned');assert.ok(bound.readiness.blockers.some(x=>x.includes('native_music')),JSON.stringify(change));}
  const missingId=f.review({...f.evidence,music:{...f.evidence.music,soundId:undefined}});assert.ok((await bindScaleCreative(f.item,missingId,{state:state(),now})).readiness.blockers.includes('fresh_native_music_selection_missing'));
}finally{await f.cleanup();}});
test('changed screenshot bytes fail fresh binding even when declared hashes and reviews are unchanged',async()=>{const f=await fixture();try{await writeFile(f.evidence.music.selectionEvidence.path,'changed selected track screenshot');const bound=await bindScaleCreative(f.item,f.evidence,{state:state(),now});assert.ok(bound.readiness.blockers.includes('native_music_selection_evidence_hash_mismatch'));
}finally{await f.cleanup();}});
test('numeric sound-ID post hash stays byte-for-byte compatible with the original schema',async()=>{const f=await fixture();try{const e={...f.evidence,music:{...f.evidence.music,soundId:'7605166944787761169'}};const expected=scaleHash({intentId:f.item.id,intentHash:f.item.intentHash,account:e.account,format:f.item.format,publishAt:f.item.proposedPublishAt,location:e.location,caption:e.caption,assets:e.assets.map(a=>({order:a.order,sha256:a.sha256})),voiceSha256:null,spokenScript:f.item.creative.videoScript,musicSoundId:e.music.soundId,demoKind:e.demoKind});assert.equal(scalePostHash(f.item,e),expected);assert.equal((await bindScaleCreative(f.item,f.review(e),{state:state(),now})).status,'ready');
}finally{await f.cleanup();}});
