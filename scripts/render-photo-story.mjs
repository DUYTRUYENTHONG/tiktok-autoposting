import fs from 'node:fs/promises';
import path from 'node:path';
import {root,loadState,hashFile} from '../src/store.mjs';
import {renderMotionVideo} from '../src/motion-render.mjs';
import {voiceRuntime,voiceHome} from '../src/voice.mjs';
import {loadReviewedVoice} from '../src/reviewed-voice.mjs';
import {loadEditingRuntime} from '../src/footage-video.mjs';
import {verifySubtitleReceipt} from '../src/video-subtitles.mjs';
import {validateMotionCopy} from '../src/motion-plan.mjs';
import {privateMotionFile} from '../src/motion-tools.mjs';
import {createScaleProgress} from '../src/scale-progress.mjs';
import {validateVideoIntent,validateBrief,publicVideoCopy,groundVideoBrief} from './render-scale-video-preview.mjs';

const [planFile]=process.argv.slice(2);
if(!planFile||!path.isAbsolute(planFile))throw Error('Pass one absolute private reviewed photo-story plan');
await privateMotionFile(planFile);
const plan=JSON.parse(await fs.readFile(planFile,'utf8')),state=await loadState(),registration=state.campaign.scaleCampaign;
if(await hashFile(registration.manifestFile)!==registration.manifestSha256)throw Error('Registered source plan changed');
const sourcePlan=JSON.parse(await fs.readFile(registration.manifestFile,'utf8')),item=validateVideoIntent(sourcePlan,plan.intentId),queued=state.queue.find(q=>q.id===item.id);
if(queued?.receipt||['submitting','needs_review','scheduled','published','under_review'].includes(queued?.status))throw Error('Preserve accepted/uncertain content');
const progress=await createScaleProgress().status(),record=progress.items.find(r=>r.id===item.id);
if(['submitting','needs_review','scheduled','published','under_review'].includes(record?.status)||record?.canonicalApplyPending)throw Error('Preserve accepted/uncertain scale progress');
const dir=path.resolve(plan.outputDirectory),privateRoot=await fs.realpath(path.join(root,'state'));
if(!dir.startsWith(privateRoot+path.sep)||!/^[-a-z0-9]+\.mp4$/u.test(plan.outputName??''))throw Error('Use a private output and a plain filename');
await fs.mkdir(dir,{recursive:true});const receiptFile=path.join(dir,'receipt.json');
if(!(await fs.realpath(dir)).startsWith(privateRoot+path.sep))throw Error('Output junction escapes private state');
try{await fs.access(receiptFile);throw Error('Preserve the existing render; use a new sibling revision');}catch(e){if(e.code!=='ENOENT')throw e;}
try{await fs.access(path.join(dir,plan.outputName));throw Error('Inspect the existing unreceipted video; use a new sibling revision');}catch(e){if(e.code!=='ENOENT')throw e;}
const lockFile=path.join(dir,'render.lock'),lock=await fs.open(lockFile,'wx');
try{
validateMotionCopy(plan);
const brief=validateBrief(JSON.parse(await fs.readFile(plan.briefFile,'utf8')),item),grounding=await groundVideoBrief(brief,item,{additionalPublicCopy:{hook:plan.hook,contextHeader:plan.contextHeader,bodyHeading:plan.bodyHeading,bodyDetail:plan.bodyDetail,questions:plan.questions}}),runtime=await voiceRuntime(voiceHome);
const reviewed=await loadReviewedVoice({receiptFile:plan.voiceReceiptFile,approvalFile:plan.voiceApprovalFile,script:brief.script,item,runtime,helperFile:path.join(root,'scripts/voice-vieneu.py')}),voice=reviewed.voice;
const timing=JSON.parse(await fs.readFile(plan.timingReceiptFile,'utf8'));
if(await hashFile(plan.timingReceiptFile)!==plan.timingReceiptSha256)throw Error('Caption source changed');
await verifySubtitleReceipt(timing,{queueId:item.id,audioPath:voice.path,audioSha256:voice.sha256,script:voice.script,scriptFile:voice.scriptFile,scriptSha256:voice.scriptSha256});
const alignment=JSON.parse(await fs.readFile(timing.alignmentFile,'utf8')),baseline=JSON.parse(await fs.readFile(plan.audioBaselineReceiptFile,'utf8'));
if(await hashFile(plan.audioBaselineReceiptFile)!==plan.audioBaselineReceiptSha256||baseline.voice.sha256!==voice.sha256||baseline.voice.scriptSha256!==voice.scriptSha256||await hashFile(baseline.path)!==baseline.sha256)throw Error('Audio baseline must contain the same exact approved narration');
const review=JSON.parse(await fs.readFile(plan.photoReviewFile,'utf8'));
if(await hashFile(plan.photoReviewFile)!==plan.photoReviewSha256||plan.photos?.length!==2)throw Error('Actual reviewed photo sources required');
for(const photo of plan.photos){if(photo.kind&&photo.kind!=='image')throw Error('This production adapter accepts reviewed photos only; moving footage needs an interval-review adapter');const r=review.items.find(r=>r.key===photo.key);if(!r?.accepted||!r.visuallyInspected||JSON.stringify(r.crop)!==JSON.stringify(photo.crop)||await hashFile(photo.source)!==photo.sha256||r.sha256!==photo.sha256)throw Error('Photo crop/source lacks exact visual review');const c=photo.crop;if(c?.length!==4||c.some(x=>!Number.isFinite(x))||c[0]<0||c[1]<0||c[2]<=0||c[3]<=0||c[0]+c[2]>1||c[1]+c[3]>1)throw Error('Invalid reviewed crop');}
if(await hashFile(plan.productImage)!==baseline.productImage.sha256)throw Error('Authentic product reference changed');
if(plan.boundaryCueIndices?.length!==4||!Number.isInteger(plan.durationFrames)||plan.durationFrames<600||plan.durationFrames>750||plan.durationFrames/30<voice.qa.durationSeconds+.25)throw Error('Preserve complete speech in a20–25second edit');
const boundaries=[0,...plan.boundaryCueIndices.map(i=>{const cue=alignment.cues[i];if(!Number.isInteger(i)||!Number.isFinite(cue?.start))throw Error('Use actual phrase anchors');return Math.round(cue.start*30);}),plan.durationFrames];
if(boundaries.some((v,i)=>i&&v-boundaries[i-1]<24))throw Error('Allow each story beat readable screen time');
const editing=await loadEditingRuntime(path.join(root,'state/footage-toolchain/runtime.json'));
if(reviewed.qa.durationSeconds<18||reviewed.qa.durationSeconds>25)throw Error('Use the exact approved full narration,18–25seconds');
const producerSnapshot=path.join(dir,'producer-source.mjs');await fs.copyFile(new URL(import.meta.url),producerSnapshot);
await fs.writeFile(path.join(dir,'grounding.json'),JSON.stringify(grounding,null,2));await fs.writeFile(path.join(dir,'caption.txt'),publicVideoCopy(brief).caption);
const result=await renderMotionVideo({plan,boundaries,cues:alignment.cues,baseline,editing,directory:dir});
const receipt={schemaVersion:1,intentId:item.id,intentHash:item.intentHash,planHash:sourcePlan.planHash,...result,voice:{...voice,listeningVerified:true,reviewedVoiceProof:reviewed.proof,sourceListeningApproval:reviewed.approval},caption:publicVideoCopy(brief).caption,grounding,productImage:baseline.productImage,photos:plan.photos,photoReviewFile:plan.photoReviewFile,photoReviewSha256:plan.photoReviewSha256,editorialTimeline:{boundariesFrames:boundaries,phraseCueIndices:plan.boundaryCueIndices,photographicLayersOnly:plan.photos.every(p=>p.kind!=='video'),movingBrollClaimed:plan.photos.some(p=>p.kind==='video')},planFile,planSha256:await hashFile(planFile),producerSource:{snapshot:producerSnapshot,sha256:await hashFile(producerSnapshot)},captions:{receiptFile:plan.timingReceiptFile,receiptSha256:plan.timingReceiptSha256,drawnBy:plan.burnCaptions===false?'none':'JavaScript Canvas',timingPreserved:true,preciseWordAlignment:false,playbackVerified:false},baseline:{path:baseline.path,sha256:baseline.sha256},watermarksPrinted:false,musicAdded:false,visualPlaybackVerified:false,publicationReady:false,status:'needs_final_visual_and_music_review',scheduled:false,published:false,canonicalQueueModified:false,createdAt:new Date().toISOString()};
await fs.writeFile(receiptFile,JSON.stringify(receipt,null,2));
console.log(JSON.stringify({path:result.path,sha256:result.sha256,receiptFile,seconds:result.seconds,engine:'Sakura JavaScript Canvas',narrationApproved:true,musicAdded:false,published:false,scheduled:false}));
}finally{await lock.close();await fs.unlink(lockFile);}
