import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {hashFile} from './store.mjs';
import {voiceProfile} from './voice.mjs';
import {inspectWav} from './wav.mjs';
import {hash} from './knowledge/index.mjs';

// Import reviewed media only. Never execute its stored command or activate its config.
export async function loadReviewedVoice({receiptFile,approvalFile,script,item,runtime,helperFile,now=new Date().toISOString()}){
  for(const file of [receiptFile,approvalFile,helperFile])if(!path.isAbsolute(file??''))throw Error('Use absolute reviewed voice paths');
  const voice=JSON.parse(await readFile(receiptFile,'utf8')),approval=JSON.parse(await readFile(approvalFile,'utf8'));
  if(approval.verified!==true||approval.reviewer!=='user'||!approval.source?.startsWith('chat:')||!Number.isFinite(Date.parse(approval.verifiedAt))||Date.parse(approval.verifiedAt)>Date.parse(now)||approval.intentId!==item.id||approval.account!==item.account||approval.productId!==item.productId||path.resolve(approval.receiptFile??'')!==path.resolve(receiptFile)||approval.receiptSha256!==await hashFile(receiptFile))throw Error('Exact intent-scoped user listening approval missing/mismatched');
  if(voice.provider!=='vieneu'||voice.script!==script||voice.scriptSha256!==hash(script)||approval.audioSha256!==voice.sha256||approval.scriptSha256!==voice.scriptSha256)throw Error('Approved narration/script binding mismatch');
  const profile=voiceProfile({...runtime,temperature:voice.temperature},{voiceName:voice.voice,speed:voice.speed,referenceStyle:voice.referenceStyle});
  if(!isDeepStrictEqual(profile,approval.profile))throw Error('Approved voice profile mismatch');
  for(const file of [voice.path,voice.scriptFile,voice.runtimeConfigFile])if(!path.isAbsolute(file??''))throw Error('Preserve absolute source media/config paths');
  if(await hashFile(voice.path)!==voice.sha256||(await readFile(voice.scriptFile,'utf8'))!==script||await hashFile(voice.runtimeConfigFile)!==voice.runtimeConfigSha256||voice.modelManifestSha256!==runtime.modelSha256||await hashFile(voice.modelManifest)!==voice.modelManifestSha256||voice.helperSha256!==await hashFile(helperFile))throw Error('Reviewed audio/model/helper/config bytes changed');
  const source=JSON.parse(await readFile(voice.runtimeConfigFile,'utf8'));
  if(source.provider!=='vieneu'||source.version!==runtime.version||source.modelSha256!==runtime.modelSha256||source.temperature!==voice.temperature||source.voice!==voice.voice)throw Error('Archived source synthesis configuration mismatch');
  const command=voice.command,argument=name=>command?.[command.indexOf(name)+1];
  if(!Array.isArray(command)||command.length!==15||command[1]!=='-I'||command[0]!==source.python||path.resolve(command[2]??'')!==path.resolve(helperFile)||argument('--config')!==voice.runtimeConfigFile||argument('--input')!==voice.scriptFile||argument('--voice')!==voice.voice||Number(argument('--speed'))!==voice.speed||argument('--reference-style')!==voice.referenceStyle||!voice.rawSource?.path||argument('--output')!==voice.rawSource.path||await hashFile(voice.rawSource.path)!==voice.rawSource.sha256)throw Error('Source preset-only command provenance mismatch');
  const qa=inspectWav(await readFile(voice.path));
  return {voice,profile,approval,qa,proof:{approvalFile,approvalSha256:await hashFile(approvalFile),sourceReceiptFile:receiptFile,sourceReceiptSha256:approval.receiptSha256,sourceRuntimeConfigFile:voice.runtimeConfigFile,sourceRuntimeConfigSha256:voice.runtimeConfigSha256,scope:'exact approved WAV import only',synthesisAllowed:false,globalRuntimeChanged:false}};
}
