import {updateState} from '../src/store.mjs';
// The new footage instruction revises unsubmitted creatives, never accepted posts.
await updateState(s=>{
  const group=s.campaign.voiceTest;
  if(group?.day!=='2026-10-28'||!group.voiceProfileApproval)throw Error('Expected the authorized October28 tests and accepted voice profile');
  const item=s.queue.find(q=>q.id==='sakura-109');
  if(item.receipt||['submitting','needs_review'].includes(item.status))throw Error('Reconcile accepted/uncertain creative before revision');
  const angleId='sakura-pain-mua-dung-nhu-cau-voice';
  if(item.angleId!==angleId){
    item.creativeHistory??=[];item.creativeHistory.push({angleId:item.angleId,title:item.title,variantId:item.variantId,sourceQueueId:item.sourceQueueId,reason:'Footage contains no reviewed footwear shot; use offer/need selection angle instead.'});
    item.angleId=angleId;item.title='Được tặng thêm, có đúng thứ nhà mình cần? | Sakura';
  }
  if(!s.angles.some(a=>a.id===angleId))s.angles.push({id:angleId,name:'Ưu đãi và nhu cầu thực · lời kể',productId:item.productId,format:'video',distribution:'organic',promotionKey:item.promotionKey,status:'Giả thuyết chưa được kiểm chứng'});
  group.footageAuthorization='User supplied footages folder and requested edited videos with our content, accepted voice and shuffled background music.';
  group.creativeFormat='stock-footage-pain-hook-v4';
  return s;
});
await import('./prepare-voice-tests.mjs');
console.log('Prepared source-attributed footage revisions; no upload or publication performed.');
