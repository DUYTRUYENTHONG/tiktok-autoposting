import {updateState} from '../src/store.mjs';
import {voicePainStories} from '../src/voice-copy.mjs';
// Specific user authorization on October28: ten additional narrated slideshow tests.
await updateState(s=>{
  const sources=s.queue.filter(q=>q.phase!=='voice-test'&&q.receipt?.scheduledAt?.startsWith('2026-10-28')&&q.assets?.length===5).sort((a,b)=>a.receipt.scheduledAt.localeCompare(b.receipt.scheduledAt)).slice(0,10);
  if(sources.length!==10)throw Error('Expected ten verified source carousels for October28');
  for(const [index,source] of sources.entries()){
    const id=`sakura-${101+index}`;
    const existing=s.queue.find(q=>q.id===id);
    if(existing){if(existing.phase==='voice-test'&&existing.sourceQueueId===source.id)continue;throw Error('Voice test ID conflicts with an existing item');}
    const leadCode=`GIỌNG${101+index}`,angleId=source.angleId+'-voice';
    const sourceAngle=s.angles.find(a=>a.id===source.angleId);
    if(!sourceAngle)throw Error('Source angle missing');
    if(!s.angles.some(a=>a.id===angleId))s.angles.push({...sourceAngle,id:angleId,name:sourceAngle.name+' · lời kể',format:'video',sourceAngleId:source.angleId,promotionKey:'buy1-get1-tiktok'});
    const caption=source.caption.replaceAll(source.leadCode??'__no_lead_code__',leadCode)+`\n\nBản thử lời kể tổng hợp. Nhắn mã “${leadCode}” kèm vật liệu và nhu cầu cần vệ sinh. Giọng đọc máy tiếng Việt từ Microsoft Windows.`;
    s.queue.push({id,account:source.account,productId:source.productId,angleId,variantId:'narrated-slideshow-test',sourceQueueId:source.id,format:'video',phase:'voice-test',title:source.title,caption,leadCode,storyType:'illustrative',sourceAssets:source.assets.map(a=>({...a})),assets:[],assetsVerified:false,status:'needs_render',approved:true,publishMode:'now',publishAt:null,promotionKey:'buy1-get1-tiktok',location:source.location,disclosures:{ownBrand:true,aiGenerated:true},music:{status:'needs_selection',backgroundUnderNarration:true},authorization:'User explicitly authorized ten additional narrated slideshow videos on 2026-10-28; preserve the original20 reservations.'});
  }
  s.campaign.voiceTest={day:'2026-10-28',count:10,queueIds:Array.from({length:10},(_,i)=>`sakura-${101+i}`),mode:'additional_videos',status:'preparing',approvalSource:'User: Publish10additionaltestvideos'};
  for(const item of s.queue.filter(q=>q.phase==='voice-test'&&!q.receipt)){
    const story=voicePainStories[item.angleId.replace(/-voice$/,'')];
    if(!story)continue;
    item.caption=item.caption.split(/\n\s*\n/).map((text,index)=>index===0?story.hook:index===1?story.story:text).join('\n\n');
    item.voiceCopyRevision='painpoint-v2';
  }
  return s;
});
console.log('Prepared ten additional voice test drafts. Original carousels and receipts unchanged; no posting occurred.');
