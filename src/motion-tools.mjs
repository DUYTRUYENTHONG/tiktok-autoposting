import fs from 'node:fs/promises';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {root,hashFile} from './store.mjs';
import {loadEditingRuntime} from './footage-video.mjs';
const run=promisify(execFile);

// Resolve real bytes, including junctions/symlinks, before opening private artifacts.
export async function privateMotionFile(file,extension='.json',base=path.join(root,'state')){
  if(!path.isAbsolute(file)||path.extname(file).toLowerCase()!==extension)throw Error('Use an absolute private artifact path');
  const [directory,actual]=await Promise.all([fs.realpath(base),fs.realpath(file)]);
  const relative=path.relative(directory,actual);
  if(!relative||relative==='..'||relative.startsWith('..'+path.sep)||path.isAbsolute(relative))throw Error('Artifact escapes private state');
  if(!(await fs.stat(actual)).isFile())throw Error('Artifact must be a file');
  return actual;
}
export async function motionStatus(){
  const pins=JSON.parse(await fs.readFile(path.join(root,'config/video-toolkits.json'),'utf8'));
  return {engine:'Sakura JavaScript Canvas',format:{width:1080,height:1920,fps:30},
    supportedProductionInputs:'Two reviewed photos, authentic product image, exact approved narration and ASR phrase timing',
    editableOutputs:['scene-plan.json','index.html'],videoOutput:'H.264 MP4 with copied AAC narration',
    runtime:{node:process.versions.node,playwright:pins.playwright,chromiumRequiresLocalInstall:true},
    upstream:pins.sources,cloudProvidersEnabled:false,trainingRun:false,automaticTikTokPosting:false,
    music:'Selected separately through the account native commercial library; never downloaded by this renderer'};
}
export async function inspectMotionReceipt(file){
  const actual=await privateMotionFile(file),receipt=JSON.parse(await fs.readFile(actual,'utf8'));
  if(receipt.animation?.engine!=='Sakura JavaScript Canvas'||receipt.published||receipt.scheduled)throw Error('Expected a local animation render receipt');
  const video=await privateMotionFile(receipt.path,'.mp4');
  if(await hashFile(video)!==receipt.sha256)throw Error('Rendered video bytes differ from the receipt');
  return {receiptFile:actual,video,sha256:receipt.sha256,seconds:receipt.seconds,
    animation:receipt.animation,voiceApproved:receipt.voice?.listeningVerified===true,
    audioStreamCopied:receipt.audioStreamCopied,musicAdded:receipt.musicAdded,
    visualPlaybackVerified:receipt.visualPlaybackVerified,publicationReady:receipt.publicationReady,
    published:false,scheduled:false};
}
export async function motionQuality(file){
  const receipt=await inspectMotionReceipt(file),pins=JSON.parse(await fs.readFile(path.join(root,'config/video-toolkits.json'),'utf8'));
  const toolkit=path.join(root,pins.sources.digitalsamba.checkout),tools=path.join(toolkit,'tools');
  for(const [name,hash]of Object.entries(pins.sources.digitalsamba.pythonFiles))if(await hashFile(path.join(tools,name))!==hash)throw Error('Pinned quality source changed: '+name);
  const editing=await loadEditingRuntime(path.join(root,'state/footage-toolchain/runtime.json'));
  if(await hashFile(editing.ffprobe)!==pins.ffprobeSha256)throw Error('Pinned ffprobe changed');
  // Use the existing local Python with NumPy. No environment setup or package install occurs here.
  const python=process.env.SAKURA_QC_PYTHON??path.join(process.env.USERPROFILE??'','.codex/data/tiktok-autoposting/voice/vieneu/runtime/Scripts/python.exe');
  const result=await run(python,['-X','utf8','-B',path.join(root,'scripts/video-quality.py'),tools,receipt.video],
    {windowsHide:true,timeout:180000,maxBuffer:2*1024*1024,env:{...process.env,PYTHONPATH:'',PYTHONDONTWRITEBYTECODE:'1',PATH:path.dirname(editing.ffmpeg)+path.delimiter+process.env.PATH}});
  const report=JSON.parse(result.stdout);
  if(await hashFile(receipt.video)!==receipt.sha256)throw Error('Video changed during measurement');
  if(!report.video||!report.loudness||!report.data?.frames?.sampled)throw Error('Quality measurement incomplete');
  return {...report,mediaInfo:report.video,video:receipt.video,sha256:receipt.sha256,source:pins.sources.digitalsamba,
    measuredAt:new Date().toISOString(),readOnly:true,normalizationApplied:false,
    limits:'Sampled visual/loudness diagnostics do not establish creative quality, audible pronunciation, music rights or platform readiness.'};
}
export async function renderMotionPlan(file){
  const plan=await privateMotionFile(file);
  const result=await run(process.execPath,[path.join(root,'scripts/render-photo-story.mjs'),plan],
    {windowsHide:true,timeout:15*60*1000,maxBuffer:2*1024*1024});
  const line=result.stdout.trim().split(/\r?\n/u).at(-1);
  return JSON.parse(line);
}
