import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {loadState,root,hashFile} from '../src/store.mjs';
import {ensureSubtitleModel,createSubtitleTranscriber,prepareVideoSubtitles} from '../src/video-subtitles.mjs';

const args=process.argv.slice(2),download=args.includes('--download-model'),reuse=args.indexOf('--reuse-asr');
const reuseAsrFile=reuse>=0?args[reuse+1]:undefined;
if(reuse>=0&&!reuseAsrFile)throw Error('--reuse-asr requires an existing local ASR record');
const ids=args.filter((a,i)=>a!=='--download-model'&&a!=='--reuse-asr'&&(reuse<0||i!==reuse+1));
if(!ids.length||ids.length>5||ids.some(id=>!/^sakura-10[1-5]$/u.test(id))||new Set(ids).size!==ids.length)throw Error('Choose current narrated video IDs101–105');
if(reuseAsrFile&&ids.length!==1)throw Error('A reused ASR record belongs to exactly one actual WAV');
const runtime=JSON.parse(await readFile(path.join(root,'state/footage-toolchain/runtime.json'),'utf8'));
if(!runtime.ffmpeg||await hashFile(runtime.ffmpeg)!==runtime.ffmpegSha256)throw Error('Pinned editing FFmpeg checksum mismatch');
const assets=await ensureSubtitleModel({download});
let transcriber;
try{
  if(!reuseAsrFile){console.log(JSON.stringify({status:'loading_local_asr',model:assets.model.id,revision:assets.model.revision,threads:2}));transcriber=await createSubtitleTranscriber(assets);}
  for(const id of ids){
    const state=await loadState(),q=state.queue.find(q=>q.id===id);
    if(!q)throw Error('Queue item missing:'+id);
    console.log(JSON.stringify({queueId:id,status:'preparing_actual_audio_timestamps'}));
    const result=await prepareVideoSubtitles(q,{ffmpeg:runtime.ffmpeg,transcriber,modelAssets:assets,reuseAsrFile});
    console.log(JSON.stringify({queueId:id,status:result.status,usable:result.usable,coverage:result.coverage,
      audioSha256:result.audioSha256,scriptSha256:result.scriptSha256,receiptFile:result.receiptFile,srtFile:result.srtFile,assFile:result.assFile,
      durationSeconds:result.durationSeconds,voiceRevisionRequired:result.voiceRevisionRequired,playbackVerified:false,published:false}));
  }
}finally{await transcriber?.dispose();}
