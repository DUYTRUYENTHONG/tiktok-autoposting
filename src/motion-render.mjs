import fs from 'node:fs/promises';
import path from 'node:path';
import {execFile,spawn} from 'node:child_process';
import {promisify} from 'node:util';
import {createRequire} from 'node:module';
import {root,hashFile} from './store.mjs';
import {springEase,motionProvenance} from './motion-curves.mjs';
import {installMotionCanvas} from './motion-canvas.mjs';
import {validateMotionCopy} from './motion-plan.mjs';
const run=promisify(execFile);

export function motionSceneModel(plan,boundaries,cues){
  validateMotionCopy(plan);
  if(boundaries.length!==6||boundaries[0]!==0||boundaries.some((f,i)=>!Number.isInteger(f)||(i&&f<=boundaries[i-1])))throw Error('A complete frame-bound story timeline is required');
  if(boundaries.at(-1)<600||boundaries.at(-1)>750||boundaries.some((f,i)=>i&&f-boundaries[i-1]<24))throw Error('Use readable20–25second story beats');
  if(!Array.isArray(cues)||!cues.length||cues.some((c,i)=>typeof c.text!=='string'||!Number.isFinite(c.start)||!Number.isFinite(c.end)||c.start<0||c.end<=c.start||c.end>boundaries.at(-1)/30||(i&&c.start<cues[i-1].end)))throw Error('Use ordered actual phrase cues within the export');
  if(plan.burnCaptions!==undefined && typeof plan.burnCaptions!=='boolean')throw Error('burnCaptions must be a boolean');
  return {fps:30,durationFrames:boundaries.at(-1),background:'#f3f0e8',ink:'#193344',accent:plan.accent.replace('0x','#'),contextHeader:plan.contextHeader,cues,burnCaptions:plan.burnCaptions!==false,
    scenes:[
      {type:'media',assetId:'context-0',context:true,heading:plan.hook,transitionSeconds:0},
      {type:'media',assetId:'context-1',context:true,heading:plan.bodyHeading,detail:plan.bodyDetail,transitionSeconds:.16},
      {type:'product',heading:'CHỌN THEO NHU CẦU',detail:'Hỏi rõ trước khi mua.',transitionSeconds:.2},
      {type:'questions',heading:'HỎI CHO RÕ',detail:'rồi hãy chọn.',questions:plan.questions,transitionSeconds:.2},
      {type:'cta',heading:'CẦN TƯ VẤN?',transitionSeconds:.18},
    ].map((scene,i)=>({...scene,start:boundaries[i]/30,end:boundaries[i+1]/30}))};
}

export async function renderMotionVideo({plan,boundaries,cues,baseline,editing,directory}){
  const model=motionSceneModel(plan,boundaries,cues),assets=[],prepared=[];
  for(const [i,source]of plan.photos.entries()){
    const [x,y,w,h]=source.crop,kind=source.kind??'image',file=path.join(directory,`asset-${i}.${kind==='video'?'mp4':'jpg'}`),filter=`crop=iw*${w}:ih*${h}:iw*${x}:ih*${y},scale=1080:1040:force_original_aspect_ratio=increase,crop=1080:1040,setsar=1`;
    const args=['-hide_banner','-loglevel','error','-y',...(kind==='video'?['-ss',String(source.sourceStart)]:[]),'-i',source.source,'-vf',filter,...(kind==='video'?['-t',String(model.scenes[i].end-model.scenes[i].start+.2),'-an','-c:v','libx264','-preset','veryfast','-crf','18','-threads','2','-pix_fmt','yuv420p']:['-frames:v','1','-q:v','2']),file];
    await run(editing.ffmpeg,args,{windowsHide:true,timeout:90000});const bytes=await fs.readFile(file);assets.push({id:'context-'+i,kind,data:`data:${kind==='video'?'video/mp4':'image/jpeg'};base64,${bytes.toString('base64')}`});prepared.push({id:'context-'+i,kind,path:file,sha256:await hashFile(file),source:source.source,sourceSha256:source.sha256,crop:source.crop,filter});
  }
  const product=path.join(directory,'product-reference-crop.jpg');await run(editing.ffmpeg,['-hide_banner','-loglevel','error','-y','-i',plan.productImage,'-vf','crop=iw*.30:ih*.64:iw*.38:ih*.28,scale=900:1400:force_original_aspect_ratio=decrease','-frames:v','1','-q:v','2',product],{windowsHide:true,timeout:20000});
  assets.push({id:'product',kind:'image',data:'data:image/jpeg;base64,'+(await fs.readFile(product)).toString('base64')});prepared.push({id:'product',path:product,sha256:await hashFile(product),source:plan.productImage,sourceSha256:await hashFile(plan.productImage),crop:[.38,.28,.30,.64]});
  const payload={...model,assets},canvasSource=path.join(directory,'motion-canvas-source.mjs'),curveSource=path.join(directory,'motion-curves-source.mjs');await fs.copyFile(path.join(root,'src/motion-canvas.mjs'),canvasSource);await fs.copyFile(path.join(root,'src/motion-curves.mjs'),curveSource);
  await fs.writeFile(path.join(directory,'scene-plan.json'),JSON.stringify({...model,assets:prepared},null,2));
  const springScript=`window.sakuraSpring=${springEase.toString()};`,canvasScript=`(${installMotionCanvas.toString()})();`,serialized=JSON.stringify(payload).replaceAll('<','\\u003c'),license=await fs.readFile(path.join(root,'third-party/animate-MIT.txt'),'utf8');
  const html=`<!doctype html><html lang="vi"><meta charset="utf-8"><title>Sakura — xem bản dựng</title><style>body{margin:0;background:#253440;color:white;font:16px Arial;display:grid;justify-items:center}canvas{height:90vh;max-width:100vw}button{margin:8px;padding:10px 20px}</style><button id="play">Phát bản xem trước</button><canvas></canvas><script>/* ${license} */\n${springScript}\n${canvasScript}\nconst payload=${serialized};motionInitialize(payload).then(()=>motionFrame(0));document.querySelector('#play').onclick=()=>{const start=performance.now();const step=async()=>{const frame=Math.floor((performance.now()-start)/1000*payload.fps);if(frame<payload.durationFrames){await motionFrame(frame);requestAnimationFrame(step);}};requestAnimationFrame(step);};</script></html>`;
  await fs.writeFile(path.join(directory,'index.html'),html);
  const require=createRequire(path.join(root,'package.json')),{chromium}=require('playwright'),browser=await chromium.launch({headless:true});let encoder,encoderError,stderr='',completed;
  const video=path.join(directory,plan.outputName),fps=30,duration=model.durationFrames/fps,args=['-hide_banner','-loglevel','error','-y','-f','image2pipe','-vcodec','mjpeg','-framerate',String(fps),'-i','pipe:0','-i',baseline.path,'-map','0:v:0','-map','1:a:0','-t',String(duration),'-c:v','libx264','-preset','veryfast','-crf','20','-threads','2','-pix_fmt','yuv420p','-c:a','copy','-movflags','+faststart',video];
  let audit;
  try{
    const page=await browser.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});await page.route('**/*',route=>route.abort());await page.setContent('<meta charset="utf-8"><canvas></canvas>');await page.addScriptTag({content:springScript+'\n'+canvasScript});await page.evaluate(data=>window.motionInitialize(data),payload);
    encoder=spawn(editing.ffmpeg,args,{windowsHide:true,stdio:['pipe','ignore','pipe']});encoder.stderr.on('data',b=>{if(stderr.length<1000000)stderr+=b.toString();});encoder.stdin.on('error',e=>{encoderError=e;});completed=new Promise(resolve=>{encoder.on('error',e=>{encoderError=e;resolve(-1);});encoder.on('exit',code=>resolve(code));});
    const snapshots=new Set([0,30,90,180,...boundaries.slice(1,-1).map(f=>f+12),model.durationFrames-30]);
    for(let frame=0;frame<model.durationFrames;frame++){
      if(encoderError)throw encoderError;const encoded=await page.evaluate(f=>window.motionFrame(f),frame),bytes=Buffer.from(encoded,'base64');await new Promise((resolve,reject)=>encoder.stdin.write(bytes,e=>e?reject(e):resolve()));if(snapshots.has(frame))await fs.writeFile(path.join(directory,`frame-${frame}.jpg`),bytes);
      if(frame%150===0)console.log(JSON.stringify({renderedFrames:frame,totalFrames:model.durationFrames}));
    }
    encoder.stdin.end();if(await completed!==0)throw Error('Frame encoder failed: '+stderr);audit=await page.evaluate(()=>window.motionAudit());if(audit.textOverflowCount)throw Error('Canvas text crosses the reviewed safe area: '+JSON.stringify(audit.textOverflow.slice(0,3)));
  }catch(e){if(encoder&&!encoder.killed)encoder.kill();throw e;}finally{await browser.close();}
  const probe=JSON.parse((await run(editing.ffprobe,['-v','error','-show_streams','-show_format','-of','json',video],{windowsHide:true})).stdout),v=probe.streams.find(s=>s.codec_type==='video'),a=probe.streams.find(s=>s.codec_type==='audio');if(v?.width!==1080||v.height!==1920||v.codec_name!=='h264'||a?.codec_name!=='aac'||Math.abs(Number(probe.format.duration)-duration)>.1)throw Error('JavaScript render format mismatch');
  const packets=async file=>JSON.parse((await run(editing.ffprobe,['-v','error','-select_streams','a:0','-show_packets','-show_data_hash','sha256','-show_entries','packet=data_hash','-of','json',file],{windowsHide:true,maxBuffer:4*1024*1024})).stdout).packets.map(p=>p.data_hash),before=await packets(baseline.path),after=await packets(video);if(!after.length||after.some((h,i)=>h!==before[i]))throw Error('Visual export changed narration audio packets');
  await fs.writeFile(path.join(directory,'motion-audit.json'),JSON.stringify(audit,null,2));
  return {path:video,sha256:await hashFile(video),seconds:duration,animation:{engine:'Sakura JavaScript Canvas',motionProvenance,rendererSource:{path:canvasSource,sha256:await hashFile(canvasSource)},curveSource:{path:curveSource,sha256:await hashFile(curveSource)},scenePlanFile:path.join(directory,'scene-plan.json'),scenePlanSha256:await hashFile(path.join(directory,'scene-plan.json')),editablePreview:path.join(directory,'index.html'),audit,assets:prepared,networkRequestsAllowed:false,AIProviderCalls:0,voiceRetimed:false},audioStreamCopied:true};
}
