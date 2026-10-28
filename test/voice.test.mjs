import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {voiceBrief,voiceRuntime,renderVoice} from '../src/voice.mjs';
import {hashFile} from '../src/store.mjs';
const q={id:'sakura-047',account:'saigomlia',productId:'sakura-cleaner-500ml',angleId:'surface',leadCode:'ẢNH047',caption:'Góc nhỏ cần hỏi trước.\n\nMột người xem lại chất liệu chiếc khay. Không mô tả kết quả làm sạch.\n\nCTA'};
test('voice brief preserves attribution and remains an unapproved narration draft',()=>{
  const brief=voiceBrief({queue:[q]},q.id);assert.equal(brief.angleId,'surface');assert.equal(brief.leadCode,'ẢNH047');assert.match(brief.script,/ảnh không bốn bảy/);assert.match(brief.script,/Mua một, tặng một/);assert.doesNotMatch(brief.script,/Không mô tả/);assert.equal(brief.status,'script_draft');
  assert.throws(()=>voiceBrief({queue:[{...q,account:'other'}]},q.id));
  assert.throws(()=>voiceBrief({queue:[]},'sakura-999'));
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
