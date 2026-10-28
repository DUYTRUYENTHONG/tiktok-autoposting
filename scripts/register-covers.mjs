import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {updateState,hashFile,root} from '../src/store.mjs';

// Import a manifest only after a human/agent has inspected every final image.
const manifest=JSON.parse(await readFile(process.argv[2],'utf8'));
if(!Array.isArray(manifest)||!manifest.length)throw Error('Expected reviewed cover entries');
let journal=[];
try{journal=JSON.parse(await readFile(path.join(root,'state','pilot-submission-journal.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
const assets=[];
for(const entry of manifest){
  if(['submitting','needs_review'].includes(journal.findLast(e=>e.id===entry.id)?.status))throw Error(`Reconcile browser submission before creative changes: ${entry.id}`);
  if(entry.visuallyVerified!==true||!path.isAbsolute(entry.destination)||!/^sakura-\d{3}$/.test(entry.id))throw Error('Cover must be visually reviewed and have an absolute local path');
  if(!/\.(png|jpe?g|webp)$/i.test(entry.destination))throw Error('Cover must be an image');
  assets.push({...entry,sha256:await hashFile(entry.destination)});
}
const latest=await updateState(state=>{
  state.creativeOverrides??={};
  for(const entry of assets){
    const item=state.queue.find(q=>q.id===entry.id);
    if(!item||['submitting','needs_review'].includes(item.status))throw Error(`Cannot change uncertain item ${entry.id}`);
    if(item.receipt){if(item.assets?.[0]?.sha256===entry.sha256)continue;throw Error(`Cannot change submitted item ${entry.id}`);}
    if(item.assets?.length!==5||!item.assets.every(a=>/^[a-f0-9]{64}$/.test(a.sha256??'')))throw Error(`Base carousel missing: ${entry.id}`);
    const asset={path:entry.destination,name:path.basename(entry.destination),kind:'image',sha256:entry.sha256};
    state.creativeOverrides[item.id]={productId:item.productId,angleId:item.angleId,asset,visuallyVerified:true,verifiedAt:new Date().toISOString(),qa:'Final image visually inspected: product identity, Vietnamese text, scene, anatomy, no printed AI wording or unverified result.'};
    item.assets[0]=asset;item.assetsVerified=true;item.status='ready';item.creativeRevision=3;
  }
  for(const plan of state.dailyPlans??[]){
    plan.prepared=plan.slots.filter(at=>state.queue.some(q=>q.publishAt===at&&q.assetsVerified)).length;
    plan.unprepared=plan.slots.length-plan.prepared;
  }
  return state;
});
await writeFile(process.env.TIKTOK_UPLOAD_MANIFEST_FILE??path.join(root,'state','daily-upload.json'),JSON.stringify(latest.queue.filter(q=>q.phase==='daily'&&q.publishAt&&!q.receipt),null,2));
console.log(`Registered ${assets.length} reviewed covers, preserving planned times. No TikTok action occurred.`);
