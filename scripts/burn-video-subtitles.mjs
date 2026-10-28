import {readFile,writeFile,mkdir,readdir,copyFile} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {loadState,updateState,root,hashFile} from '../src/store.mjs';
import {voiceHome} from '../src/voice.mjs';
import {subtitleHome,narrationSource,verifySubtitleReceipt} from '../src/video-subtitles.mjs';
import {loadEditingRuntime} from '../src/footage-video.mjs';
const ids=process.argv.slice(2),run=promisify(execFile);
if(!ids.length||ids.length>5||ids.some(id=>!/^sakura-10[1-5]$/.test(id)))throw Error('Choose authorized video IDs101–105');
const runtime=await loadEditingRuntime(path.join(root,'state/footage-toolchain/runtime.json'));
for(const id of ids){
  const state=await loadState(),q=state.queue.find(q=>q.id===id);
  if(!q||q.receipt||['submitting','needs_review'].includes(q.status)||!state.campaign.extraTestBatch?.videoIds.includes(id))throw Error('Expected an unsubmitted authorized video');
  if(q.voicePreview.subtitlesBurned){if(await hashFile(q.voicePreview.path)!==q.voicePreview.sha256)throw Error('Captioned output checksum changed');console.log(JSON.stringify({id,path:q.voicePreview.path,cached:true}));continue;}
  const source=await narrationSource(q),candidates=[];
  for(const directory of await readdir(path.join(subtitleHome,'renders'))){
    if(!directory.startsWith(id+'-'))continue;
    const file=path.join(subtitleHome,'renders',directory,'receipt.json');
    try{const r=JSON.parse(await readFile(file,'utf8'));if(r.usable&&r.audioSha256===source.audioSha256&&r.scriptSha256===source.scriptSha256)candidates.push({...r,receiptFile:file});}catch(e){if(e.code!=='ENOENT')throw e;}
  }
  candidates.sort((a,b)=>(b.createdAt??'').localeCompare(a.createdAt??''));
  const subtitles=candidates[0];if(!subtitles)throw Error('No usable current phrase-caption preview for '+id);
  await verifySubtitleReceipt(subtitles,source);
  const displayAliases={'Sa cu ra':'Sakura','Tích Tóc':'TikTok',...(source.spokenLeadCode?{[source.spokenLeadCode]:q.leadCode}:{})};
  let ass=(await readFile(subtitles.assFile,'utf8')).replaceAll('\\pos(540,1620)','\\pos(540,1330)');for(const [spoken,display] of Object.entries(displayAliases))ass=ass.replaceAll(spoken,display);
  const digest=createHash('sha256').update(JSON.stringify({video:source.videoSha256,subtitles:subtitles.assSha256,displayAliases,captionBottomY:1330,renderer:'ass-burn-v2-safe-text'})).digest('hex').slice(0,16);
  const folder=path.join(voiceHome,'captioned-videos',id+'-'+digest);await mkdir(folder,{recursive:true});
  await writeFile(path.join(folder,'voice.ass'),ass,'utf8');await copyFile('C:/Windows/Fonts/arial.ttf',path.join(folder,'Arial.ttf'));
  const video=path.join(folder,id+'-captioned.mp4');
  await run(runtime.ffmpeg,['-hide_banner','-loglevel','error','-y','-i',source.videoPath,'-vf','ass=filename=voice.ass:fontsdir=.','-map','0:v:0','-map','0:a:0','-c:v','libx264','-preset','veryfast','-crf','20','-threads','4','-pix_fmt','yuv420p','-c:a','copy','-movflags','+faststart',video],{cwd:folder,windowsHide:true,timeout:180000,maxBuffer:1024*1024});
  const original=JSON.parse(await readFile(source.receiptFile,'utf8'));
  const result={...original,path:video,sha256:await hashFile(video),status:'needs_caption_playback_and_music',subtitles:{burned:true,receiptFile:subtitles.receiptFile,assFile:path.join(folder,'voice.ass'),assSha256:await hashFile(path.join(folder,'voice.ass')),displayAliases,captionBottomY:1330,timingMethod:subtitles.timingMethod,lexicalCoverage:subtitles.coverage,preciseWordAlignment:false,visuallyVerified:false,playbackVerified:false},sourceFootage:{path:source.videoPath,sha256:source.videoSha256},audioStreamCopied:true,musicAdded:false,published:false,createdAt:new Date().toISOString()};
  const receiptFile=path.join(folder,'receipt.json');await writeFile(receiptFile,JSON.stringify(result,null,2));
  await updateState(s=>{const item=s.queue.find(q=>q.id===id);if(item.receipt||['submitting','needs_review'].includes(item.status)||item.voicePreview.sha256!==source.videoSha256)throw Error('Source or submission changed during caption burn');item.voicePreviewHistory??=[];item.voicePreviewHistory.push(item.voicePreview);item.voicePreview={...item.voicePreview,path:video,sha256:result.sha256,receiptFile,subtitlesBurned:true,status:result.status};item.assets=[{path:video,name:path.basename(video),kind:'video',sha256:result.sha256}];item.assetsVerified=false;item.status='needs_video_review';return s;});
  console.log(JSON.stringify({id,path:video,receiptFile,status:result.status,audioStreamCopied:true}));
}
