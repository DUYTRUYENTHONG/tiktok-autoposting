import path from 'node:path';
import {updateState,hashFile} from '../src/store.mjs';
import {first50Promotion} from '../src/promotion.mjs';
const image=process.argv[2];
if(!path.isAbsolute(image??'')||!image.endsWith('.png'))throw Error('Supply the absolute visually-reviewed first50 promotion card');
const asset={path:image,name:path.basename(image),kind:'image',sha256:await hashFile(image)};
await updateState(s=>{
  s.campaign.currentPromotion={...first50Promotion,offerAsset:asset,visuallyVerified:true,verifiedAt:new Date().toISOString()};
  s.campaign.offer=first50Promotion.text;
  for(const item of s.queue.filter(q=>q.phase==='voice-test'&&!q.receipt)){
    item.promotionKey=first50Promotion.key;item.sourceAssets[3]={...asset};item.assetsVerified=false;item.status='needs_render';
    const angle=s.angles.find(a=>a.id===item.angleId);if(angle)angle.promotionKey=first50Promotion.key;
  }
  return s;
});
console.log('Activated first50 terms for unsubmitted tests/future planning. Accepted posts unchanged; redemption counts remain unknown.');
