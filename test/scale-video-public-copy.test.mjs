import test from 'node:test';
import assert from 'node:assert/strict';
import {curatedStory,validateBrief,publicVideoCopy,groundVideoBrief,videoGroundingCopy} from '../scripts/render-scale-video-preview.mjs';
import {buildIndex,hash} from '../src/knowledge/index.mjs';
import {evergreenRequiredSourceIds} from '../src/knowledge/production-grounding.mjs';

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
