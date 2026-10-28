import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {loadState,updateState,root,hashFile} from '../src/store.mjs';
import {voiceBrief,renderVoice,voiceHome,captionWithVoiceCredit} from '../src/voice.mjs';
const run=promisify(execFile),state=await loadState();
const ffmpeg=process.env.TIKTOK_FFMPEG??path.join(root,'state','video-toolchain','package','ffmpeg.exe');
const ffprobe=path.join(path.dirname(ffmpeg),'ffprobe.exe');
const ids=process.argv.slice(2);if(!ids.length||ids.length>10)throw Error('Provide 1–10 authorized voice test IDs');
const outputDir=path.join(voiceHome,'videos');await mkdir(outputDir,{recursive:true});
for(const id of ids){
  const q=state.queue.find(q=>q.id===id);
  if(!q||q.phase!=='voice-test'||q.receipt||q.sourceAssets?.length!==5)throw Error('Expected an unsubmitted authorized voice test');
  for(const asset of q.sourceAssets)if(await hashFile(asset.path)!==asset.sha256)throw Error('Source image hash changed');
  const audio=await renderVoice(state,id,voiceBrief(state,id).script);
  const revision=createHash('sha256').update(JSON.stringify({audio:audio.sha256,images:q.sourceAssets.map(a=>a.sha256),renderer:2})).digest('hex').slice(0,12);
  const caption=captionWithVoiceCredit(q.caption,audio.provider);
  const seconds=Math.max(22,Math.ceil(audio.qa.durationSeconds+2)),perSlide=seconds/5;
  // Build individual still-image segments; original3:4 art is retained in full.
  const segments=[];
  for(const [index,asset] of q.sourceAssets.entries()){
    const file=path.join(outputDir,`${id}-${revision}-slide-${index+1}.mp4`);
    await run(ffmpeg,['-hide_banner','-loglevel','error','-y','-loop','1','-framerate','25','-i',asset.path,'-t',String(perSlide),'-vf','scale=1080:1440','-aspect','3:4','-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p',file],{timeout:120000,windowsHide:true,maxBuffer:1024*1024});
    segments.push(file);
  }
  const concat=path.join(outputDir,`${id}-${revision}-concat.txt`);
  await writeFile(concat,segments.map(p=>`file '${p.replaceAll('\\','/').replaceAll("'","'\\''")}'`).join('\n'));
  const video=path.join(outputDir,`${id}-${revision}-voice-preview.mp4`);
  await run(ffmpeg,['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',concat,'-i',audio.path,'-map','0:v:0','-map','1:a:0','-c:v','copy','-af','apad','-t',String(seconds),'-c:a','aac','-b:a','192k','-movflags','+faststart',video],{timeout:120000,windowsHide:true,maxBuffer:1024*1024});
  const {stdout}=await run(ffprobe,['-v','error','-show_streams','-show_format','-of','json',video],{timeout:15000,windowsHide:true});
  const probe=JSON.parse(stdout),v=probe.streams.find(s=>s.codec_type==='video'),a=probe.streams.find(s=>s.codec_type==='audio');
  if(v?.codec_name!=='h264'||v.width!==1080||v.height!==1440||a?.codec_name!=='aac'||Math.abs(Number(probe.format.duration)-seconds)>0.2)throw Error('Video technical QA failed');
  const receipt={queueId:id,sourceQueueId:q.sourceQueueId,path:video,sha256:await hashFile(video),voice:audio,caption,seconds,dimensions:[1080,1440],status:'needs_listening_and_music',musicAdded:false,visualPlaybackVerified:false,published:false,createdAt:new Date().toISOString()};
  const receiptFile=path.join(outputDir,`${id}-${revision}.json`);
  await writeFile(receiptFile,JSON.stringify(receipt,null,2));
  await updateState(s=>{
    const item=s.queue.find(q=>q.id===id);if(item.receipt)throw Error('Item was submitted during rendering');
    if(item.voicePreview?.sha256!==receipt.sha256){item.voicePreviewHistory??=[];if(item.voicePreview)item.voicePreviewHistory.push(item.voicePreview);}
    item.voicePreview={path:video,sha256:receipt.sha256,receiptFile,status:receipt.status,provider:audio.provider,voice:audio.voice,speed:audio.speed};
    item.caption=caption;item.status='needs_audio_review';
    const group=s.campaign.voiceTest;
    if(group)group.status=group.queueIds.every(id=>{const p=s.queue.find(q=>q.id===id)?.voicePreview;return p&&p.provider===audio.provider&&p.voice===audio.voice&&p.speed===audio.speed;})?'previews_rendered_needs_music_and_review':'partial_previews_need_review';
    return s;
  });
  console.log(JSON.stringify({queueId:id,path:video,seconds,status:receipt.status}));
}
