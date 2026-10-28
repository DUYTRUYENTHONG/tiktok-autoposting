import test from 'node:test';
import assert from 'node:assert/strict';
import {voicePainStories,painVoiceCopy} from '../src/voice-copy.mjs';
import {first50Promotion} from '../src/promotion.mjs';
test('pain-led voice scripts cover the original tests plus offer clarity and preserve inquiry/offer meaning',()=>{
  assert.equal(Object.keys(voicePainStories).length,11);
  for(const key of Object.keys(voicePainStories)){
    const copy=painVoiceCopy(key+'-voice','giọng một không một');
    assert.ok(copy.script.startsWith(copy.hook));assert.match(copy.script,/giọng một không một/);assert.match(copy.script,/Mua một, tặng một, chỉ khi mua qua Tích Tóc/);
    assert.doesNotMatch(copy.script,/khách hàng đã|cam kết sạch|miễn phí giao|sạch 100/);
  }
  assert.equal(painVoiceCopy('unknown','code'),null);
});
test('limited offer is spoken first and counts orders rather than customers',()=>{
  const copy=painVoiceCopy('sakura-pain-tan-ca-voice','giọng một không một',first50Promotion);
  assert.ok(copy.script.replaceAll('\n',' ').startsWith(first50Promotion.voiceHook));assert.match(copy.script,/năm mươi đơn đầu tiên/);assert.doesNotMatch(copy.script,/năm mươi khách|chỉ hôm nay|còn \d/);
  assert.equal(first50Promotion.remainingOrders,null);assert.equal(first50Promotion.redeemedOrders,null);
});
test('v7 is limited to102–105 and preserves the exact accepted101 script',()=>{
  const accepted='Mua một, tặng một!\nChỉ năm mươi đơn đầu tiên từ Tích Tóc.\n\nTan ca rồi. Lại tăng ca ở bếp hả?\nViệc nhà, mình chia nhau nha. Trước khi chọn nước lau, nhớ xem đúng chất liệu.\n\nCần tư vấn Sa cu ra? Nhắn: giọng một không một. Gửi kèm ảnh bề mặt. Dùng theo nhãn.';
  assert.equal(painVoiceCopy('sakura-pain-tan-ca-voice','giọng một không một',first50Promotion,{queueId:'sakura-101'}).script,accepted);
  for(const [queueId,angle] of [['sakura-102','chia-viec'],['sakura-103','phong-tro'],['sakura-104','vat-lieu'],['sakura-105','so-hong']]){
    const copy=painVoiceCopy('sakura-pain-'+angle+'-voice','giọng mã thử',first50Promotion,{queueId});
    assert.equal(copy.copyRevision,'promo-first50-colloquial-v7');assert.equal(copy.spokenLeadCodeIncluded,false);
    assert.ok(copy.script.replaceAll('\n',' ').startsWith(first50Promotion.voiceHook));assert.match(copy.script,/chụp ảnh gửi shop nha/);
    assert.doesNotMatch(copy.script,/giọng mã thử|năm mươi khách|cam kết sạch|miễn phí giao/);
  }
});
