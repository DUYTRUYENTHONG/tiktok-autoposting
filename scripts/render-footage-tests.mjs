import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdir,readFile,writeFile,copyFile} from 'node:fs/promises';
import path from 'node:path';
import {loadState,updateState,root,hashFile} from '../src/store.mjs';
import {voiceBrief,renderVoice,voiceHome,captionWithVoiceCredit} from '../src/voice.mjs';
import {createFootageEdl,verifyFootageInputs,loadEditingRuntime,wrapVideoText,transitionGraph,bindProductReference} from '../src/footage-video.mjs';
import {loadIndex,createKnowledgePipeline} from '../src/knowledge/index.mjs';
import {createHybridRetriever} from '../src/knowledge/embeddings.mjs';
const run=promisify(execFile),ids=process.argv.slice(2);
if(!ids.length||ids.length>10||ids.some(id=>!/^sakura-10[1-9]$|^sakura-110$/.test(id)))throw Error('Provide the authorized test IDs101–110');
const runtime=await loadEditingRuntime(path.join(root,'state','footage-toolchain','runtime.json'));
const review=JSON.parse(await readFile(path.join(root,'state','footage-visual-review.json'),'utf8'));
const index=await loadIndex(),hybrid=await createHybridRetriever(index,'e5');
let rag;
try{rag=await createKnowledgePipeline(index,{retriever:request=>hybrid.retrieve(request)}).invoke({query:'Ưu đãi Sakura TikTok hiện tại và chính sách video footage, giọng nữ miền Nam?',productId:'sakura-cleaner-500ml',promotionKey:'buy1-get1-tiktok-first50'});}finally{await hybrid.dispose();}
const product=path.join('C:/Users/CROSSIAN/Downloads/nước tẩy đa năng sakura','Sakura_10_Carousel_50_Anh','Sakura_10_Carousel','Anh_tham_chieu','Sakura_nuoc_lau_500ml.jpg');
const productHash=await hashFile(product),out=path.join(voiceHome,'footage-videos');await mkdir(out,{recursive:true});
for(const id of ids){
  const state=await loadState(),q=state.queue.find(q=>q.id===id);
  if(!state.campaign.voiceTest.voiceProfileApproval)throw Error('Accepted voice profile is required');
  const audio=await renderVoice(state,id,voiceBrief(state,id).script);
  const edl=bindProductReference(createFootageEdl(q,review,audio,rag),{path:product,sha256:productHash,role:'user_supplied_product_reference'});await verifyFootageInputs(edl);
  const folder=path.join(out,`${id}-${edl.revision}`);await mkdir(folder,{recursive:true});
  try{const prior=JSON.parse(await readFile(path.join(folder,'receipt.json'),'utf8'));if(prior.edl.revision!==edl.revision||await hashFile(prior.path)!==prior.sha256)throw Error('Existing video receipt mismatch; preserve and inspect before retry');console.log(JSON.stringify({queueId:id,path:prior.path,status:prior.status,cached:true}));continue;}catch(e){if(e.code!=='ENOENT')throw e;}
  await copyFile('C:/Windows/Fonts/arial.ttf',path.join(folder,'font.ttf'));
  await copyFile('C:/Windows/Fonts/arialbd.ttf',path.join(folder,'font-bold.ttf'));
  await writeFile(path.join(folder,'edl.json'),JSON.stringify(edl,null,2));
  await writeFile(path.join(folder,'grounding.json'),JSON.stringify(rag,null,2));
  const segments=[];
  for(const [i,scene] of edl.scenes.entries()){
    const framed=scene.height>scene.width?'scale=1080:1440:force_original_aspect_ratio=decrease,pad=1080:1440:(ow-iw)/2:(oh-ih)/2:color=0xf8f2ed':`scale=1080:1440:force_original_aspect_ratio=increase,crop=1080:1440:x='max(0,min(iw-1080,iw*${scene.cropCenterX}-540))':y=(ih-1440)/2`;
    const file=path.join(folder,`cut-${i}.mp4`);
    await run(runtime.ffmpeg,['-hide_banner','-loglevel','error','-y','-ss',String(scene.start),'-i',scene.source,'-t','3','-an','-vf',`${framed},pad=1080:1920:0:240:color=0xf8f2ed,setsar=1,fps=30`,'-c:v','libx264','-preset','veryfast','-crf','21','-threads','4','-pix_fmt','yuv420p',file],{timeout:120000,windowsHide:true});segments.push(file);
  }
  const packshot=path.join(folder,'packshot.mp4');
  await run(runtime.ffmpeg,['-hide_banner','-loglevel','error','-y','-loop','1','-i',product,'-t',String(edl.packshotSeconds),'-an','-vf','scale=1000:1280:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:320:color=0xf8f2ed,setsar=1,fps=30','-c:v','libx264','-preset','veryfast','-crf','20','-threads','4','-pix_fmt','yuv420p',packshot],{timeout:120000,windowsHide:true});segments.push(packshot);
  await writeFile(path.join(folder,'concat.txt'),segments.map(file=>`file '${file.replaceAll('\\','/').replaceAll("'","'\\''")}'`).join('\n'));
  const texts={offer:'MUA 1 TẶNG 1',condition:'50 ĐƠN ĐẦU TIÊN TỪ TIKTOK',hook:wrapVideoText(edl.headline),hookDetail:wrapVideoText(edl.hookDetail),takeaway:wrapVideoText(edl.takeaway),stock:'Cảnh minh họa · Không phải thử nghiệm Sakura',cta:`Nhắn ${q.leadCode} + ảnh bề mặt`,close:'Sakura500ml · Hỏi giá và độ phù hợp'};
  for(const [name,text] of Object.entries(texts))await writeFile(path.join(folder,name+'.txt'),text,'utf8');
  const text=(name,size,y,enable,bold=false,color='0x392343')=>`drawtext=fontfile=${bold?'font-bold.ttf':'font.ttf'}:textfile=${name}.txt:expansion=none:fontsize=${size}:fontcolor=${color}:x=(w-tw)/2:y=${y}:line_spacing=12${enable?`:enable='${enable}'`:''}`;
  const filters=[text('offer',86,42,null,true),text('condition',44,151,null,true),text('cta',38,214,null,true),"drawbox=x=45:y=267:w=990:h=230:color=0x392343@0.88:t=fill:enable='lt(t,14)'",text('hook',58,295,'lt(t,4)',true,'white'),text('hookDetail',58,295,'gte(t,4)*lt(t,8)',true,'white'),text('takeaway',55,295,'gte(t,8)*lt(t,14)',true,'white'),"drawbox=x=45:y=512:w=990:h=65:color=0xf8f2ed@0.94:t=fill:enable='lt(t,14)'",text('stock',30,532,'lt(t,14)'),text('close',36,1340,'gte(t,14)',true)];
  await writeFile(path.join(folder,'filters.txt'),filters.join(','));
  const video=path.join(folder,`${id}-footage.mp4`);
  const transition=transitionGraph(segments.length),graph=[...transition.filters,`[${transition.output}]${filters.join(',')}[outv]`].join(';');
  await writeFile(path.join(folder,'transition-filter.txt'),graph);
  await run(runtime.ffmpeg,['-hide_banner','-loglevel','error','-y',...segments.flatMap(file=>['-i',file]),'-i',audio.path,'-filter_complex_threads','1','-filter_complex',graph,'-map','[outv]','-map',`${segments.length}:a:0`,'-c:v','libx264','-preset','veryfast','-crf','20','-threads','4','-pix_fmt','yuv420p','-af','apad','-t',String(edl.seconds),'-c:a','aac','-b:a','192k','-movflags','+faststart',video],{cwd:folder,timeout:180000,maxBuffer:1024*1024,windowsHide:true});
  const {stdout}=await run(runtime.ffprobe,['-v','error','-show_streams','-show_format','-of','json',video],{windowsHide:true,timeout:15000});
  const probe=JSON.parse(stdout),v=probe.streams.find(s=>s.codec_type==='video'),a=probe.streams.find(s=>s.codec_type==='audio');
  if(v?.width!==1080||v.height!==1920||v.codec_name!=='h264'||a?.codec_name!=='aac'||Math.abs(Number(probe.format.duration)-edl.seconds)>0.2)throw Error('Edited video technical QA failed');
  const caption=captionWithVoiceCredit(q.caption,'vieneu');
  const voiceRevisionRequired=q.status==='needs_voice_revision'||q.voiceRevisionRequired===true;
  const receipt={queueId:id,path:video,sha256:await hashFile(video),voice:audio,edl,caption,seconds:edl.seconds,status:voiceRevisionRequired?'needs_voice_revision':'needs_visual_playback_and_music',musicAdded:false,listeningVerified:audio.listeningVerified===true,voiceProfileAccepted:true,voiceRevisionRequired,published:false,createdAt:new Date().toISOString()};
  const receiptFile=path.join(folder,'receipt.json');await writeFile(receiptFile,JSON.stringify(receipt,null,2));
  await updateState(s=>{const item=s.queue.find(q=>q.id===id);if(item.receipt||['submitting','needs_review'].includes(item.status))throw Error('Submission state changed while editing');item.voicePreviewHistory??=[];if(item.voicePreview)item.voicePreviewHistory.push(item.voicePreview);item.voicePreview={path:video,sha256:receipt.sha256,receiptFile,status:receipt.status,provider:'vieneu',voice:audio.voice,speed:audio.speed,creativeFormat:edl.variant};item.caption=caption;item.status=voiceRevisionRequired?'needs_voice_revision':'needs_video_review';item.voiceRevisionRequired=voiceRevisionRequired;item.variantId=edl.variant;item.assetsVerified=false;s.campaign.voiceTest.status=voiceRevisionRequired?'revising_emphasis':'footage_previews_in_progress';return s;});
  console.log(JSON.stringify({queueId:id,path:video,seconds:edl.seconds,footage:edl.scenes.map(s=>s.id),status:receipt.status}));
}
