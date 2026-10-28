import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareCarouselBriefs,carouselPainAngles} from '../src/knowledge/carousel-briefs.mjs';
import {buildIndex} from '../src/knowledge/index.mjs';
import {embeddingModels} from '../src/knowledge/embeddings.mjs';

// Unit fixtures model the retrieval boundary, not actual embeddings or generated performance labels.
const ids=['sakura:identity:500ml','sakura:offer:buy1-get1-tiktok-first50','sakura:policy:material-check','sakura:editorial:footage-video-policy'];
const index=buildIndex(ids.map((sourceId,i)=>({sourceId,productId:'sakura-cleaner-500ml',promotionKey:i===0||i===2?'*':'buy1-get1-tiktok-first50',section:'fixture',text:`Verified fixture ${i}`,sourceUri:'test-only:fixture',sourceHash:'test-only',verified:true,claimFields:['fixture'],verifiedAt:'2026-10-28T02:00:00Z',validFrom:'2026-10-28T00:00:00Z',validTo:null})));
const fixtureResult=()=>({status:'retrieved',mode:'retrieval-and-prompt-only',corpusHash:index.corpusHash,retrieval:'bm25+dense-rrf-v1',embeddingModel:{id:embeddingModels.e5.id,revision:embeddingModels.e5.revision},sources:index.sources.map(s=>({id:s.sourceId,snippet:s.text,uri:s.sourceUri,verifiedAt:s.verifiedAt}))});
const asOf='2026-10-28T05:00:00Z';

test('ten distinct four-slide editorial briefs retain factual attribution and honest readiness',async()=>{
  const requests=[],pipeline={async invoke(request){requests.push(request);return fixtureResult();}};
  const result=await prepareCarouselBriefs({index,pipeline,asOf});
  assert.equal(result.posts.length,10);assert.equal(new Set(carouselPainAngles.map(a=>a.key)).size,10);
  assert.equal(new Set(result.posts.map(p=>p.slides[0].body)).size,10);assert.equal(new Set(result.posts.map(p=>p.slides[2].body)).size,10);
  assert.deepEqual(result.posts.map(p=>p.inquiryCode),Array.from({length:10},(_,i)=>`ẢNH${201+i}`));
  assert.equal(result.mode,'retrieval-grounded-editorial-template');assert.equal(result.fineTunedModelUsed,false);assert.equal(result.generativeLLMUsed,false);
  assert.deepEqual(result.globalPromotion,{text:'Mua 1 tặng 1 cho 50 đơn đầu tiên từ TikTok',maxOrders:50,unit:'orders',channel:'TikTok',limitScope:'campaign-wide',perPostReset:false,perDayReset:false,remainingOrders:null,redeemedOrders:null});
  for(const post of result.posts) {
    assert.deepEqual(post.slides.map(s=>s.role),['offer-first-hook','pain-point','useful-response','authentic-product-cta']);
    assert.equal(post.slides.length,4);assert.equal(post.slides[0].heading,'MUA 1 TẶNG 1');assert.match(post.slides[0].body,/50 đơn đầu tiên từ TikTok/);
    assert.equal(post.slides[3].asset.kind,'authentic-product-packshot');assert.ok(post.slides.every(s=>s.asset.path===null&&s.asset.selected===false&&s.asset.visuallyReviewed===false));
    assert.match(post.caption,new RegExp(post.inquiryCode));assert.match(post.caption,/không phải demo Sakura/);
    assert.match(post.caption,/Vựa Sầu Riêng Cô Ba, 322 Đ\. Huỳnh Thị Hai/);assert.match(post.caption,/TP\.HCM hoặc đặt online toàn quốc/);
    assert.match(post.caption,/Hỏi giá và điều kiện trước khi đặt\./);assert.doesNotMatch(post.caption,/không đặt lại|Chưa xác minh số|áp dụng chung/);
    assert.equal(post.hashtags.length,7);assert.ok(['#Sakura','#NuocLauDaNang','#Mua1Tang1','#TikTok','#TPHCM'].every(tag=>post.hashtags.includes(tag)));
    assert.equal(post.grounding.corpusHash,index.corpusHash);assert.equal(post.grounding.sourceIds.length,4);assert.equal(post.readiness.submitted,false);
    assert.equal(post.fineTunedModelUsed,false);assert.equal(post.generativeLLMUsed,false);
  }
  assert.equal(requests.length,10);assert.ok(requests.every(r=>r.topK===4&&r.promotionKey==='buy1-get1-tiktok-first50'&&r.asOf===asOf));
  assert.equal(result.publication.canonicalQueueModified,false);
});
test('missing, stale, lexical-only or cross-promotion evidence never becomes a creative-ready brief',async()=>{
  for(const mutate of [r=>({...r,status:'abstained'}),r=>({...r,corpusHash:'old'}),r=>({...r,retrieval:'bm25-lexical-v1'}),r=>({...r,sources:r.sources.slice(1)}),r=>({...r,sources:r.sources.map((s,i)=>i? s:{...s,snippet:'Unsupported claim'})})]) {
    await assert.rejects(prepareCarouselBriefs({index,pipeline:{async invoke(){return mutate(fixtureResult());}},asOf}),/requires|evidence|mismatch/);
  }
});
test('brief content hash is stable when only preparation timestamp changes',async()=>{
  const pipeline={async invoke(){return fixtureResult();}};
  const a=await prepareCarouselBriefs({index,pipeline,asOf});
  const b=await prepareCarouselBriefs({index,pipeline,asOf:'2026-10-28T05:01:00Z'});
  assert.equal(a.briefsHash,b.briefsHash);assert.notEqual(a.preparedAt,b.preparedAt);
});
test('reviewed scene constraints keep207 on refrigerator exterior and208 on black footwear',async()=>{
  const result=await prepareCarouselBriefs({index,pipeline:{async invoke(){return fixtureResult();}},asOf});
  const fridge=result.posts.find(p=>p.inquiryCode==='ẢNH207'),shoes=result.posts.find(p=>p.inquiryCode==='ẢNH208');
  assert.equal(fridge.sourceAngleId,'sakura-pain-fridge-exterior');assert.equal(fridge.sourceAngleStatus,'new-editorial-hypothesis');
  assert.match(fridge.slides[0].body,/Cửa tủ lạnh bám tay, lau sao cho đúng\?/);assert.match(fridge.slides[2].body,/không suy thành cách dùng bên trong tủ/);
  assert.doesNotMatch(fridge.slides.map(s=>s.body).join(' '),/đáy nồi|lòng nồi|hãng nồi/);
  assert.match(shoes.slides[0].body,/Giày dép bẩn, cứ chà mạnh sao\?/);assert.match(shoes.slides[1].body,/Giày đen/);
  assert.doesNotMatch(shoes.slides.map(s=>s.body).join(' '),/dép trắng|màu trắng/);assert.match(shoes.slides[2].body,/chưa có xác minh Sakura phù hợp với mọi loại giày dép/);
});
