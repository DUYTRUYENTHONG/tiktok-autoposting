import test from 'node:test';
import assert from 'node:assert/strict';
import {curatedStory,validateBrief,publicVideoCopy} from '../scripts/render-scale-video-preview.mjs';

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
});
