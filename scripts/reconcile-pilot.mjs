import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {root,updateState} from '../src/store.mjs';

// This imports evidence recorded after UI verification; it never submits a post.
const journal=JSON.parse(await readFile(path.join(root,'state','pilot-submission-journal.json'),'utf8'));
await updateState(state=>{
  for(const entry of journal){
    if(entry.status==='deleted'){
      const item=state.queue.find(q=>q.id===entry.id);
      if(!entry.deletedVerifiedAt||!entry.deletionAuthorized||!item)throw Error(`Deletion evidence missing: ${entry.id}`);
      if(item.receipt?.platformId===entry.receipt?.platformId){
        item.receiptHistory??=[];item.receiptHistory.push({...item.receipt,deletedVerifiedAt:entry.deletedVerifiedAt});
        item.receipt=null;item.status='deleted';
      }
      continue;
    }
    if(!['scheduled','published','under_review'].includes(entry.status))continue;
    const item=state.queue.find(q=>q.id===entry.id);
    const r=entry.receipt;
    const validTime=entry.status==='under_review'?r?.submittedVerifiedAt:entry.status==='published'?r?.publishedVerifiedAt&&Number.isFinite(Date.parse(r.publishedAt)):r?.scheduledVerifiedAt&&r.scheduledAt===item?.publishAt;
    if(!item||!validTime||!/^\d+$/.test(r.platformId)||r.url!==`https://www.tiktok.com/@${item.account}/video/${r.platformId}`)throw Error(`Receipt mismatch: ${entry.id}`);
    if(item.receipt&&item.receipt.platformId!==r.platformId)throw Error(`Conflicting receipt: ${entry.id}`);
    if(item.status!=='published'){item.status=entry.status;item.receipt=r;}
    if(entry.status==='published'){
      item.publishMode=r.scheduledVerifiedAt?'scheduled':'now';
      if(item.publishMode==='now')item.publishAt=null;
      item.publishedAt=r.publishedAt;item.location=r.location;
      const promotionKey=item.promotionKey??(state.campaign.promotionExceptionIds?.includes(item.id)?'buy3-get1':'buy1-get1-tiktok');
      item.promotionKey=promotionKey;
      const existing=state.posts.find(p=>p.id===r.platformId);
      if(!existing)state.posts.push({id:r.platformId,queueId:item.id,productId:item.productId,angleId:item.angleId,variantId:item.variantId,format:item.format,publishedAt:r.publishedAt,url:r.publicUrl??r.url,distribution:'organic',promotionKey});
      else if(existing.promotionKey===undefined)existing.promotionKey=promotionKey;
      else if(existing.promotionKey!==promotionKey)throw Error(`Promotion cohort conflict: ${entry.id}`);
    }
  }
  const verified=state.queue.filter(q=>q.phase==='pilot'&&q.status==='scheduled'&&q.receipt?.scheduledVerifiedAt).length;
  const published=state.queue.filter(q=>q.phase==='pilot'&&q.status==='published'&&q.receipt?.publishedVerifiedAt).length;
  state.campaign.scheduleStatus=`${verified} scheduled, ${published} published; pilot20`;
  state.campaign.requestedMode='publish_now';
  state.campaign.location='Vựa Sầu Riêng Cô Ba · 322 Đ. Huỳnh Thị Hai';
  for(const angle of state.angles.filter(a=>a.productId==='sakura-cleaner-500ml')){angle.distribution='organic';angle.promotionKey??='buy1-get1-tiktok';}
  return state;
});
console.log('Imported verified scheduling receipts; no posts submitted.');
