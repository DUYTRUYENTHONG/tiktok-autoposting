import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import path from 'node:path';
import {hashFile} from './store.mjs';
import {verifySubtitleReceipt} from './video-subtitles.mjs';
import {assertConsumerOverlay} from './consumer-overlays.mjs';

const run=promisify(execFile),sha=/^[a-f0-9]{64}$/u;
export function compileStoryEdit(plan,{intentId,voice,scenes,timing,productSha256}){
  if(plan?.version!==1||plan.intentId!==intentId||plan.voiceSha256!==voice.sha256||plan.scriptSha256!==voice.scriptSha256||plan.productSha256!==productSha256||!sha.test(plan.timingReceiptSha256??'')||plan.fps!==30)throw Error('Story plan media identity mismatch');
  if(!Number.isInteger(plan.durationFrames)||plan.durationFrames<600||plan.durationFrames>750||plan.durationFrames/30<voice.qa.durationSeconds+.25)throw Error('Story duration must preserve the complete approved narration');
  if(!Array.isArray(plan.shots)||plan.shots.length<3||plan.shots.length>18||!Array.isArray(timing.cues))throw Error('A bounded source-led shot plan and real caption cues are required');
  const lookup=new Map(scenes.map(s=>[s.id,s]));let end=0;
  const shots=plan.shots.map((shot,index)=>{
    if(shot.startFrame!==end||!Number.isInteger(shot.endFrame)||shot.endFrame<=end||shot.endFrame>plan.durationFrames||typeof shot.reason!=='string'||!shot.reason.trim())throw Error('Story shots must be continuous, frame-bound and purposeful');
    const seconds=(shot.endFrame-shot.startFrame)/30;if(seconds<.5||seconds>4)throw Error('Review an extended/very short shot explicitly instead of silently freezing it');
    if(index&&(!Number.isInteger(shot.boundaryCue)||!Number.isFinite(timing.cues[shot.boundaryCue]?.start)||Math.abs(shot.startFrame-timing.cues[shot.boundaryCue].start*30)>1.1))throw Error('Shot boundary must use an actual phrase anchor');
    if(!['footage','product'].includes(shot.kind))throw Error('Unknown story shot kind');
    if(shot.kind==='footage'){
      const scene=lookup.get(shot.sourceId);if(!scene||shot.sourceSha256!==scene.sha256||!Number.isFinite(shot.sourceStart)||shot.sourceStart<scene.start-.0001||shot.sourceStart+seconds>scene.start+scene.duration+.0001)throw Error('Shot exceeds its visually reviewed source interval');
      if(shot.layout!==undefined&&!['full_scene','portrait_reviewed','region_reviewed'].includes(shot.layout))throw Error('Unknown footage framing');
      if(['portrait_reviewed','region_reviewed'].includes(shot.layout)&&(scene.requiredContextFraming==='fit_blur'||!path.isAbsolute(shot.framingEvidence?.path??'')||!sha.test(shot.framingEvidence?.sha256??'')))throw Error('A portrait crop needs actual framing evidence and a compatible source');
      if(shot.layout==='portrait_reviewed'&&(!Number.isFinite(shot.cropCenterX)||shot.cropCenterX<0||shot.cropCenterX>1))throw Error('Invalid portrait center');
      if(shot.layout==='region_reviewed'&&(!Array.isArray(shot.cropBox)||shot.cropBox.length!==4||shot.cropBox.some(x=>!Number.isFinite(x))||shot.cropBox[0]<0||shot.cropBox[1]<0||shot.cropBox[2]<=0||shot.cropBox[3]<=0||shot.cropBox[0]+shot.cropBox[2]>1||shot.cropBox[1]+shot.cropBox[3]>1))throw Error('Invalid reviewed source region');
    }else{
      const box=shot.crop;if(!Array.isArray(box)||box.length!==4||box.some(x=>!Number.isFinite(x))||box[0]<0||box[1]<0||box[2]<=0||box[3]<=0||box[0]+box[2]>1||box[1]+box[3]>1)throw Error('Product crop must remain inside the authentic reference');
      if(seconds>3)throw Error('Product identity shot is too long for this short-story mode');
    }
    for(const key of ['graphic','label'])if(shot[key]!==undefined){if(typeof shot[key]!=='string'||shot[key].length>100||/[{}\\]/u.test(shot[key]))throw Error('Use bounded plain overlay text');assertConsumerOverlay(shot[key]);}
    if(shot.captionBottomY!==undefined&&(!Number.isInteger(shot.captionBottomY)||shot.captionBottomY<1120||shot.captionBottomY>1540))throw Error('Caption placement outside the reviewed phone-safe area');
    end=shot.endFrame;return {...shot,seconds,index};
  });
  if(end!==plan.durationFrames||shots[0].kind!=='footage')throw Error('Start on meaningful moving footage and cover the full timeline');
  return {shots,seconds:plan.durationFrames/30,fps:30,productSeconds:shots.filter(s=>s.kind==='product').reduce((n,s)=>n+s.seconds,0)};
}

export function positionStoryCaptions(ass,cues,plan){
  let index=0;const placements=[];
  const output=ass.replace(/^Dialogue:.*$/gmu,line=>{
    const cue=cues[index];if(!cue)throw Error('Caption/phrase count differs');if(!Number.isFinite(cue.start)||!Number.isFinite(cue.end)||cue.end<=cue.start)throw Error('Invalid caption interval');if(!line.includes('\\pos(540,1620)'))throw Error('Unexpected source caption placement');const middle=(cue.start+cue.end)/2,shot=plan.shots.find(s=>middle*plan.fps>=s.startFrame&&middle*plan.fps<s.endFrame);if(!shot)throw Error('Caption has no planned visual');
    const bottomY=shot.captionBottomY??1510;if(!Number.isInteger(bottomY)||bottomY<1120||bottomY>1540)throw Error('Unsafe phrase-caption placement');placements.push({cue:index++,bottomY,shotStartFrame:shot.startFrame});return line.replace('\\pos(540,1620)',`\\pos(540,${bottomY})`);
  });
  if(index!==cues.length)throw Error('Caption/phrase count differs');return {ass:output,placements};
}

export async function renderStoryEdit({plan,voice,scenes,productImage,directory,editing,baselineAudioVideo,baselineAudioVideoSha256}){
  const timing=JSON.parse(await readFile(plan.timingReceiptFile,'utf8'));
  if(await hashFile(plan.timingReceiptFile)!==plan.timingReceiptSha256||await hashFile(productImage)!==plan.productSha256||await hashFile(baselineAudioVideo)!==baselineAudioVideoSha256)throw Error('Story source bytes changed');
  await verifySubtitleReceipt(timing,{queueId:plan.intentId,audioPath:voice.path,audioSha256:voice.sha256,script:voice.script,scriptFile:voice.scriptFile,scriptSha256:voice.scriptSha256});
  const alignment=JSON.parse(await readFile(timing.alignmentFile,'utf8')),compiled=compileStoryEdit(plan,{intentId:plan.intentId,voice,scenes,timing:alignment,productSha256:plan.productSha256});
  await mkdir(directory,{recursive:true});await copyFile('C:/Windows/Fonts/arial.ttf',path.join(directory,'Arial.ttf'));await copyFile('C:/Windows/Fonts/arialbd.ttf',path.join(directory,'Arial-Bold.ttf'));
  const inputs=[];
  for(const shot of compiled.shots){
    const scene=shot.kind==='footage'?scenes.find(s=>s.id===shot.sourceId):null,source=scene?.source??productImage;
    if(scene&&await hashFile(source)!==shot.sourceSha256)throw Error('Story footage changed');
    if(shot.framingEvidence&&await hashFile(shot.framingEvidence.path)!==shot.framingEvidence.sha256)throw Error('Framing review bytes changed');
    const stem=`story-shot-${shot.index}`,target=path.join(directory,stem+'.mp4');
    await writeFile(path.join(directory,stem+'-graphic.txt'),shot.graphic??'');await writeFile(path.join(directory,stem+'-label.txt'),shot.label??'');
    const portrait=scene&&shot.layout==='portrait_reviewed',overlay=[`drawtext=fontfile=Arial.ttf:textfile=${stem}-label.txt:expansion=none:fontsize=30:fontcolor=white:x=80:y=${portrait?100:145}:box=1:boxcolor=0x1b1522@0.75:boxborderw=10`,...(shot.graphic?[`drawtext=fontfile=Arial-Bold.ttf:textfile=${stem}-graphic.txt:expansion=none:fontsize=62:fontcolor=white:x=80:y=${portrait?180:235}:line_spacing=14:box=1:boxcolor=0x392343@0.82:boxborderw=16`]:[])];
    let graph;
    if(portrait){
      graph=`[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920:x='max(0,min(iw-1080,iw*${shot.cropCenterX}-540))':y=(ih-1920)/2,setsar=1,fps=30,${overlay.join(',')}[out]`;
    }else if(scene){
      const region=shot.layout==='region_reviewed'?`crop=iw*${shot.cropBox[2]}:ih*${shot.cropBox[3]}:iw*${shot.cropBox[0]}:ih*${shot.cropBox[1]},`:'';
      graph=`[0:v]${region}split=2[bg][fg];[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=30:2,eq=brightness=-0.24:saturation=0.6[ambient];[fg]scale=1000:1180:force_original_aspect_ratio=decrease[front];[ambient][front]overlay=(W-w)/2:(H-h)/2-70,setsar=1,fps=30,zoompan=z='1+0.00016*on':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s=1080x1920:fps=30,${overlay.join(',')}[out]`;
    }else{
      const [x,y,w,h]=shot.crop;graph=`[0:v]crop=iw*${w}:ih*${h}:iw*${x}:ih*${y},scale=900:1400:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:'max(180,(oh-ih)/2-100)':color=0x15131c,setsar=1,fps=30,zoompan=z='1+0.0003*on':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s=1080x1920:fps=30,${overlay.join(',')}[out]`;
    }
    await writeFile(path.join(directory,stem+'-filter.txt'),graph);
    await run(editing.ffmpeg,['-hide_banner','-loglevel','error','-y',...(scene?['-ss',String(shot.sourceStart)]:['-loop','1']),'-i',source,'-an','-filter_complex_threads','1','-filter_complex',graph,'-map','[out]','-frames:v',String(shot.endFrame-shot.startFrame),'-c:v','libx264','-preset','veryfast','-crf','20','-threads','2','-pix_fmt','yuv420p',target],{cwd:directory,timeout:120000,maxBuffer:1024*1024,windowsHide:true});inputs.push(target);
  }
  const graph=inputs.map((_,i)=>`[${i}:v]settb=AVTB,setpts=PTS-STARTPTS[v${i}]`).concat(inputs.map((_,i)=>`[v${i}]`).join('')+`concat=n=${inputs.length}:v=1:a=0[out]`).join(';'),video=path.join(directory,'story-edit.mp4');
  await run(editing.ffmpeg,['-hide_banner','-loglevel','error','-y',...inputs.flatMap(p=>['-i',p]),'-i',baselineAudioVideo,'-filter_complex_threads','1','-filter_complex',graph,'-map','[out]','-map',`${inputs.length}:a:0`,'-t',String(compiled.seconds),'-c:v','libx264','-preset','veryfast','-crf','20','-threads','2','-pix_fmt','yuv420p','-c:a','copy','-movflags','+faststart',video],{timeout:180000,maxBuffer:1024*1024,windowsHide:true});
  const probe=JSON.parse((await run(editing.ffprobe,['-v','error','-show_streams','-show_format','-of','json',video],{windowsHide:true})).stdout),v=probe.streams.find(s=>s.codec_type==='video'),a=probe.streams.find(s=>s.codec_type==='audio');
  if(v?.width!==1080||v.height!==1920||v.codec_name!=='h264'||a?.codec_name!=='aac'||Math.abs(Number(probe.format.duration)-compiled.seconds)>.1)throw Error('Story edit output mismatch');
  const packetHashes=async file=>JSON.parse((await run(editing.ffprobe,['-v','error','-select_streams','a:0','-show_packets','-show_data_hash','sha256','-show_entries','packet=data_hash','-of','json',file],{windowsHide:true,maxBuffer:4*1024*1024})).stdout).packets.map(p=>p.data_hash);
  const before=await packetHashes(baselineAudioVideo),after=await packetHashes(video);if(!after.length||after.some((h,i)=>h!==before[i]))throw Error('Narration AAC packets changed during visual-only edit');
  return {path:video,sha256:await hashFile(video),seconds:compiled.seconds,storyEdit:{shotCount:compiled.shots.length,productIdentitySeconds:compiled.productSeconds,plan,audioPacketsCopiedUnchanged:true,audioPacketCount:after.length,baselineAudioVideo,baselineAudioVideoSha256,phraseAnchored:true,wordPerfectTiming:false,fullPlaybackVerified:false}};
}
