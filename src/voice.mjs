import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readFile,writeFile,mkdir,open,unlink,rename} from 'node:fs/promises';
import {homedir} from 'node:os';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {hashFile} from './store.mjs';
import {inspectWav} from './wav.mjs';
import {painVoiceCopy} from './voice-copy.mjs';
import {first50Promotion} from './promotion.mjs';

const run=promisify(execFile);
export const voiceHome=process.env.TIKTOK_VOICE_HOME??path.join(homedir(),'.codex','data','tiktok-autoposting','voice');
export function voiceBrief(state,queueId){
  if(!/^sakura-\d{3}$/.test(queueId))throw Error('Invalid queueId');
  const q=state.queue?.find(x=>x.id===queueId);
  if(!q)throw Error('Unknown queueId');
  if(q.productId!=='sakura-cleaner-500ml'||q.account!=='saigomlia')throw Error('Voice brief requires the configured Sakura product/account');
  const paragraphs=q.caption.split(/\n\s*\n/);
  const hook=paragraphs[0].replace(/^Một góc nhìn khác:\s*/,''),story=(paragraphs[1]??'').match(/^[^.!?]+[.!?]?/)?.[0]??'';
  if(!q.leadCode||!story||q.promotionKey==='buy3-get1')throw Error('A current story, lead code and offer are required');
  const digits=['không','một','hai','ba','bốn','năm','sáu','bảy','tám','chín'];
  const spokenLeadCode=q.leadCode.replace(/(\d)/g,(_,digit)=>' '+digits[Number(digit)]).toLocaleLowerCase('vi');
  const promotion=q.promotionKey===first50Promotion.key?first50Promotion:null;
  const tailored=painVoiceCopy(q.angleId,spokenLeadCode,promotion);
  const script=tailored?.script??`${promotion?.voiceHook??''} ${hook} ${story} Muốn hỏi về Sa cu ra? Nhắn mã ${spokenLeadCode} kèm vật liệu cần lau. ${promotion?'':'Mua một, tặng một, chỉ khi mua qua Tích Tóc. '}Dùng theo nhãn.`.trim();
  return {queueId:q.id,productId:q.productId,angleId:q.angleId,leadCode:q.leadCode,spokenLeadCode,language:'vi-VN',script,
    performance:'Conversational synthetic narration; no impersonation, testimonial or invented outcome.',
    targetSeconds:'20–35; verify actual duration after synthesis',
    copyRevision:promotion?'promo-first50-v3':tailored?'painpoint-v2':'brief-v1',status:'script_draft',attachment:'WAV preview only. Browser photo composer has not been verified to accept custom narration; no upload or format conversion occurs.'};
}
export async function voiceRuntime(home=voiceHome){
  const config=JSON.parse((await readFile(path.join(home,'runtime.json'),'utf8')).replace(/^\uFEFF/,''));
  if(config.provider==='vieneu'){
    if(config.language!=='vi-VN'||config.version!=='3.8.3'||![config.python,config.modelManifest,config.hfCache,config.ffmpeg].every(p=>typeof p==='string'&&path.isAbsolute(p)))throw Error('Invalid local VieNeu runtime');
    voiceProfile(config);
    if(await hashFile(config.modelManifest)!==config.modelSha256)throw Error('VieNeu asset manifest checksum mismatch');
    const manifest=JSON.parse(await readFile(config.modelManifest,'utf8'));
    if(!manifest.files?.length)throw Error('VieNeu assets are missing');
    for(const asset of manifest.files){
      if(!path.isAbsolute(asset.path)||!/^[a-f0-9]{64}$/.test(asset.sha256)||await hashFile(asset.path)!==asset.sha256)throw Error('VieNeu asset checksum mismatch');
    }
    return {...config,configFile:path.join(home,'runtime.json')};
  }
  if(config.provider==='windows-sapi'){
    if(config.language!=='vi-VN'||typeof config.powershell!=='string'||!path.isAbsolute(config.powershell))throw Error('Invalid Windows voice runtime');
    const helper=fileURLToPath(new URL('../scripts/voice-render.ps1',import.meta.url));
    const {stdout}=await run(config.powershell,['-NoProfile','-NonInteractive','-File',helper,'-ListVoices'],{timeout:15000,windowsHide:true});
    if(!JSON.parse(stdout.trim()).includes(config.voice))throw Error('Configured Vietnamese voice is unavailable');
    return config;
  }
  if(config.provider!=='piper'||config.language!=='vi-VN'||![config.python,config.model].every(p=>typeof p==='string'&&path.isAbsolute(p)))throw Error('Invalid local voice runtime');
  if(await hashFile(config.model)!==config.modelSha256||await hashFile(config.model+'.json')!==config.configSha256)throw Error('Voice model/config checksum mismatch');
  return config;
}
export function voiceProfile(runtime,{voiceName,speed}={}){
  if(runtime.provider!=='vieneu'){
    if(voiceName!==undefined||speed!==undefined)throw Error('Preset selection and speaking speed require the VieNeu provider');
    return {voice:runtime.voice};
  }
  const voice=voiceName??runtime.voice,rate=speed??runtime.speed;
  if(!runtime.presetVoices?.some(v=>v.name===voice))throw Error('Unknown Vietnamese preset voice');
  if(!Number.isFinite(rate)||rate<1||rate>2||!Number.isFinite(runtime.temperature)||runtime.temperature<0.5||runtime.temperature>1)throw Error('Invalid local speaking profile');
  return {voice,speed:rate,temperature:runtime.temperature};
}
export function captionWithVoiceCredit(caption,provider){
  const credits={vieneu:'VieNeu-TTS v3 Turbo — Phạm Nguyễn Ngọc Bảo; codec MOSS — OpenMOSS-Team.',
    'windows-sapi':'Microsoft Windows.',piper:'VAIS1000 / rhasspy Piper; dữ liệu CC BY 4.0.'};
  if(!credits[provider])throw Error('Unknown voice provider for caption attribution');
  const marker='\n\nNguồn giọng tổng hợp: ';
  const base=caption.split(marker)[0].replace(/Giọng đọc máy tiếng Việt từ Microsoft Windows\.\s*$/u,'').trim();
  return `${base}${marker}${credits[provider]}`;
}
export async function renderVoice(state,queueId,script,{home=voiceHome,voiceName,speed}={}){
  const brief=voiceBrief(state,queueId),runtime=await voiceRuntime(home);
  const profile=voiceProfile(runtime,{voiceName,speed});
  if(typeof script!=='string'||script.trim().length<10||script.length>1500)throw Error('Expected a short reviewed script');
  const digest=createHash('sha256').update(JSON.stringify({queueId,script,provider:runtime.provider,...profile,model:runtime.modelSha256,config:runtime.configSha256,version:runtime.version,renderer:4})).digest('hex');
  const outputDir=path.join(home,'renders');await mkdir(outputDir,{recursive:true});
  const base=path.join(outputDir,`${queueId}-${digest.slice(0,16)}`),receipt=base+'.json';
  try{
    const prior=JSON.parse(await readFile(receipt,'utf8'));
    if(prior.digest!==digest||await hashFile(base+'.wav')!==prior.sha256)throw Error('Cached voice receipt mismatch');
    return prior;
  }catch(e){if(e.code!=='ENOENT')throw e;}
  let lock;try{lock=await open(base+'.lock','wx');}catch(e){if(e.code==='EEXIST')throw Error('This voice render is already in progress; reconcile before retrying');throw e;}
  try{
    await writeFile(base+'.txt',script,{encoding:'utf8',flag:'w'});
    if(runtime.provider==='vieneu'){
      const helper=fileURLToPath(new URL('../scripts/voice-vieneu.py',import.meta.url));
      await run(runtime.python,['-I',helper,'--config',runtime.configFile,'--input',base+'.txt','--output',base+'.partial.wav','--voice',profile.voice,'--speed',String(profile.speed)],{timeout:300000,maxBuffer:2*1024*1024,windowsHide:true,env:{...process.env,PYTHONUTF8:'1'}});
    }else if(runtime.provider==='windows-sapi'){
      const helper=fileURLToPath(new URL('../scripts/voice-render.ps1',import.meta.url));
      await run(runtime.powershell,['-NoProfile','-NonInteractive','-File',helper,'-InputFile',base+'.txt','-OutputFile',base+'.partial.wav','-VoiceName',runtime.voice],{timeout:120000,maxBuffer:1024*1024,windowsHide:true});
    }else{
      const helper=fileURLToPath(new URL('../scripts/voice-render.py',import.meta.url));
      await run(runtime.python,['-I',helper,'--model',runtime.model,'--input',base+'.txt','--output',base+'.partial.wav'],{timeout:120000,maxBuffer:1024*1024,windowsHide:true});
    }
    const qa=inspectWav(await readFile(base+'.partial.wav'));
    await rename(base+'.partial.wav',base+'.wav');
    const result={...brief,script,status:'rendered_needs_listening',digest,path:base+'.wav',sha256:await hashFile(base+'.wav'),qa,provider:runtime.provider,...profile,offline:true,createdAt:new Date().toISOString(),listeningVerified:false,
      attribution:runtime.attribution??`Vietnamese stock voice: VAIS1000 / rhasspy Piper voice; dataset CC BY 4.0; ${runtime.modelCard}. Synthetic narration adapted for Sakura.`,published:false};
    await writeFile(receipt,JSON.stringify(result,null,2),{flag:'wx'});return result;
  }finally{await lock.close();await unlink(base+'.lock');}
}
