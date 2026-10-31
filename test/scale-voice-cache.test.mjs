import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {loadCachedVoice} from '../scripts/render-scale-video-preview.mjs';
import {hash} from '../src/knowledge/index.mjs';

test('voice-first cache preserves exact bytes and rejects changed script, profile, runtime or cached assets',async()=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'scale-voice-cache-'));
  try{
    const script='Sa cu ra năm trăm mi li. Gọi số điện thoại trong bio.',profile={voice:'Thùy Dung',speed:1.2,temperature:.8,referenceStyle:'speaker-only'},wav=path.join(dir,'voice.wav'),scriptFile=path.join(dir,'script.txt'),file=path.join(dir,'voice-receipt.json');
    const options={script,profile,modelSha256:'a'.repeat(64),runtimeConfigSha256:'b'.repeat(64)};
    assert.equal(await loadCachedVoice(file,options),null);
    const bytes='synthetic byte-integrity fixture, not real audio';await writeFile(wav,bytes);await writeFile(scriptFile,script);
    const voice={provider:'vieneu',...profile,path:wav,sha256:hash(bytes),script,scriptFile,scriptSha256:hash(script),modelManifestSha256:options.modelSha256,runtimeConfigSha256:options.runtimeConfigSha256,listeningVerified:false};await writeFile(file,JSON.stringify(voice));
    assert.deepEqual(await loadCachedVoice(file,options),voice);assert.equal(await readFile(wav,'utf8'),bytes);
    await assert.rejects(loadCachedVoice(file,{...options,script:script+' Changed.'}),/exact script\/profile/);
    await assert.rejects(loadCachedVoice(file,{...options,profile:{...profile,speed:1.3}}),/exact script\/profile/);
    await assert.rejects(loadCachedVoice(file,{...options,modelSha256:'c'.repeat(64)}),/Cached narration/);
    await writeFile(scriptFile,'changed');await assert.rejects(loadCachedVoice(file,options),/Cached narration/);await writeFile(scriptFile,script);
    await writeFile(wav,'corrupt');await assert.rejects(loadCachedVoice(file,options),/Cached narration/);
  }finally{await rm(dir,{recursive:true,force:true});}
});
