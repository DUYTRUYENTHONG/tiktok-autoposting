import test from 'node:test';
import assert from 'node:assert/strict';
import {curatedStory,validateBrief,publicVideoCopy,groundVideoBrief,videoGroundingCopy,wrapStoryCard,identityOpeningGraph} from '../scripts/render-scale-video-preview.mjs';
import {buildIndex,hash} from '../src/knowledge/index.mjs';
import {evergreenRequiredSourceIds} from '../src/knowledge/production-grounding.mjs';

test('optional identity opening preserves the default and validates its selected source',()=>{
  const item={id:'sakura-scale-10002',intentHash:'fixture',creative:{sourceHypothesisId:'sakura-pain-chia-viec'}},brief=curatedStory(item);
  assert.equal(validateBrief({...brief,openingMode:'identity_to_context'},item).openingMode,'identity_to_context');
  assert.throws(()=>validateBrief({...brief,openingMode:'before_after_demo'},item),/opening mode/);
  assert.deepEqual(identityOpeningGraph(undefined,'joined',6),{filters:[],output:'joined'});
  const graph=identityOpeningGraph('identity_to_context','joined',6);
  assert.equal(graph.output,'openingstory');assert.match(graph.filters.join(';'),/\[6:v\]/);assert.match(graph.filters.join(';'),/st=0.65:d=0.2:alpha=1/);assert.match(graph.filters.join(';'),/eof_action=pass/);
  assert.throws(()=>identityOpeningGraph('identity_to_context','joined',-1),/Invalid/);
  assert.throws(()=>identityOpeningGraph('identity_to_context','joined;other',6),/Invalid/);
});

test('video briefs reject internal identifiers in every public text field',()=>{
  const item={id:'sakura-scale-10002',intentHash:'fixture',creative:{sourceHypothesisId:'sakura-pain-chia-viec'}};
  const brief=curatedStory(item);
  for(const key of ['script','headline','tension','decision','identity','questions','price','stockLabel']){
    assert.throws(()=>validateBrief({...brief,[key]:brief[key]+' Nhắc mã GIỌNG10002'},item),/internal identifier/i,key);
  }
  assert.equal(validateBrief(brief,item),brief);
  const copy=publicVideoCopy(brief);
  assert.match(copy.cta,/Gọi số điện thoại trong bio/);
  assert.match(copy.caption,/Gọi số điện thoại trong bio để được tư vấn/);
  assert.doesNotMatch(copy.cta+' '+copy.caption,/GIỌNG\d|ẢNH\d|BẾP\d|Nhắc mã|sakura-scale-/u);
  assert.doesNotMatch(brief.script,/Nhắn shop/u);
  for(const text of ['Nhắn shop để hỏi giá','Gửi shop ảnh bề mặt','Bấm link trong bio'])assert.throws(()=>validateBrief({...brief,price:text},item),/call-only/);
});

test('story card wrapping retains deliberate Vietnamese breath-group line breaks',()=>{
  const headline='Hỏi giá xong,\nkhoan chốt đã.';
  assert.equal(wrapStoryCard(headline),headline);
  const longer='Đừng đoán vật liệu của món đồ chỉ qua màu sắc.\nXem nhãn trước.';
  const wrapped=wrapStoryCard(longer);assert.ok(wrapped.endsWith('\nXem nhãn trước.'));
  assert.equal(wrapped.split(/\s+/).join(' '),longer.split(/\s+/).join(' '));
  assert.ok(wrapped.split('\n').every(line=>line.length<=27));
});

test('natural sentence-start capitalization does not reject required Vietnamese story facts',()=>{
  const item={id:'sakura-scale-10002',intentHash:'fixture',creative:{sourceHypothesisId:'sakura-pain-chia-viec'}};
  const brief=curatedStory(item);
  brief.script='Năm trăm mi li là dung tích của chai Sa cu ra này. Bề mặt bạn muốn lau là kính hay gỗ có lớp phủ? Mình xem nhãn và hướng dẫn chăm sóc trước khi chọn sản phẩm. Gọi số điện thoại trong phần giới thiệu để được tư vấn. Giá bao nhiêu, mình hỏi shop trước nhé. Điều kiện mua cũng cần hỏi cho rõ.';
  assert.equal(validateBrief(brief,item),brief);
});

test('a supplied reviewed caption retains topic-specific qualifications and passes the same public-copy checks',()=>{
  const item={id:'sakura-scale-10002',intentHash:'fixture',creative:{sourceHypothesisId:'sakura-pain-chia-viec'}},brief=curatedStory(item);
  brief.captionQualification='Chưa xác minh độ phù hợp với bề mặt này.';
  brief.caption='Cùng chia việc nhà. '+brief.captionQualification+' Gọi số điện thoại trong bio để được tư vấn.';
  assert.equal(validateBrief(brief,item),brief);assert.ok(publicVideoCopy(brief).caption.startsWith(brief.caption));
  assert.throws(()=>validateBrief({...brief,caption:'Gọi số điện thoại trong bio để được tư vấn.'},item),/qualification/);
  assert.throws(()=>validateBrief({...brief,caption:brief.caption+' Nhắn shop.'},item),/call-only/);
  assert.throws(()=>validateBrief({...brief,caption:brief.caption+' Mua một tặng một.'},item),/Evergreen/);
});

test('scale video grounds the exact narration, overlays and generated caption and stops on missing current CTA evidence',async()=>{
  const item={id:'sakura-scale-10002',intentHash:'fixture',account:'saigomlia',productId:'sakura-cleaner-500ml',creative:{sourceHypothesisId:'sakura-pain-chia-viec'}};
  const brief=validateBrief(curatedStory(item),item),asOf='2026-10-31T01:00:00Z';
  const rows=[
    ['Dung tích Sakura 500 ml.',['identity','volume']],
    ['Vật liệu bề mặt Sakura.',['material-check']],
    ['CTA gọi số điện thoại trong bio.',['cta-policy']],
    ['Chính sách evergreen.',['promotion-policy']],
    ['Chính sách video footage và giọng.',['video-policy','voice-preference']],
  ];
  const sources=rows.map(([text,claimFields],i)=>({sourceId:evergreenRequiredSourceIds[i],productId:item.productId,promotionKey:'*',section:'test-fixture',text,claimFields,sourceUri:'test:synthetic-only',sourceHash:hash(text),verified:true,verifiedAt:'2026-10-31T00:00:00Z',validFrom:'2026-10-28T00:00:00Z',validTo:null}));
  const record=await groundVideoBrief(brief,item,{index:buildIndex(sources),asOf});
  assert.equal(record.status,'grounded');assert.equal(record.ready,false);assert.equal(record.scriptHash,hash(brief.script));
  const copy=videoGroundingCopy(brief);assert.equal(copy.caption,publicVideoCopy(brief).caption);assert.equal(copy.questions,brief.questions);
  for(const changed of [{...brief,script:brief.script+' Hỏi rõ rồi hãy chọn.'},{...brief,headline:'Một câu hỏi trước khi chọn.'}]){
    const newer=await groundVideoBrief(changed,item,{index:buildIndex(sources),asOf});assert.notEqual(newer.bindingHash,record.bindingHash);
  }
  await assert.rejects(groundVideoBrief(brief,item,{index:buildIndex(sources.filter(s=>!s.claimFields.includes('cta-policy'))),asOf}),/grounding unavailable/);
  await assert.rejects(groundVideoBrief(brief,item,{index:buildIndex(sources),asOf:'2026-11-08T00:00:00Z'}),/grounding unavailable/);
});
