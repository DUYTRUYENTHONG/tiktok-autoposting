import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {voiceBrief,voiceRuntime,renderVoice,voiceProfile,captionWithVoiceCredit} from '../src/voice.mjs';
import {hashFile} from '../src/store.mjs';
const q={id:'sakura-047',account:'saigomlia',productId:'sakura-cleaner-500ml',angleId:'surface',leadCode:'ẢNH047',caption:'Góc nhỏ cần hỏi trước.\n\nMột người xem lại chất liệu chiếc khay. Không mô tả kết quả làm sạch.\n\nCTA'};
test('voice brief preserves attribution and remains an unapproved narration draft',()=>{
  const brief=voiceBrief({queue:[q]},q.id);assert.equal(brief.angleId,'surface');assert.equal(brief.leadCode,'ẢNH047');assert.match(brief.script,/ảnh không bốn bảy/);assert.match(brief.script,/Mua một, tặng một/);assert.doesNotMatch(brief.script,/Không mô tả/);assert.equal(brief.status,'script_draft');
  assert.throws(()=>voiceBrief({queue:[{...q,account:'other'}]},q.id));
  assert.throws(()=>voiceBrief({queue:[]},'sakura-999'));
});
test('first50 queue narration opens with the current limited offer',()=>{
  const item={...q,promotionKey:'buy1-get1-tiktok-first50',angleId:'sakura-pain-tan-ca-voice'};
  const brief=voiceBrief({queue:[item]},item.id);assert.match(brief.script,/^Mua một, tặng một!\s+Chỉ năm mươi đơn đầu tiên/);assert.equal(brief.copyRevision,'promo-first50-conversational-v6');
});
test('v7 colloquial narration keeps printed attribution while omitting long spoken codes',()=>{
  const item={...q,id:'sakura-102',leadCode:'GIỌNG102',promotionKey:'buy1-get1-tiktok-first50',angleId:'sakura-pain-chia-viec-voice',caption:q.caption+'\n\nNhắn GIỌNG102'};
  const before=JSON.stringify(item),brief=voiceBrief({queue:[item]},item.id);
  assert.equal(brief.copyRevision,'promo-first50-colloquial-v7');assert.equal(brief.spokenLeadCodeIncluded,false);assert.equal(brief.leadCode,'GIỌNG102');
  assert.equal(brief.status,'script_draft');assert.doesNotMatch(brief.script,/giọng một không hai/);assert.match(item.caption,/GIỌNG102/);assert.equal(JSON.stringify(item),before);
});
test('voice runtime rejects corrupted model/config before executing an engine',async()=>{
  const home=await mkdtemp(path.join(tmpdir(),'voice-'));
  try{
    const model=path.join(home,'model.onnx');await writeFile(model,'model');await writeFile(model+'.json','config');
    const runtime={provider:'piper',language:'vi-VN',python:process.execPath,model,modelSha256:await hashFile(model),configSha256:await hashFile(model+'.json')};
    await writeFile(path.join(home,'runtime.json'),JSON.stringify(runtime));assert.equal((await voiceRuntime(home)).model,model);
    await writeFile(model,'corrupt');await assert.rejects(renderVoice({queue:[q]},q.id,'Kịch bản kiểm tra.',{home}),/checksum/);
  }finally{await rm(home,{recursive:true,force:true});}
});
test('local speech profiles require real presets and bounded pitch-preserving speed',()=>{
  const runtime={provider:'vieneu',voice:'Kim Thanh',speed:1.15,temperature:0.8,presetVoices:[{name:'Kim Thanh'},{name:'Adam'}]};
  assert.deepEqual(voiceProfile(runtime),{voice:'Kim Thanh',speed:1.15,temperature:0.8,referenceStyle:'preset'});
  assert.equal(voiceProfile(runtime,{referenceStyle:'speaker-only'}).referenceStyle,'speaker-only');
  assert.throws(()=>voiceProfile(runtime,{referenceStyle:'expressive'}));
  assert.equal(voiceProfile(runtime,{voiceName:'Adam',speed:1.2}).voice,'Adam');
  assert.equal(voiceProfile(runtime,{speed:1.5}).speed,1.5);
  assert.equal(voiceProfile(runtime,{speed:2}).speed,2);
  for(const speed of [0,0.9,2.01,NaN,Infinity])assert.throws(()=>voiceProfile(runtime,{speed}));
  assert.throws(()=>voiceProfile(runtime,{voiceName:'Invented voice'}));
  assert.throws(()=>voiceProfile({provider:'piper',voice:'stock'},{speed:1.15}));
});
test('VieNeu rejects modified assets before loading the speech engine',async()=>{
  const home=await mkdtemp(path.join(tmpdir(),'vieneu-'));
  try{
    const asset=path.join(home,'weights.onnx'),manifest=path.join(home,'assets.json');
    await writeFile(asset,'pinned weights');
    await writeFile(manifest,JSON.stringify({files:[{path:asset,sha256:await hashFile(asset)}]}));
    const config={provider:'vieneu',version:'3.8.3',language:'vi-VN',python:process.execPath,ffmpeg:process.execPath,hfCache:home,modelManifest:manifest,modelSha256:await hashFile(manifest),voice:'Kim Thanh',speed:1.15,temperature:0.8,presetVoices:[{name:'Kim Thanh'}]};
    await writeFile(path.join(home,'runtime.json'),JSON.stringify(config));
    assert.equal((await voiceRuntime(home)).provider,'vieneu');
    await writeFile(asset,'modified weights');
    await assert.rejects(renderVoice({queue:[q]},q.id,'Một kịch bản chưa được thực thi.',{home}),/asset checksum/);
  }finally{await rm(home,{recursive:true,force:true});}
});
test('rerendered captions name the actual voice provider without accumulating stale credits',()=>{
  const caption='Nhắn GIỌNG101. Giọng đọc máy tiếng Việt từ Microsoft Windows.';
  const updated=captionWithVoiceCredit(caption,'vieneu');
  assert.match(updated,/GIỌNG101/);assert.match(updated,/VieNeu-TTS/);assert.doesNotMatch(updated,/Microsoft/);
  assert.equal(captionWithVoiceCredit(updated,'vieneu'),updated);
  assert.doesNotMatch(captionWithVoiceCredit(updated,'piper'),/VieNeu/);
});
