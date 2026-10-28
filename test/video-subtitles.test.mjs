import test from 'node:test';
import assert from 'node:assert/strict';
import {alignSubtitleScript,phraseSubtitlePreview,validateSubtitleCues,subtitleSrt,subtitleAss,subtitleKey,narrationSource,speechActivity} from '../src/video-subtitles.mjs';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {hashFile} from '../src/store.mjs';

const words=(text)=>text.split(' ').map((text,i)=>({text,timestamp:[i*.2,(i+1)*.2]}));
test('subtitles use actual irregular ASR word anchors and preserve reviewed wording',()=>{
  const script='Mua một tặng một. Hỏi đúng chất liệu trước nha!';
  const chunks=words(script);chunks[0].timestamp=[.12,.29];chunks[1].timestamp=[.31,.45];
  const result=alignSubtitleScript(script,chunks,3);
  assert.equal(result.coverage,1);assert.equal(result.usable,true);
  assert.equal(result.cues[0].start,.12);
  assert.equal(result.cues.map(c=>c.text.replaceAll('\n',' ')).join(' '),script);
});
test('subtitle name/number matching keeps original script rather than misheard ASR text',()=>{
  const script='Chỉ năm mươi đơn đầu tiên từ Tích Tóc. Hỏi Sa cu ra nha.';
  const result=alignSubtitleScript(script,words('Chỉ 50 đơn đầu tiên từ TikTok. Hỏi Sakura nha.'),4);
  assert.equal(result.coverage,1);assert.equal(result.usable,true);
  assert.match(result.cues.map(c=>c.text).join(' '),/Sa cu ra/);
});
test('poor or hallucinated ASR abstains rather than distributing uniform timings',()=>{
  const result=alignSubtitleScript('Mua một tặng một cho năm mươi đơn đầu tiên từ TikTok.',words('Cảm ơn các bạn đã theo dõi'),4);
  assert.equal(result.usable,false);assert.equal(result.status,'needs_alignment_review');
  assert.ok(result.unmatched.length>0);
});
test('missing timestamps and invalid intervals cannot be published as timed captions',()=>{
  const bad=words('Mua một tặng một.');bad[0].timestamp=[null,.2];
  const result=alignSubtitleScript('Mua một tặng một.',bad,2);
  assert.equal(result.usable,false);
  assert.throws(()=>validateSubtitleCues([{start:1,end:.9,text:'Xin chào'}],2));
  assert.throws(()=>validateSubtitleCues([{start:0,end:1,text:'Một'},{start:.5,end:1.5,text:'Hai'}],2));
});
test('UTF8 SRT and ASS preserve Vietnamese, max two lines and safe caption placement',()=>{
  const cues=[{start:.12,end:1.34,text:'Mua một, tặng một!\nChỉ năm mươi đơn đầu tiên.'}];
  assert.match(subtitleSrt(cues,2),/00:00:00,120 --> 00:00:01,340/);
  const ass=subtitleAss(cues,2);assert.match(ass,/PlayResY: 1920/);assert.match(ass,/Arial,48/);
  assert.match(ass,/\\pos\(540,1620\)/);assert.match(ass,/tặng một!\\NChỉ năm mươi/);
  assert.throws(()=>validateSubtitleCues([{start:0,end:1,text:'một\nhai\nba'}],2));
});
test('subtitle cache key changes when exact WAV/script/model changes',()=>{
  const input={queueId:'sakura-101',audioSha256:'a'.repeat(64),script:'Mua một tặng một.'};
  assert.equal(subtitleKey(input),subtitleKey({...input}));
  assert.notEqual(subtitleKey(input),subtitleKey({...input,audioSha256:'b'.repeat(64)}));
  assert.notEqual(subtitleKey(input),subtitleKey({...input,script:input.script+' Nha!'}));
  assert.notEqual(subtitleKey(input),subtitleKey({...input,algorithmVersion:3}));
});
test('phrase preview retains low ASR confidence while using real phrase anchors',()=>{
  const script='Mua một tặng một. Chỉ năm mươi đơn đầu tiên từ Tích Tóc.';
  const chunks=words('Mùa một tặng một. Chỉ năm mươi đang đầu tiên từ kết tóc.');
  const activity={intervals:[{start:0,end:2.6}]};
  const strict=alignSubtitleScript(script,chunks,3);
  assert.equal(strict.usable,false);
  const preview=phraseSubtitlePreview(script,chunks,3,activity,{strictAlignment:strict});
  assert.equal(preview.usable,true);assert.equal(preview.status,'needs_playback_review');
  assert.ok(preview.asrLexicalCoverage<1);assert.ok(preview.criticalUnmatched.length);
  assert.equal(preview.preciseWordAlignment,false);assert.equal(preview.publicationReady,false);
  assert.equal(preview.cues.map(c=>c.text.replaceAll('\n',' ')).join(' '),script);
  validateSubtitleCues(preview.cues,3);
});
test('speech fallback measures PCM activity instead of allocating equal text intervals',()=>{
  const input=new Float32Array(16000);input.fill(.2,3200,6400);
  const result=speechActivity(input);
  assert.deepEqual(result.intervals,[{start:.2,end:.4}]);
  assert.match(result.method,/not linguistic/);
});
test('narration lookup rejects stale exact WAV and never synthesizes a replacement',async()=>{
  const home=await mkdtemp(path.join(tmpdir(),'subtitle-source-'));
  try{
    const wav=path.join(home,'voice.wav'),video=path.join(home,'video.mp4'),receiptFile=path.join(home,'receipt.json');
    await writeFile(wav,'technical fixture only');await writeFile(wav.replace('.wav','.txt'),'Mua một tặng một.');await writeFile(video,'technical video fixture');
    const receipt={queueId:'sakura-101',path:video,sha256:await hashFile(video),voice:{path:wav,sha256:await hashFile(wav),script:'Mua một tặng một.',listeningVerified:false}};
    await writeFile(receiptFile,JSON.stringify(receipt));
    const q={id:'sakura-101',voicePreview:{receiptFile,sha256:receipt.sha256}};
    assert.equal((await narrationSource(q)).listeningVerified,false);
    await writeFile(wav,'changed actual audio');await assert.rejects(narrationSource(q),/checksum mismatch/);
  }finally{await rm(home,{recursive:true,force:true});}
});
