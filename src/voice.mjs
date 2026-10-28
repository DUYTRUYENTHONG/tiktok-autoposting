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
    performance:'Conversational stock narration; no impersonation, testimonial or invented outcome.',
    targetSeconds:'20–35; verify actual duration after synthesis',
    copyRevision:promotion?'promo-first50-v3':tailored?'painpoint-v2':'brief-v1',status:'script_draft',attachment:'WAV preview only. Browser photo composer has not been verified to accept custom narration; no upload or format conversion occurs.'};
}
export async function voiceRuntime(home=voiceHome){
  const config=JSON.parse((await readFile(path.join(home,'runtime.json'),'utf8')).replace(/^\uFEFF/,''));
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
export async function renderVoice(state,queueId,script,{home=voiceHome}={}){
  const brief=voiceBrief(state,queueId),runtime=await voiceRuntime(home);
  if(typeof script!=='string'||script.trim().length<10||script.length>1500)throw Error('Expected a short reviewed script');
  const digest=createHash('sha256').update(JSON.stringify({queueId,script,provider:runtime.provider,voice:runtime.voice,model:runtime.modelSha256,config:runtime.configSha256,version:runtime.version,renderer:3})).digest('hex');
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
    if(runtime.provider==='windows-sapi'){
      const helper=fileURLToPath(new URL('../scripts/voice-render.ps1',import.meta.url));
      await run(runtime.powershell,['-NoProfile','-NonInteractive','-File',helper,'-InputFile',base+'.txt','-OutputFile',base+'.partial.wav','-VoiceName',runtime.voice],{timeout:120000,maxBuffer:1024*1024,windowsHide:true});
    }else{
      const helper=fileURLToPath(new URL('../scripts/voice-render.py',import.meta.url));
      await run(runtime.python,['-I',helper,'--model',runtime.model,'--input',base+'.txt','--output',base+'.partial.wav'],{timeout:120000,maxBuffer:1024*1024,windowsHide:true});
    }
    const qa=inspectWav(await readFile(base+'.partial.wav'));
    await rename(base+'.partial.wav',base+'.wav');
    const result={...brief,script,status:'rendered_needs_listening',digest,path:base+'.wav',sha256:await hashFile(base+'.wav'),qa,provider:runtime.provider,voice:runtime.voice,createdAt:new Date().toISOString(),listeningVerified:false,
      attribution:runtime.attribution??`Vietnamese stock voice: VAIS1000 / rhasspy Piper voice; dataset CC BY 4.0; ${runtime.modelCard}. Synthetic narration adapted for Sakura.`,published:false};
    await writeFile(receipt,JSON.stringify(result,null,2),{flag:'wx'});return result;
  }finally{await lock.close();await unlink(base+'.lock');}
}
