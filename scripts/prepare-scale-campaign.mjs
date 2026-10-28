import {mkdir,readFile,writeFile,realpath} from 'node:fs/promises';
import path from 'node:path';
import {homedir} from 'node:os';
import {loadState,updateState,root,hashFile} from '../src/store.mjs';
import {buildScaleCampaign,normalizeScaleTimes,scaleCsv,scaleHash} from '../src/scale-campaign.mjs';

try{
  const args=process.argv.slice(2);let register=false,startDay,normalize=false;
  for(let i=0;i<args.length;i++){if(args[i]==='--register')register=true;else if(args[i]==='--normalize-times')normalize=true;else if(args[i]==='--start'&&args[i+1]&&!args[i+1].startsWith('--'))startDay=args[++i];else throw Error('Usage: node scripts/prepare-scale-campaign.mjs [--start YYYY-MM-DD] [--register] | --normalize-times');}
  if(normalize&&(register||startDay))throw Error('Time normalization only writes a new private revision; cannot register or restart it');
  const state=await loadState();let plan,sourceManifestFile,sourceManifestSha256;
  if(normalize){
    const meta=state.campaign?.scaleCampaign;sourceManifestFile=meta?.manifestFile;sourceManifestSha256=meta?.manifestSha256;
    if(!path.isAbsolute(sourceManifestFile??'')||!sourceManifestSha256||await hashFile(sourceManifestFile)!==sourceManifestSha256)throw Error('Registered immutable manifest source hash mismatch');
    const original=JSON.parse(await readFile(sourceManifestFile,'utf8'));if(original.planHash!==meta.planHash||original.campaignId!==meta.campaignId)throw Error('Registered original plan metadata mismatch');
    plan=normalizeScaleTimes(original,state);
    const latest=await loadState();if(latest.campaign?.scaleCampaign?.planHash!==meta.planHash||await hashFile(sourceManifestFile)!==sourceManifestSha256||normalizeScaleTimes(original,latest,{now:plan.createdAt}).planHash!==plan.planHash)throw Error('Reservations or original source changed during normalization');
  }else plan=buildScaleCampaign(state,{...(startDay?{startDay}:{})});
  const requested=process.env.TIKTOK_SCALE_HOME??path.join(homedir(),'.codex/data/tiktok-autoposting/scale-campaign');
  if(!path.isAbsolute(requested))throw Error('Scale artifacts require an absolute private path');
  await mkdir(requested,{recursive:true});const directory=await realpath(requested),checkout=(await realpath(root)).toLowerCase();
  if(directory.toLowerCase()===checkout||directory.toLowerCase().startsWith(checkout+path.sep))throw Error('Keep scale plan artifacts outside Git checkout');
  const manifestFile=path.join(directory,`plan-${plan.planHash.slice(0,16)}.json`),csvFile=manifestFile.replace('.json','.csv');let reused=false;
  try{
    const existing=JSON.parse(await readFile(manifestFile,'utf8'));
    const {createdAt:_oldTime,...oldPayload}=existing,{createdAt:_newTime,...newPayload}=plan;
    if(scaleHash(oldPayload)!==scaleHash(newPayload))throw Error('Existing scale artifact changed; preserve it and reconcile instead of overwriting');
    reused=true;
  }catch(error){if(error.code!=='ENOENT')throw error;await writeFile(manifestFile,JSON.stringify(plan,null,2),{encoding:'utf8',mode:0o600,flag:'wx'});}
  try{if(await readFile(csvFile,'utf8')!==scaleCsv(plan))throw Error('Existing scale CSV differs from the reviewed plan');}catch(error){if(error.code!=='ENOENT')throw error;await writeFile(csvFile,scaleCsv(plan),{encoding:'utf8',mode:0o600,flag:'wx'});}
  const manifestSha256=await hashFile(manifestFile),csvSha256=await hashFile(csvFile);
  if(register)await updateState(current=>{
    const latest=buildScaleCampaign(current,{now:plan.createdAt,startDay:plan.startDay});if(latest.planHash!==plan.planHash)throw Error('Reservations/identities changed before metadata registration; inspect a fresh plan');
    const prior=current.campaign?.scaleCampaign;if(prior?.planHash&&prior.planHash!==plan.planHash)throw Error('A different scale goal is already registered; reconcile explicitly');
    return {...current,campaign:{...current.campaign,scaleCampaign:{campaignId:plan.campaignId,planHash:plan.planHash,manifestFile,manifestSha256,csvFile,csvSha256,counts:plan.counts,startDay:plan.startDay,endDay:plan.endDay,status:'planned_creative_drafts',registeredAt:prior?.registeredAt??new Date().toISOString()}}};
  });
  const first=plan.items.find(i=>i.format==='photo');
  console.log(JSON.stringify({manifestFile,manifestSha256,csvFile,csvSha256,reused,registered:register,previousPlanHash:plan.previousPlanHash,sourceManifestFile,sourceManifestSha256,timeNormalization:plan.timeNormalization,counts:plan.counts,days:plan.days.length,startDay:plan.startDay,endDay:plan.endDay,firstPhoto:{id:first.id,leadCode:first.leadCode,proposedPublishAt:first.proposedPublishAt,status:first.status,showDiscount:first.promotion.showDiscount},canonicalQueueModified:false},null,2));
}catch(error){console.error(error.message);process.exitCode=1;}
