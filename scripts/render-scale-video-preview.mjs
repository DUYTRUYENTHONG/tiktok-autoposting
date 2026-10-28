import {readFile,writeFile,mkdir,copyFile,realpath} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {root,hashFile,loadState} from '../src/store.mjs';
import {voiceRuntime,voiceHome,voiceProfile,captionWithVoiceCredit} from '../src/voice.mjs';
import {inspectWav} from '../src/wav.mjs';
import {scalePolicy,scaleHash,containsDiscount} from '../src/scale-campaign.mjs';
import {loadEditingRuntime,transitionGraph,wrapVideoText} from '../src/footage-video.mjs';
import {verifySubtitleReceipt,ensureSubtitleModel,createSubtitleTranscriber,alignSubtitleScript,phraseSubtitlePreview,
  speechActivity,subtitleKey,subtitleSrt,subtitleAss} from '../src/video-subtitles.mjs';

const run=promisify(execFile);
const productImage='C:/Users/CROSSIAN/Downloads/nước tẩy đa năng sakura/Sakura_10_Carousel_50_Anh/Sakura_10_Carousel/Anh_tham_chieu/Sakura_nuoc_lau_500ml.jpg';
const payload=i=>({id:i.id,campaignId:i.campaignId,account:i.account,productId:i.productId,format:i.format,leadCode:i.leadCode,proposedPublishAt:i.proposedPublishAt,location:i.location,creative:i.creative,promotion:i.promotion});
export function assertEvergreen(text){
  const folded=String(text).normalize('NFD').replace(/\p{M}/gu,'').replaceAll('đ','d').toLowerCase();
  if(containsDiscount(text)||/uu dai|khuyen mai|giam gia|tang kem|qua tang|don dau tien|first\s*50|discount|coupon|voucher|hom nay thoi|sap het/.test(folded))throw Error('Evergreen preview cannot contain an offer, discount or urgency');
}
export function validateVideoIntent(plan,id){
  if(plan.schemaVersion!==1||JSON.stringify(plan.policy)!==JSON.stringify(scalePolicy)||plan.items?.length!==1000
    ||plan.planHash!==scaleHash({policy:plan.policy,sourceReservationsHash:plan.sourceReservationsHash,intents:plan.items.map(i=>i.intentHash)}))throw Error('Existing authorized scale plan checksum/policy mismatch');
  const item=plan.items.find(i=>i.id===id);
  if(!item||!/^sakura-scale-\d{5}$/u.test(id)||item.intentHash!==scaleHash(payload(item))||item.account!=='saigomlia'
    ||item.productId!=='sakura-cleaner-500ml'||item.format!=='video'||item.status!=='planned'||item.receipt)throw Error('Choose one existing unsubmitted authorized scale video intent');
  if(item.promotion?.showDiscount!==false||item.promotion.mode!=='evergreen_no_discount'||item.creative?.offerStage!=='evergreen_no_discount')throw Error('This producer is evergreen only');
  if(!/^GIỌNG\d{5}$/u.test(item.leadCode)||plan.items.filter(i=>i.leadCode===item.leadCode).length!==1)throw Error('Unique existing video inquiry code required');
  return item;
}
export function registeredPlanFile(state,explicit){
  const meta=state.campaign?.scaleCampaign;
  if(!meta?.manifestFile||!path.isAbsolute(meta.manifestFile)||!/^[a-f0-9]{64}$/u.test(meta.manifestSha256??''))throw Error('A registered immutable scale plan is required');
  const selected=path.resolve(explicit??meta.manifestFile);
  if(selected!==path.resolve(meta.manifestFile))throw Error('Use the currently registered scale plan; old revisions are preserved, not active');
  return selected;
}
export function validatePreparedVoice(voice,script,profile){
  if(voice?.provider!=='vieneu'||voice.script!==script||voice.scriptSha256!==scaleHash(script)
    ||['voice','speed','temperature','referenceStyle'].some(k=>voice[k]!==profile[k])
    ||!path.isAbsolute(voice.path??'')||!/^[a-f0-9]{64}$/u.test(voice.sha256??''))throw Error('Prepared narration does not match this exact script/profile');
  return voice;
}
export function curatedStory(item){
  if(item.creative.sourceHypothesisId!=='sakura-pain-chia-viec')throw Error('Provide --brief for this different story angle; no automatic bulk copy');
  return {intentId:item.id,intentHash:item.intentHash,author:'Codex session, original one-item story',
    script:'Người nấu xong, ai nhận phần dọn?\n\nCả nhà vừa đứng lên, một người đã quay lại bếp. Ngoài kia còn hỏi: “Ủa, còn việc gì nữa hả?” Nghe vậy mới thấy mệt, chớ đâu phải vì một cái bàn.\n\nThôi, người gom chén, người cất đồ, việc chia cho rõ. Còn chọn nước lau, mình coi bề mặt trước. Đây là chai Sa cu ra năm trăm mi li.\n\nChụp ảnh chỗ cần lau, ghi tên vật liệu với lớp phủ nếu biết. Nhìn giống nhau, chưa chắc cùng chất liệu. Nhắn shop hỏi giá và điều kiện mua hiện tại. Rõ rồi mình hẵng chốt nha.',
    clipIds:['V090','V001','V043','V042'],headline:'Người nấu xong,\nai nhận phần dọn?',
    tension:'“Ủa, còn việc gì nữa hả?”',decision:'Chia việc cho rõ.\nChọn theo đúng nhu cầu.',
    identity:'SAKURA 500ml',questions:'Chụp ảnh bề mặt\nNêu vật liệu / lớp phủ',price:'Hỏi giá và điều kiện mua\ntrước khi chốt',
    stockLabel:'Cảnh minh họa · Không phải demo Sakura'};
}
export function validateBrief(brief,item){
  if(brief.intentId!==item.id||brief.intentHash!==item.intentHash||typeof brief.script!=='string'||brief.script.length<250||brief.script.length>1500
    ||brief.clipIds?.length!==4||new Set(brief.clipIds).size!==4)throw Error('A specific hash-bound story and four reviewed intervals are required');
  for(const key of ['script','headline','tension','decision','identity','questions','price','stockLabel']){
    if(typeof brief[key]!=='string'||!brief[key].trim())throw Error('Missing story text:'+key);assertEvergreen(brief[key]);
    const text=brief[key].normalize('NFD').replace(/\p{M}/gu,'').replaceAll('đ','d').toLowerCase();
    if(/sach bong|tay sach moi|diet khuan|diet virus|an toan tuyet doi|dung duoc moi|khach hang noi|khach da dung|cam ket|bao dam|chung nhan/.test(text))throw Error('Unsupported efficacy/safety/testimonial copy is outside this identity preview');
  }
  if(!/năm trăm|500/u.test(brief.script)||!/giá/u.test(brief.script)||!/điều kiện/u.test(brief.script)||!/bề mặt|vật liệu/u.test(brief.script))throw Error('Story must cover identity/material questions/current-price inquiry');
  return brief;
}
async function captionPreview(base,directory,editing,existingTimingFile){
  const source={queueId:base.intentId,audioPath:base.voice.path,audioSha256:base.voice.sha256,script:base.voice.script,
    scriptFile:base.voice.scriptFile,scriptSha256:base.voice.scriptSha256};
  if(await hashFile(source.audioPath)!==source.audioSha256||await hashFile(base.path)!==base.sha256)throw Error('Exact scale narration/intermediate changed before captioning');
  const timingDir=path.join(directory,'timing');await mkdir(timingDir,{recursive:true});let timed;
  if(existingTimingFile){timed=JSON.parse(await readFile(existingTimingFile,'utf8'));await verifySubtitleReceipt(timed,source);}
  else{
    const assets=await ensureSubtitleModel({download:false}),key=subtitleKey({...source,modelManifestSha256:assets.manifestSha256}),timingFile=path.join(timingDir,'receipt.json');
    try{timed=JSON.parse(await readFile(timingFile,'utf8'));await verifySubtitleReceipt(timed,source);if(timed.key!==key)throw Error('Timing model/script revision changed');}
    catch(e){if(e.code!=='ENOENT')throw e;}
    if(!timed){
      const {stdout:pcm}=await run(editing.ffmpeg,['-hide_banner','-loglevel','error','-i',source.audioPath,'-ac','1','-ar','16000','-f','f32le','pipe:1'],{encoding:'buffer',maxBuffer:20*1024*1024,timeout:30000,windowsHide:true});
      const samples=new Float32Array(pcm.buffer.slice(pcm.byteOffset,pcm.byteOffset+pcm.byteLength)),duration=samples.length/16000;
      let transcriber,output;console.log(JSON.stringify({id:base.intentId,status:'local_asr_caption_timing',threads:2,download:false}));
      try{transcriber=await createSubtitleTranscriber(assets);output=await transcriber.transcribe(samples);}finally{await transcriber?.dispose();}
      const activity=speechActivity(samples);let alignment=alignSubtitleScript(source.script,output.chunks,duration);
      if(!alignment.usable)alignment=phraseSubtitlePreview(source.script,output.chunks,duration,activity,{strictAlignment:alignment});
      const asrFile=path.join(timingDir,'asr.json'),alignmentFile=path.join(timingDir,'alignment.json');
      await writeFile(asrFile,JSON.stringify({audioSha256:source.audioSha256,scriptSha256:source.scriptSha256,model:assets.model,output,offline:true},null,2),'utf8');
      await writeFile(alignmentFile,JSON.stringify(alignment,null,2),'utf8');
      const srtFile=alignment.usable?path.join(timingDir,'voice.srt'):null,assFile=alignment.usable?path.join(timingDir,'voice.ass'):null;
      if(alignment.usable){await writeFile(srtFile,subtitleSrt(alignment.cues,duration),'utf8');await writeFile(assFile,subtitleAss(alignment.cues,duration),'utf8');}
      timed={schemaVersion:1,algorithmVersion:4,key,...source,receiptFile:timingFile,durationSeconds:duration,status:alignment.status,usable:alignment.usable,
        model:{...assets.model,manifestFile:assets.manifestFile,manifestSha256:assets.manifestSha256},asrFile,asrSha256:await hashFile(asrFile),alignmentFile,alignmentSha256:await hashFile(alignmentFile),
        srtFile,srtSha256:srtFile?await hashFile(srtFile):null,assFile,assSha256:assFile?await hashFile(assFile):null,
        timingMethod:alignment.method,coverage:alignment.coverage,lowConfidencePhrases:alignment.lowConfidencePhrases??[],criticalUnmatched:alignment.criticalUnmatched,
        alignmentConfidence:alignment.confidence??'ASR anchored; playback required',speechActivity:activity,offline:true,preciseWordAlignment:false,playbackVerified:false,published:false,createdAt:new Date().toISOString()};
      await writeFile(timingFile,JSON.stringify(timed,null,2),'utf8');
    }
  }
  await verifySubtitleReceipt(timed,source);
  if(!timed.usable){console.log(JSON.stringify({id:base.intentId,path:base.path,status:'needs_listening',captions:'needs_caption_review',timingReceipt:timed.receiptFile,coverage:timed.coverage,reason:'Actual anchors were inadequate; no uniform timing or invented captions'}));return;}
  const displayAliases={'Sa cu ra':'Sakura'},ass=(await readFile(timed.assFile,'utf8')).replaceAll('\\pos(540,1620)','\\pos(540,1330)').replaceAll('Sa cu ra','Sakura');assertEvergreen(ass);
  const digest=scaleHash({video:base.sha256,ass:scaleHash(ass),audio:source.audioSha256,renderer:'scale-caption-burn-v1'}).slice(0,16),folder=path.join(directory,'captioned-'+digest);await mkdir(folder,{recursive:true});
  const receiptFile=path.join(folder,'receipt.json');
  try{const previous=JSON.parse(await readFile(receiptFile,'utf8'));if(await hashFile(previous.path)!==previous.sha256||previous.voice.sha256!==source.audioSha256)throw Error('Captioned preview changed');console.log(JSON.stringify({id:base.intentId,path:previous.path,receiptFile,cached:true,status:'needs_listening'}));return;}catch(e){if(e.code!=='ENOENT')throw e;}
  const assFile=path.join(folder,'voice.ass');await writeFile(assFile,ass,'utf8');await copyFile('C:/Windows/Fonts/arial.ttf',path.join(folder,'Arial.ttf'));
  const video=path.join(folder,`${base.intentId}-captioned.mp4`);
  const captionSnapshot=path.join(folder,'caption-producer-source.mjs');await copyFile(fileURLToPath(import.meta.url),captionSnapshot);
  await run(editing.ffmpeg,['-hide_banner','-loglevel','error','-y','-i',base.path,'-vf','ass=filename=voice.ass:fontsdir=.','-map','0:v:0','-map','0:a:0','-c:v','libx264','-preset','veryfast','-crf','20','-threads','2','-pix_fmt','yuv420p','-c:a','copy','-movflags','+faststart',video],{cwd:folder,timeout:180000,maxBuffer:1024*1024,windowsHide:true});
  const {stdout:probeText}=await run(editing.ffprobe,['-v','error','-show_streams','-show_format','-of','json',video],{timeout:15000,windowsHide:true}),probe=JSON.parse(probeText),v=probe.streams.find(s=>s.codec_type==='video'),a=probe.streams.find(s=>s.codec_type==='audio');
  if(v?.width!==1080||v.height!==1920||v.codec_name!=='h264'||a?.codec_name!=='aac'||Math.abs(Number(probe.format.duration)-base.seconds)>.2)throw Error('Captioned scale technical QA failed');
  const sourceAudioHash=await run(editing.ffmpeg,['-hide_banner','-loglevel','error','-i',base.path,'-map','0:a:0','-c:a','copy','-f','hash','-hash','sha256','pipe:1'],{timeout:20000,windowsHide:true}),outputAudioHash=await run(editing.ffmpeg,['-hide_banner','-loglevel','error','-i',video,'-map','0:a:0','-c:a','copy','-f','hash','-hash','sha256','pipe:1'],{timeout:20000,windowsHide:true});
  if(sourceAudioHash.stdout.trim()!==outputAudioHash.stdout.trim())throw Error('Caption burn changed the source audio stream');
  const receipt={...base,path:video,sha256:await hashFile(video),sourceIntermediate:{path:base.path,sha256:base.sha256},sourceAudioStreamHash:sourceAudioHash.stdout.trim(),audioStreamCopied:true,
    captionProducerSource:{snapshot:captionSnapshot,sha256:await hashFile(captionSnapshot)},
    captions:{status:'needs_caption_playback_review',burned:true,receiptFile:timed.receiptFile,receiptSha256:await hashFile(timed.receiptFile),srtFile:timed.srtFile,srtSha256:timed.srtSha256,assFile,assSha256:await hashFile(assFile),displayAliases,captionBottomY:1330,coverage:timed.coverage,confidence:timed.alignmentConfidence,lowConfidencePhrases:timed.lowConfidencePhrases,timingMethod:timed.timingMethod,preciseWordAlignment:false,playbackVerified:false},
    blockers:['exact_audio_listening_review','final_caption_playback_review','music_selection_missing','native_schedule_window_unverified'],status:'needs_listening',publicationReady:false,createdAt:new Date().toISOString()};
  await writeFile(receiptFile,JSON.stringify(receipt,null,2),'utf8');
  for(const t of [1,5,10,14,Math.min(20,base.seconds-.5)])await run(editing.ffmpeg,['-hide_banner','-loglevel','error','-y','-ss',String(t),'-i',video,'-frames:v','1','-vf','scale=432:768',path.join(folder,`frame-${t}.jpg`)],{timeout:20000,windowsHide:true});
  console.log(JSON.stringify({id:base.intentId,path:video,sha256:receipt.sha256,receiptFile,wav:source.audioPath,seconds:base.seconds,captions:receipt.captions.status,srtFile:timed.srtFile,assFile,coverage:timed.coverage,audioStreamCopied:true,status:'needs_listening',published:false,scheduled:false}));
}
async function selfTest(){
  const assert=(await import('node:assert/strict')).default;
  const item={id:'sakura-scale-10002',campaignId:scalePolicy.campaignId,account:'saigomlia',productId:scalePolicy.productId,format:'video',leadCode:'GIỌNG10002',proposedPublishAt:'2026-10-29T08:50:00+07:00',location:scalePolicy.location,status:'planned',receipt:null,
    creative:{sourceHypothesisId:'sakura-pain-chia-viec',offerStage:'evergreen_no_discount'},promotion:{showDiscount:false,mode:'evergreen_no_discount'}};
  item.intentHash=scaleHash(payload(item));
  const plan={schemaVersion:1,policy:scalePolicy,sourceReservationsHash:'fixture',items:[item,...Array.from({length:999},(_,i)=>({id:'fixture-'+i,intentHash:'fixture',leadCode:'fixture-'+i}))]};
  plan.planHash=scaleHash({policy:plan.policy,sourceReservationsHash:plan.sourceReservationsHash,intents:plan.items.map(i=>i.intentHash)});
  assert.equal(validateVideoIntent(plan,item.id),item);const brief=validateBrief(curatedStory(item),item);assert.ok(brief.script.split(/\s+/u).length>100);
  for(const bad of ['Mua 1 tặng 1','Mua một tặng một','50 đơn đầu tiên','Chỉ hôm nay thôi','Khuyến mãi','Giảm giá','Ưu đãi'])assert.throws(()=>assertEvergreen(bad));
  assertEvergreen('Hỏi giá và điều kiện mua hiện tại.');
  assert.throws(()=>validateVideoIntent(plan,'sakura-101'));assert.throws(()=>validateVideoIntent({...plan,planHash:'changed'},item.id));
  assert.throws(()=>validateBrief({...brief,intentHash:'changed'},item));
  assert.throws(()=>validateBrief({...brief,script:brief.script+' Mua một tặng một.'},item));
  assert.throws(()=>validateBrief({...brief,script:brief.script+' Tẩy sạch mọi vết bẩn.'},item));
  assert.throws(()=>validateBrief({...brief,script:brief.script+' Khách hàng nói đã dùng rất tốt.'},item));
  item.status='published';assert.throws(()=>validateVideoIntent(plan,item.id));
  const registered=path.resolve('registered-plan.json'),state={campaign:{scaleCampaign:{manifestFile:registered,manifestSha256:'a'.repeat(64)}}};
  assert.equal(registeredPlanFile(state),registered);assert.equal(registeredPlanFile(state,registered),registered);
  assert.throws(()=>registeredPlanFile(state,path.resolve('old-plan.json')));assert.throws(()=>registeredPlanFile({}));
  const profile={voice:'Thùy Dung',speed:1.2,temperature:.8,referenceStyle:'speaker-only'},voice={provider:'vieneu',...profile,script:brief.script,scriptSha256:scaleHash(brief.script),path:path.resolve('fixture.wav'),sha256:'a'.repeat(64)};
  assert.equal(validatePreparedVoice(voice,brief.script,profile),voice);
  assert.throws(()=>validatePreparedVoice({...voice,script:'changed'},brief.script,profile));
  assert.throws(()=>validatePreparedVoice({...voice,speed:1.3},brief.script,profile));
  assert.throws(()=>validatePreparedVoice({...voice,scriptSha256:'b'.repeat(64)},brief.script,profile));
  console.log(JSON.stringify({selfTest:'passed',checks:24,modelsLoaded:0,mediaRendered:0,canonicalWrites:0}));
}
async function main(args){
  if(args.length===1&&args[0]==='--self-test'){await selfTest();return;}
  const options={};
  for(let i=0;i<args.length;i+=2){const key=args[i]?.replace(/^--/u,'');if(!['plan','id','brief','captions','voice-receipt'].includes(key)||!args[i+1]||args[i+1].startsWith('--'))throw Error('Use --id EXISTING_SCALE_VIDEO [--plan FILE] [--brief FILE] [--captions RECEIPT] [--voice-receipt RECEIPT]');options[key]=args[i+1];}
  const canonical=await loadState();options.plan=registeredPlanFile(canonical,options.plan);
  if(await hashFile(options.plan)!==canonical.campaign.scaleCampaign.manifestSha256)throw Error('Registered scale plan bytes changed');
  const plan=JSON.parse(await readFile(options.plan,'utf8')),item=validateVideoIntent(plan,options.id??plan.items.find(i=>i.format==='video')?.id);
  if(plan.planHash!==canonical.campaign.scaleCampaign.planHash)throw Error('Registered plan hash mismatch');
  const old=canonical.queue?.find(q=>q.id===item.id);
  if(old?.receipt||['submitting','needs_review','scheduled','published','under_review'].includes(old?.status))throw Error('Reconcile/preserve an already accepted or uncertain item');
  const brief=validateBrief(options.brief?JSON.parse(await readFile(options.brief,'utf8')):curatedStory(item),item);
  const reviewFile=path.join(root,'state/footage-visual-review.json'),review=JSON.parse(await readFile(reviewFile,'utf8'));
  const scenes=brief.clipIds.map(id=>{
    const clip=review.clips.find(c=>c.id===id),range=review.recommendedRanges.find(r=>r.id===id);
    if(!clip?.allowedForRootNeutralPool||!clip.catalogHashMatches||!clip.intervalContactSheet?.visuallyInspected||!range?.intervalFrameReviewVerified||range.end-range.start<2.99||range.end>clip.duration)throw Error('A visually reviewed3s interval is required:'+id);
    return {id,source:clip.source,sha256:clip.sourceSha256,sourceUrl:clip.sourceUrl,width:clip.width,height:clip.height,start:range.start,duration:3,cropCenterX:range.cropCenterX??.5,role:'stock_context_not_product_demo'};
  });
  for(const scene of scenes)if(await hashFile(scene.source)!==scene.sha256)throw Error('Footage source changed:'+scene.id);
  const editing=await loadEditingRuntime(path.join(root,'state/footage-toolchain/runtime.json')),runtime=await voiceRuntime(voiceHome),profile=voiceProfile(runtime);
  if(runtime.provider!=='vieneu'||profile.voice!=='Thùy Dung'||profile.speed!==1.2||profile.referenceStyle!=='speaker-only'||profile.temperature!==.8)throw Error('Expected existing accepted B profile; no substitution');
  const prepared=options['voice-receipt']?validatePreparedVoice(JSON.parse(await readFile(options['voice-receipt'],'utf8')),brief.script,profile):null;
  if(prepared&&(await hashFile(prepared.path)!==prepared.sha256||prepared.modelManifestSha256!==runtime.modelSha256||prepared.runtimeConfigSha256!==await hashFile(runtime.configFile)))throw Error('Prepared narration bytes/runtime changed');
  const helper=path.join(root,'scripts/voice-vieneu.py'),productSha256=await hashFile(productImage),scriptSha256=scaleHash(brief.script),
    binding={intentId:item.id,intentHash:item.intentHash,planHash:plan.planHash,brief,scenes,productSha256,profile,voiceModelManifestSha256:runtime.modelSha256,voiceHelperSha256:await hashFile(helper),ffmpegSha256:editing.ffmpegSha256,renderer:'scale-evergreen-preview-v3-call-cta',...(prepared?{preparedVoiceSha256:prepared.sha256}: {})},revision=scaleHash(binding).slice(0,16),
    directory=path.join(root,'state/scale-video-preview',`${item.id}-${revision}`);
  await mkdir(directory,{recursive:true});const resolved=await realpath(directory),privateBase=await realpath(path.join(root,'state/scale-video-preview'));
  if(!resolved.startsWith(privateBase+path.sep))throw Error('Output must remain in the private preview folder');
  const receiptFile=path.join(directory,'receipt.json');
  let prior;try{prior=JSON.parse(await readFile(receiptFile,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
  if(prior){if(prior.revision!==revision||await hashFile(prior.path)!==prior.sha256||await hashFile(prior.voice.path)!==prior.voice.sha256)throw Error('Cached preview changed; preserve and inspect');await captionPreview(prior,directory,editing,options.captions);return;}
  await writeFile(path.join(directory,'brief.json'),JSON.stringify(brief,null,2),'utf8');await writeFile(path.join(directory,'binding.json'),JSON.stringify(binding,null,2),'utf8');
  const producerSnapshot=path.join(directory,'producer-source.mjs');await copyFile(fileURLToPath(import.meta.url),producerSnapshot);
  const scriptFile=path.join(directory,'script.txt'),wav=path.join(directory,'voice.wav');await writeFile(scriptFile,brief.script,'utf8');
  const command=[runtime.python,'-I',helper,'--config',runtime.configFile,'--input',scriptFile,'--output',wav,'--voice',profile.voice,'--speed','1.2','--reference-style','speaker-only'];
  console.log(JSON.stringify({id:item.id,status:prepared?'reusing_exact_prepared_narration':'rendering_one_new_evergreen_voice',words:brief.script.split(/\s+/u).length,output:directory}));
  let workerOutput;
  if(prepared){await copyFile(prepared.path,wav);workerOutput=JSON.stringify({reused:true,source:prepared.path,sha256:prepared.sha256});}
  else({stdout:workerOutput}=await run(command[0],command.slice(1),{timeout:300000,maxBuffer:1024*1024,windowsHide:true,env:{...process.env,PYTHONUTF8:'1'}}));
  const qa=inspectWav(await readFile(wav)),voice={path:wav,sha256:await hashFile(wav),script:brief.script,scriptFile,scriptSha256,qa,provider:'vieneu',...profile,status:'rendered_needs_listening',listeningVerified:false,offline:true,
    command:prepared?null:command,...(prepared?{sourceVoiceReceipt:{path:path.resolve(options['voice-receipt']),sha256:await hashFile(options['voice-receipt']),sourceAudioPath:prepared.path,sourceAudioSha256:prepared.sha256}}:{}),workerOutput:workerOutput.trim(),runtimeConfigSha256:await hashFile(runtime.configFile),modelManifest:runtime.modelManifest,modelManifestSha256:runtime.modelSha256,helperSha256:binding.voiceHelperSha256,attribution:runtime.attribution};
  await writeFile(path.join(directory,'voice-receipt.json'),JSON.stringify(voice,null,2),'utf8');
  if(qa.durationSeconds<18||qa.durationSeconds>25)throw Error('Narration must be18–25s for the20–25s final video; preserve the chosen speed');
  const seconds=Math.max(20,Math.min(25,Math.ceil(qa.durationSeconds+.8))),stockSeconds=11,packshotSeconds=seconds-stockSeconds;
  await copyFile('C:/Windows/Fonts/arial.ttf',path.join(directory,'Arial.ttf'));await copyFile('C:/Windows/Fonts/arialbd.ttf',path.join(directory,'Arial-Bold.ttf'));
  const segments=[];
  for(const [index,scene]of scenes.entries()){
    const framing=scene.height>scene.width?'scale=1080:1440:force_original_aspect_ratio=decrease,pad=1080:1440:(ow-iw)/2:(oh-ih)/2:color=0xf8f2ed':`scale=1080:1440:force_original_aspect_ratio=increase,crop=1080:1440:x='max(0,min(iw-1080,iw*${scene.cropCenterX}-540))':y=(ih-1440)/2`;
    const cut=path.join(directory,`cut-${index}.mp4`);await run(editing.ffmpeg,['-hide_banner','-loglevel','error','-y','-ss',String(scene.start),'-i',scene.source,'-t','3','-an','-vf',`${framing},pad=1080:1920:0:240:color=0xf8f2ed,setsar=1,fps=30`,'-c:v','libx264','-preset','veryfast','-crf','21','-threads','2','-pix_fmt','yuv420p',cut],{timeout:120000,windowsHide:true});segments.push(cut);
  }
  const packshot=path.join(directory,'identity.mp4');await run(editing.ffmpeg,['-hide_banner','-loglevel','error','-y','-loop','1','-i',productImage,'-t',String(packshotSeconds),'-an','-vf','scale=900:950:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:510:color=0xf8f2ed,setsar=1,fps=30','-c:v','libx264','-preset','veryfast','-crf','20','-threads','2','-pix_fmt','yuv420p',packshot],{timeout:120000,windowsHide:true});segments.push(packshot);
  const texts={brand:'CHUYỆN NHÀ · HỎI ĐÚNG NHU CẦU',hook:wrapVideoText(brief.headline),tension:wrapVideoText(brief.tension),decision:wrapVideoText(brief.decision),identity:brief.identity,questions:brief.questions,price:brief.price,
    stock:brief.stockLabel,identityNote:'Ảnh tham chiếu nhận diện chai · Không kiểm chứng hiệu quả',cta:`Gọi số trong bio · Mã ${item.leadCode}`};
  for(const [name,text]of Object.entries(texts)){assertEvergreen(text);await writeFile(path.join(directory,name+'.txt'),text,'utf8');}
  const text=(name,size,y,enable,bold=false,color='0x392343')=>`drawtext=fontfile=${bold?'Arial-Bold.ttf':'Arial.ttf'}:textfile=${name}.txt:expansion=none:fontsize=${size}:fontcolor=${color}:x=(w-tw)/2:y=${y}:line_spacing=12${['cta','stock'].includes(name)?':box=1:boxcolor=0xf8f2ed:boxborderw=12':''}${enable?`:enable='${enable}'`:''}`;
  const filters=[text('brand',39,66,null,true),text('cta',38,214,null,true),"drawbox=x=45:y=277:w=990:h=220:color=0x392343@0.9:t=fill:enable='lt(t,11)'",text('hook',58,300,'lt(t,3)',true,'white'),text('tension',54,320,'gte(t,3)*lt(t,7)',true,'white'),text('decision',52,300,'gte(t,7)*lt(t,11)',true,'white'),text('stock',29,532,'lt(t,11)'),text('identity',62,290,'gte(t,11)',true),text('questions',42,377,'gte(t,11)*lt(t,18)',true),text('price',43,377,'gte(t,18)',true),text('identityNote',28,1490,'gte(t,11)')];
  const captions={status:'needs_caption_review',burned:false,reason:'No actual hash-bound timed asset was supplied for this new WAV; no timing fabricated'};
  const transition=transitionGraph(segments.length),graph=[...transition.filters,`[${transition.output}]${filters.join(',')}[outv]`].join(';');await writeFile(path.join(directory,'filter.txt'),graph,'utf8');
  const video=path.join(directory,`${item.id}.mp4`);console.log(JSON.stringify({id:item.id,status:'rendering_one_full_video',seconds,captions:captions.status}));
  await run(editing.ffmpeg,['-hide_banner','-loglevel','error','-y',...segments.flatMap(file=>['-i',file]),'-i',wav,'-filter_complex_threads','1','-filter_complex',graph,'-map','[outv]','-map',`${segments.length}:a:0`,'-c:v','libx264','-preset','veryfast','-crf','20','-threads','2','-pix_fmt','yuv420p','-af','apad','-t',String(seconds),'-c:a','aac','-b:a','192k','-movflags','+faststart',video],{cwd:directory,timeout:180000,maxBuffer:1024*1024,windowsHide:true});
  const {stdout}=await run(editing.ffprobe,['-v','error','-show_streams','-show_format','-of','json',video],{timeout:15000,windowsHide:true}),probe=JSON.parse(stdout),v=probe.streams.find(s=>s.codec_type==='video'),a=probe.streams.find(s=>s.codec_type==='audio');
  if(v?.width!==1080||v.height!==1920||v.codec_name!=='h264'||a?.codec_name!=='aac'||Math.abs(Number(probe.format.duration)-seconds)>.2)throw Error('Scale preview technical video QA failed');
  const caption=captionWithVoiceCredit(`${brief.headline.replaceAll('\n',' ')}\n\nTìm hiểu Sakura500ml. Gọi số điện thoại trong bio để được tư vấn; nêu nhu cầu, vật liệu và lớp phủ nếu biết. Hỏi giá và điều kiện mua hiện tại trước khi chốt.\nNhắc mã ${item.leadCode} khi gọi.\nTình huống minh họa; không phải thử nghiệm hay lời chứng thực.`, 'vieneu');assertEvergreen(caption);
  const receipt={schemaVersion:1,intentId:item.id,intentHash:item.intentHash,planHash:plan.planHash,sourcePlanFile:path.resolve(options.plan),sourcePlanSha256:await hashFile(options.plan),revision,path:video,sha256:await hashFile(video),seconds,voice,caption,leadCode:item.leadCode,scenes,
    producerSource:{snapshot:producerSnapshot,sha256:await hashFile(producerSnapshot)},
    productImage:{path:productImage,sha256:productSha256,role:'user_supplied_product_identity_reference',manufacturerLabelClaimsVerified:false},reviewManifestSha256:await hashFile(reviewFile),editingRuntime:{...editing,ffprobeSha256:await hashFile(editing.ffprobe)},captions,
    status:'needs_listening',blockers:['exact_audio_listening_review','final_video_playback_review',captions.status,'music_selection_missing','native_schedule_window_unverified'],musicAdded:false,stockIsProductDemo:false,efficacyDemoEvidence:null,listeningVerified:false,visualPlaybackVerified:false,
    publicationReady:false,published:false,scheduled:false,canonicalQueueModified:false,createdAt:new Date().toISOString()};
  await writeFile(receiptFile,JSON.stringify(receipt,null,2),'utf8');
  for(const t of [1,5,10,14,Math.min(20,seconds-.5)])await run(editing.ffmpeg,['-hide_banner','-loglevel','error','-y','-ss',String(t),'-i',video,'-frames:v','1','-vf','scale=432:768',path.join(directory,`frame-${t}.jpg`)],{timeout:20000,windowsHide:true});
  console.log(JSON.stringify({id:item.id,path:video,sha256:receipt.sha256,wav,voiceSeconds:qa.durationSeconds,seconds,receiptFile,status:receipt.status,captions:captions.status,listeningVerified:false,scheduled:false,published:false}));
  await captionPreview(receipt,directory,editing,options.captions);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main(process.argv.slice(2)).catch(e=>{console.error(e.message);process.exitCode=1;});
