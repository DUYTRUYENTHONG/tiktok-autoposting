import {readFile,writeFile,copyFile,mkdir,stat,realpath,rename} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {root,hashFile} from './store.mjs';

export const herkCommit='10511e5af86fc47756ea89803b397422e2d89284';
const validatorRelative='.agents/skills/short-form-edit/scripts/validate-footage.mjs';
const validatorLfSha256='106a51a0a08fd31938741c6d0c9ddd80d5eaf4a88194e9b2b68ac81247df899d';
const defaultUpstream=path.join(root,'state/upstream/herk-edit-kit'),defaultOutput=path.join(root,'state/herk-edits');
const run=promisify(execFile),isHash=v=>/^[a-f0-9]{64}$/.test(v??'');
const hash=v=>createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
const digest=v=>hash(stable(v));
const withoutRecordHash=v=>Object.fromEntries(Object.entries(v).filter(([key])=>key!=='recordHash'));
async function json(file){if(!path.isAbsolute(file??'')||(await stat(file)).size>8*1024*1024)throw Error('Expected an absolute bounded JSON input');return JSON.parse((await readFile(file,'utf8')).replace(/^\uFEFF/,''));}
async function input(role,source,expected,target){
  if(!path.isAbsolute(source??'')||!isHash(expected))throw Error('Missing absolute source/hash: '+role);
  const info=await stat(source);if(!info.isFile()||info.size>300*1024*1024)throw Error('Unsupported/oversize source: '+role);
  if(await hashFile(source)!==expected)throw Error('Source checksum changed: '+role);
  return {role,source,sha256:expected,bytes:info.size,target};
}
async function upstreamStatus(directory){
  let reportedCommit=null,validatorHash=null;
  try{
    let head=(await readFile(path.join(directory,'.git/HEAD'),'utf8')).trim();
    if(head.startsWith('ref: ')){
      const ref=head.slice(5);if(!/^refs\/[\w/.-]+$/.test(ref)||ref.includes('..'))throw Error('Invalid upstream ref');
      try{head=(await readFile(path.join(directory,'.git',ref),'utf8')).trim();}
      catch(e){if(e.code!=='ENOENT')throw e;head=(await readFile(path.join(directory,'.git/packed-refs'),'utf8')).split(/\r?\n/).find(line=>line.endsWith(' '+ref))?.split(' ')[0];}
    }
    reportedCommit=head;
    validatorHash=hash((await readFile(path.join(directory,validatorRelative),'utf8')).replaceAll('\r\n','\n'));
  }catch(e){if(e.code!=='ENOENT')throw e;}
  let hyperframesInstalled=false;try{hyperframesInstalled=(await stat(path.join(directory,'node_modules/hyperframes/package.json'))).isFile();}catch(e){if(e.code!=='ENOENT')throw e;}
  return {checkout:directory,expectedCommit:herkCommit,reportedCommit,commitMatchesPin:reportedCommit===herkCommit,validatorPath:path.join(directory,validatorRelative),validatorLfSha256:validatorHash,reviewedValidatorMatches:validatorHash===validatorLfSha256,hyperframesInstalled,cloudProviders:'disabled',ttsRun:false};
}
export function rawHerkTranscript(asr,duration){
  if(!Array.isArray(asr.output?.chunks)||!asr.output.chunks.length||!Number.isFinite(duration)||duration<=0)throw Error('Actual raw ASR chunks and WAV duration required');
  const words=[],invalidChunks=[];let previous=-1;
  for(const [index,chunk]of asr.output.chunks.entries()){
    const t=chunk.timestamp;
    if(typeof chunk.text!=='string'||!Array.isArray(t)||t.length!==2||t.some(v=>!Number.isFinite(v))||t[0]<0||t[1]<=t[0]||t[1]>duration+.03||t[0]<previous){invalidChunks.push(index);continue;}
    words.push({text:chunk.text,start:t[0],end:t[1],sourceStart:t[0],sourceEnd:t[1],rawChunkIndex:index});previous=t[0];
  }
  return {text:asr.output.text??null,audio_duration_secs:duration,words,invalidChunks,timingGranularity:'raw_asr_chunks_unreviewed',recognizedTextReplaced:false,wordAccuracyVerified:false,scriptUsedForCorrection:false,reviewRequired:true};
}

/** Inspect existing evidence only. No models, probes, rendering or state changes. */
export async function inspectHerkEdit({receiptFile,reviewFile,expectedReceiptSha256,upstreamRoot=defaultUpstream}={}){
  const receipt=await json(receiptFile),receiptHash=await hashFile(receiptFile);
  if(expectedReceiptSha256&&receiptHash!==expectedReceiptSha256)throw Error('Input receipt checksum changed');
  if(!/^sakura-scale-\d{5}$/.test(receipt.intentId??'')||receipt.schemaVersion!==1||!Number.isFinite(receipt.seconds)||receipt.seconds<1||receipt.seconds>60||receipt.scenes?.length!==4)throw Error('Expected one existing bounded four-shot scale-video receipt');
  const voice=receipt.voice;if(typeof voice?.script!=='string'||hash(voice.script)!==voice.scriptSha256)throw Error('Exact narration script hash mismatch');
  const audioDuration=voice.qa?.durationSeconds;if(!Number.isFinite(audioDuration)||audioDuration<=0||audioDuration>receipt.seconds+.03)throw Error('Actual WAV duration evidence missing');
  const inputs=[await input('receipt',receiptFile,receiptHash,'source-receipt.json'),await input('voice',voice.path,voice.sha256,'assets/voice.wav'),await input('preview',receipt.path,receipt.sha256,'assets/reference-preview.mp4'),await input('product',receipt.productImage?.path,receipt.productImage?.sha256,'assets/product-reference'+path.extname(receipt.productImage?.path??'').toLowerCase())];
  if(receipt.sourceIntermediate)inputs.push(await input('source-intermediate',receipt.sourceIntermediate.path,receipt.sourceIntermediate.sha256,'assets/source-intermediate.mp4'));
  const producer=await input('producer-snapshot',receipt.producerSource?.snapshot,receipt.producerSource?.sha256,'evidence/producer-source.mjs');inputs.push(producer);
  const producerText=await readFile(producer.source,'utf8');
  if(!producerText.includes('transitionGraph(segments.length)')||!producerText.includes('fps=30'))throw Error('Unsupported source renderer: explicit timeline evidence required');
  const filterFile=path.join(path.dirname(producer.source),'filter.txt'),filter=await readFile(filterFile,'utf8');inputs.push(await input('renderer-filter',filterFile,await hashFile(filterFile),'evidence/source-filter.txt'));
  const fades=[...filter.matchAll(/xfade=transition=fade:duration=([\d.]+):offset=([\d.]+)/g)].map(m=>({duration:Number(m[1]),at:Number(m[2])}));
  if(fades.length!==4||fades.some((f,i)=>f.duration!==.25||f.at!==(i+1)*2.75))throw Error('Unsupported/changed source crossfade timeline');
  const timeline=[],ledger=[];
  for(const [i,s]of receipt.scenes.entries()){
    if(!/^V\d{3}$/.test(s.id??'')||s.duration!==3||!Number.isFinite(s.start)||s.start<0||s.role!=='stock_context_not_product_demo')throw Error('Unsupported source footage interval');
    const asset=await input('footage-'+s.id,s.source,s.sha256,`assets/footage/scene-${i+1}.mp4`);inputs.push(asset);
    const sceneId='stock-'+(i+1);timeline.push({id:sceneId,start:i*2.75,end:i*2.75+3,mode:'footage',layout:'broll',kind:`footage/scene-${i+1}`,sourceSceneId:s.id,anchor:null,anchorTime:null,sourceStart:s.start,sourceEnd:s.start+3,role:s.role});
    ledger.push({scene:sceneId,sourceSceneId:s.id,asset:asset.target,sha256:s.sha256,sourceStart:s.start,sourceEnd:s.start+3,sourceUrl:s.sourceUrl??null,illustrativeStock:true,productEfficacyEvidence:false});
  }
  timeline.push({id:'product-identity',start:11,end:receipt.seconds,mode:'product_identity',layout:'product',anchor:null,anchorTime:null,asset:inputs.find(i=>i.role==='product').target,role:'authentic_identity_reference_not_efficacy_demo'});
  const timingFile=receipt.captions?.receiptFile??path.join(path.dirname(producer.source),'timing/receipt.json'),timing=await json(timingFile);
  const timingHash=await hashFile(timingFile);if(receipt.captions?.receiptSha256&&receipt.captions.receiptSha256!==timingHash)throw Error('Caption timing receipt checksum changed');
  if(timing.queueId!==receipt.intentId||timing.audioSha256!==voice.sha256||timing.scriptSha256!==voice.scriptSha256||Math.abs(timing.durationSeconds-audioDuration)>.03)throw Error('Stale/wrong audio ASR timing receipt');
  inputs.push(await input('asr-receipt',timingFile,timingHash,'assets/asr-receipt.json'));
  const asr=await json(timing.asrFile);inputs.push(await input('raw-asr',timing.asrFile,timing.asrSha256,'assets/asr-raw.json'));
  if(asr.audioSha256!==voice.sha256||asr.scriptSha256!==voice.scriptSha256||asr.offline!==true)throw Error('Stale/wrong source raw ASR binding');
  const transcript=rawHerkTranscript(asr,timing.durationSeconds);
  let sourceReview={decision:'not_imported',approvalInherited:false};
  if(reviewFile){const review=await json(reviewFile);if(review.audioSha256!==voice.sha256||review.scriptSha256!==voice.scriptSha256)throw Error('Listening feedback belongs to different exact audio/script');inputs.push(await input('listening-feedback',reviewFile,await hashFile(reviewFile),'evidence/source-listening-feedback.json'));sourceReview={decision:review.decision??'unknown',reason:review.reason??null,reviewedAt:review.reviewedAt??null,approvalInherited:false};}
  if(inputs.reduce((sum,i)=>sum+i.bytes,0)>900*1024*1024)throw Error('One editing draft exceeds900MB bounded copy budget');
  const upstream=await upstreamStatus(upstreamRoot),bindingHash=digest({version:1,commit:herkCommit,intentId:receipt.intentId,inputs:inputs.map(i=>({role:i.role,sha256:i.sha256,target:i.target}))});
  return {version:1,intentId:receipt.intentId,bindingHash,receipt,inputs,timeline,ledger,transcript,sourceReview,upstream,status:'editing_draft_unready',publicationReady:false,listeningApprovalInherited:false,audioTransformsApplied:[],naturalPausesPreserved:true,
    blockers:['raw_asr_text_and_word_timing_unreviewed','scene_word_anchors_missing','caption_plan_missing','editorial_and_encoded_playback_review_missing','exact_audio_requires_revision_or_listening_review','music_selection_missing','no_production_readiness_inherited',...(!upstream.commitMatchesPin?['upstream_checkout_pin_missing']:[]),...(!upstream.reviewedValidatorMatches?['reviewed_upstream_validator_missing_or_changed']:[]),...(!upstream.hyperframesInstalled?['hyperframes_runtime_not_provisioned']:[]),...(transcript.invalidChunks.length?['raw_asr_invalid_chunks_preserved_in_original_file']:[])]};
}
async function outputDirectory(outputRoot){
  if(!path.isAbsolute(outputRoot))throw Error('Absolute private output root required');
  const inside=(p,b)=>p.toLowerCase()===b.toLowerCase()||p.toLowerCase().startsWith(b.toLowerCase()+path.sep);
  const repo=await realpath(root),allowed=path.join(repo,'state');let ancestor=path.resolve(outputRoot),suffix=[];
  for(;;){try{ancestor=await realpath(ancestor);break;}catch(e){if(e.code!=='ENOENT')throw e;suffix.unshift(path.basename(ancestor));const next=path.dirname(ancestor);if(next===ancestor)throw e;ancestor=next;}}
  const resolved=path.join(ancestor,...suffix);if(inside(resolved,repo)&&!inside(resolved,allowed))throw Error('Editing artifacts must stay in ignored state or outside Git');
  await mkdir(outputRoot,{recursive:true});const actual=await realpath(outputRoot);
  if(inside(actual,repo)&&!inside(actual,allowed))throw Error('Editing artifacts must stay in ignored state or outside Git');return actual;
}
async function validateLocalFootage(directory,upstreamRoot){
  const upstream=await upstreamStatus(upstreamRoot);if(!upstream.commitMatchesPin||!upstream.reviewedValidatorMatches)throw Error('Reviewed pinned footage validator changed/unavailable');
  try{const result=await run(process.execPath,[upstream.validatorPath,directory],{timeout:30000,maxBuffer:1024*1024,windowsHide:true});return {status:'passed',result:JSON.parse(result.stdout),validatorLfSha256};}
  catch(e){if(e.killed||!e.stdout)throw e;return {status:'failed',result:JSON.parse(e.stdout),validatorLfSha256};}
}

/** Copies exact existing bytes into a private unready editing workspace. */
export async function prepareHerkEdit(options={}){
  const inspected=await inspectHerkEdit(options);if(!inspected.upstream.commitMatchesPin)throw Error('Pinned upstream checkout is required before preparation');
  const base=await outputDirectory(options.outputRoot??defaultOutput),directory=path.join(base,inspected.intentId+'-'+inspected.bindingHash.slice(0,16)),manifestFile=path.join(directory,'herk-edit.json');
  let prior;try{prior=await json(manifestFile);}catch(e){if(e.code!=='ENOENT')throw e;try{await stat(directory);throw Error('Existing editing directory has no valid manifest');}catch(missing){if(missing.code!=='ENOENT')throw missing;}}
  if(prior){const {recordHash,...payload}=prior;if(recordHash!==digest(payload)||prior.bindingHash!==inspected.bindingHash)throw Error('Existing editing manifest changed');for(const a of prior.artifacts){let actual;try{actual=await hashFile(path.join(directory,a.path));}catch{throw Error('Existing editing asset missing: '+a.path);}if(actual!==a.sha256)throw Error('Existing editing asset changed: '+a.path);}
    if(options.runFootageValidator&&prior.footageValidation.status==='not_run'){prior.footageValidation=await validateLocalFootage(directory,options.upstreamRoot??defaultUpstream);prior.recordHash=digest(withoutRecordHash(prior));const temp=manifestFile+'.'+randomUUID()+'.tmp';await writeFile(temp,JSON.stringify(prior,null,2),'utf8');await rename(temp,manifestFile);}
    return {directory,manifestFile,reused:true,manifest:prior};}
  const stage=path.join(base,'.draft-'+randomUUID());await mkdir(stage);
  const artifacts=[];
  for(const item of inspected.inputs){const dest=path.join(stage,item.target);await mkdir(path.dirname(dest),{recursive:true});await copyFile(item.source,dest);if(await hashFile(dest)!==item.sha256||await hashFile(item.source)!==item.sha256)throw Error('Source changed during private copy: '+item.role);artifacts.push({path:item.target,sha256:item.sha256,role:item.role});}
  const plan={version:1,status:'draft_needs_editorial_review',fps:30,width:1080,height:1920,duration:inspected.receipt.seconds,timelineProvenance:'source receipt intervals plus pinned-hash producer snapshot/current filter offsets; not encoded-frame verification',scenes:inspected.timeline,transitions:{type:'source_quarter_second_crossfades',overlapsPreserved:true},events:[],captions:[],reviewedWordAnchors:false,ready:false};
  const edl={version:1,mode:'no_cut_reference_export',source:'assets/reference-preview.mp4',sourceSha256:inspected.receipt.sha256,keeps:[{sourceStart:0,sourceEnd:inspected.receipt.seconds,start:0,end:inspected.receipt.seconds}],cuts:[],audioTransformsApplied:[],naturalPausesPreserved:true};
  const documents={
    'assets/plan.json':JSON.stringify(plan,null,2),'assets/transcript.json':JSON.stringify(inspected.transcript,null,2),'assets/edit-decisions.json':JSON.stringify(edl,null,2),'assets/footage-ledger.json':JSON.stringify(inspected.ledger,null,2),
    'DESIGN.md':'# Sakura editing draft\n\nSource-derived portrait1080x1920/30fps; plum#392343 and ivory#f8f2ed from the copied renderer filter. Arial is referenced, not bundled here. Preserve authentic product identity and illustrative-stock labels. No AIS logos, invented efficacy, testimonials, prices or discount claims.\n\nPreserve exact narration bytes and natural pauses; rejection feedback is not permission to trim pauses. ASR recognition is unreviewed. Establish story beats and real word anchors before authoring HyperFrames. Caption/UI safety, motion, music and listening still require review.\n',
    'VERIFY.md':'# Unready editing export\n\nNo audio processing, synthesis, ASR rerun, render, preview or publication occurred. The WAV and source videos are exact copies. Raw recognized ASR text/timestamps were retained; script text was not substituted. Invalid chunks, if any, remain in asr-raw.json and are listed in transcript.json.\n\nThe no-cut EDL retains the entire existing preview. Scene intervals come from the source3s clips and verified0.25s crossfade offsets; overlaps are intentional, not a new hard-cut plan. No word anchors or filler visual events were invented. The upstream plan validator is deliberately not claimed passed. Build/review an actual caption/event/anchor plan first. No listening, grounding, native music or posting readiness transfers to this workspace.\n',
  };
  for(const [relative,text]of Object.entries(documents)){await writeFile(path.join(stage,relative),text,'utf8');artifacts.push({path:relative,sha256:await hashFile(path.join(stage,relative)),role:'editing-draft'});}
  let footageValidation={status:'not_run'};
  if(options.runFootageValidator){
    footageValidation=await validateLocalFootage(stage,options.upstreamRoot??defaultUpstream);
  }
  const manifest={version:1,intentId:inspected.intentId,bindingHash:inspected.bindingHash,status:'editing_draft_unready',publicationReady:false,listeningApprovalInherited:false,naturalPausesPreserved:true,audioTransformsApplied:[],upstream:inspected.upstream,sourceReview:inspected.sourceReview,sourceReceiptSha256:inspected.inputs[0].sha256,sourceAudioSha256:inspected.receipt.voice.sha256,sourceScriptSha256:inspected.receipt.voice.scriptSha256,sourceGroundingBindingHash:inspected.receipt.grounding?.bindingHash??null,groundingApprovalInherited:false,rawAsrAccuracy:'unreviewed',blockers:inspected.blockers,artifacts,footageValidation,planValidation:{status:'not_run',reason:'No reviewed word anchors/caption plan; source crossfades overlap'},createdAt:new Date().toISOString()};
  manifest.recordHash=digest(manifest);await writeFile(path.join(stage,'herk-edit.json'),JSON.stringify(manifest,null,2),'utf8');await rename(stage,directory);return {directory,manifestFile,reused:false,manifest};
}
