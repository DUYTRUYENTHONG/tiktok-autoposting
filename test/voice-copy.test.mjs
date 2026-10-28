import test from 'node:test';
import assert from 'node:assert/strict';
import {voicePainStories,painVoiceCopy} from '../src/voice-copy.mjs';
import {first50Promotion} from '../src/promotion.mjs';
test('pain-led voice scripts cover ten situations and preserve inquiry/offer meaning',()=>{
  assert.equal(Object.keys(voicePainStories).length,10);
  for(const key of Object.keys(voicePainStories)){
    const copy=painVoiceCopy(key+'-voice','giọng một không một');
    assert.ok(copy.script.startsWith(copy.hook));assert.match(copy.script,/giọng một không một/);assert.match(copy.script,/Mua một, tặng một, chỉ khi mua qua Tích Tóc/);
    assert.doesNotMatch(copy.script,/khách hàng đã|cam kết sạch|miễn phí giao|sạch 100/);
  }
  assert.equal(painVoiceCopy('unknown','code'),null);
});
test('limited offer is spoken first and counts orders rather than customers',()=>{
  const copy=painVoiceCopy('sakura-pain-tan-ca-voice','giọng một không một',first50Promotion);
  assert.ok(copy.script.startsWith(first50Promotion.voiceHook));assert.match(copy.script,/năm mươi đơn đầu tiên/);assert.doesNotMatch(copy.script,/năm mươi khách|chỉ hôm nay|còn \d/);
  assert.equal(first50Promotion.remainingOrders,null);assert.equal(first50Promotion.redeemedOrders,null);
});
