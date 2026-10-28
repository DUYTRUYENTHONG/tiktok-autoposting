import test from 'node:test';
import assert from 'node:assert/strict';
import {voicePainStories,painVoiceCopy} from '../src/voice-copy.mjs';
test('pain-led voice scripts cover ten situations and preserve inquiry/offer meaning',()=>{
  assert.equal(Object.keys(voicePainStories).length,10);
  for(const key of Object.keys(voicePainStories)){
    const copy=painVoiceCopy(key+'-voice','giọng một không một');
    assert.ok(copy.script.startsWith(copy.hook));assert.match(copy.script,/giọng một không một/);assert.match(copy.script,/Mua một, tặng một, chỉ khi mua qua Tích Tóc/);
    assert.doesNotMatch(copy.script,/khách hàng đã|cam kết sạch|miễn phí giao|sạch 100/);
  }
  assert.equal(painVoiceCopy('unknown','code'),null);
});
