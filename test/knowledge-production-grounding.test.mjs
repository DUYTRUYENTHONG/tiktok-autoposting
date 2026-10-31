import test from 'node:test';
import assert from 'node:assert/strict';
import {buildIndex,hash} from '../src/knowledge/index.mjs';
import {createProductionGrounding,checkProductionGrounding,evergreenRequiredSourceIds} from '../src/knowledge/production-grounding.mjs';

const asOf='2026-10-31T01:00:00Z';
const contents=[
  ['Sakura: dung tích500 ml, thông tin nhận diện sản phẩm.',['identity','volume']],
  ['Hỏi vật liệu bề mặt Sakura, xem nhãn trước khi chọn.',['material-check']],
  ['CTA: Gọi số điện thoại trong bio để được tư vấn.',['cta-policy']],
  ['Chính sách evergreen: không có quyền dùng khuyến mãi từ thẻ cũ.',['promotion-policy']],
  ['Chính sách video footage và giọng: stock minh họa, giọng mới cần nghe.',['video-policy','voice-preference']],
];
function sources(){return evergreenRequiredSourceIds.map((sourceId,i)=>({sourceId,productId:'sakura-cleaner-500ml',promotionKey:'*',section:'technical-test-fixture',text:contents[i][0],claimFields:contents[i][1],sourceUri:'test:fixture-not-real-product-verification',sourceHash:hash(contents[i]),verified:true,verifiedAt:'2026-10-31T00:00:00Z',validFrom:'2026-10-28T00:00:00Z',validTo:null,timestampBasis:'synthetic technical fixture only'}));}
const publicCopy={script:'Đây là chai Sa cu ra năm trăm mi li. Mình xem bề mặt trước.',headline:'Nhìn giống nhau, chưa chắc cùng vật liệu.',cta:'Gọi số điện thoại trong bio để được tư vấn',caption:'Sakura500ml. Hỏi giá và điều kiện trước khi đặt.'};
const options=(index=buildIndex(sources()))=>({index,publicCopy,account:'saigomlia',productId:'sakura-cleaner-500ml',asOf});

test('grounding checks all exact sources via LangChain and returns coverage only with a timestamp-independent cache binding',async()=>{
  const input=options(),record=await createProductionGrounding({...input,requiredSourceIds:[...evergreenRequiredSourceIds].reverse()});
  assert.equal(record.status,'grounded');assert.equal(record.evidenceCoveragePassed,true);assert.equal(record.scope,'required-source-evidence-coverage-only');
  assert.equal(record.ready,false);assert.equal(record.humanReviewed,false);assert.equal(record.generativeLLMUsed,false);assert.equal(record.fineTunedModelUsed,false);
  assert.deepEqual(record.sourceRecords.map(s=>s.sourceId),evergreenRequiredSourceIds);assert.equal(record.checks.length,5);assert.ok(record.checks.every(c=>c.status==='retrieved'&&/^[a-f0-9]{64}$/.test(c.promptHash)));
  assert.equal(record.scriptHash,hash(publicCopy.script));assert.ok(record.sourceRecords.every(s=>s.sourceHash&&s.sourceRecordHash&&s.verifiedAt&&s.sourceUri));
  const later=await createProductionGrounding({...input,asOf:'2026-10-31T01:01:00Z'});assert.equal(later.bindingHash,record.bindingHash);assert.equal(later.contentHash,record.contentHash);assert.notEqual(later.recordHash,record.recordHash);
  const checked=await checkProductionGrounding(record,{...input,asOf:'2026-10-31T01:02:00Z'});assert.equal(checked.valid,true);assert.equal(checked.ready,false);
});

test('exact copy/script/account/product binding survives field reordering but cannot transfer to another narration',async()=>{
  const input=options(),record=await createProductionGrounding(input);
  const reordered=Object.fromEntries(Object.entries(publicCopy).reverse());assert.equal((await checkProductionGrounding(record,{...input,publicCopy:reordered})).valid,true);
  for(const change of [{publicCopy:{...publicCopy,script:publicCopy.script+' nha'}},{publicCopy:{...publicCopy,caption:'Changed caption'}},{account:'another-account'},{productId:'another-product'}]){
    const checked=await checkProductionGrounding(record,{...input,...change});assert.equal(checked.valid,false);assert.equal(checked.ready,false);assert.ok(checked.blockers.includes('exact_public_copy_script_or_identity_changed'));
  }
});

test('missing, stale, future, expired or wrong-product source evidence abstains without related-source substitution',async()=>{
  for(const id of evergreenRequiredSourceIds){
    const rows=sources().filter(s=>s.sourceId!==id),record=await createProductionGrounding(options(buildIndex(rows)));
    assert.equal(record.status,'abstained');assert.equal(record.ready,false);assert.ok(record.blockers.includes('required_source_unavailable:'+id));
  }
  for(const change of [{verifiedAt:'2026-10-01T00:00:00Z'},{verifiedAt:'2026-11-01T00:00:00Z'},{validTo:'2026-10-30T00:00:00Z'},{productId:'another-product'},{claimFields:[]},{sourceHash:'not-a-checksum'}]){
    const rows=sources();rows[0]={...rows[0],...change};assert.equal((await createProductionGrounding(options(buildIndex(rows)))).status,'abstained');
  }
  await assert.rejects(createProductionGrounding({...options(),requiredSourceIds:evergreenRequiredSourceIds.slice(0,4)}),/cannot be weakened/);
  await assert.rejects(createProductionGrounding({...options(),maxAgeHours:10000}),/168/);
});

test('unknown offers cannot be authorized by general evidence or a historical offer section',async()=>{
  const rows=sources();rows.push({...rows[0],sourceId:'historical:offer',text:'Mua1tặng1',claimFields:['offer'],promotionKey:'buy1-get1-tiktok-first50'});
  const input=options(buildIndex(rows));
  for(const text of ['Mua 1 tặng 1 cho50đơn đầu tiên','Khuyến mãi hôm nay','Ưu đãi riêng','Freeship','Giảm20%']){
    const record=await createProductionGrounding({...input,publicCopy:{...publicCopy,caption:text}});assert.equal(record.status,'abstained');assert.ok(record.blockers.includes('discount_or_offer_copy_has_no_current_eligibility'));assert.equal(record.ready,false);
  }
  assert.equal((await createProductionGrounding({...input,promotionKey:'buy1-get1-tiktok-first50'})).status,'abstained');
});

test('checker rejects tampered records, changed current corpus, stale current evidence and false readiness',async()=>{
  const input=options(),record=await createProductionGrounding(input);
  for(const change of [{ready:true},{humanReviewed:true},{corpusHash:'f'.repeat(64)},{sourceRecords:[]}])assert.equal((await checkProductionGrounding({...record,...change},input)).valid,false);
  const changed=sources();changed[0].text+=' Changed identity evidence.';const check=await checkProductionGrounding(record,{...input,index:buildIndex(changed)});assert.equal(check.valid,false);assert.ok(check.blockers.includes('current_corpus_changed'));
  assert.equal((await checkProductionGrounding(record,{...input,asOf:'2026-11-10T01:00:00Z'})).valid,false);
  assert.equal((await checkProductionGrounding(record,{...input,asOf:'2026-10-31T00:59:00Z'})).valid,false);
  const corrupt=structuredClone(input.index);corrupt.sources[0].text='corrupted';await assert.rejects(createProductionGrounding({...input,index:corrupt}),/checksum/);
  const blocked=await createProductionGrounding({...input,publicCopy:{caption:'Mua1tặng1'}});assert.equal((await checkProductionGrounding(blocked,{...input,publicCopy:{caption:'Mua1tặng1'}})).valid,false);
});
