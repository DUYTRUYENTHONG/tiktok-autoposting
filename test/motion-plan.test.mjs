import test from 'node:test';
import assert from 'node:assert/strict';
import {validateMotionCopy} from '../src/motion-plan.mjs';
import {motionSceneModel} from '../src/motion-render.mjs';
const plan={accent:'0x147d82',contextHeader:'CHỌN NƯỚC LAU',hook:'HỎI RÕ\nRỒI HẴNG CHỌN',bodyHeading:'XEM NHÃN TRƯỚC',bodyDetail:'Hỏi đúng nhu cầu.',questions:['Cần lau chỗ nào?','Bề mặt chất liệu gì?','Có lớp phủ không?']};
const bounds=[0,90,270,360,480,600],cues=[{start:.1,end:2,text:'Mình hỏi cho rõ nha.'},{start:16,end:18,text:'Gọi số điện thoại trong bio.'}];
test('motion scenes cover the exact frame timeline and preserve phrase timing',()=>{
  const model=motionSceneModel(plan,bounds,cues);
  assert.equal(model.durationFrames,600);assert.deepEqual(model.cues,cues);
  assert.deepEqual(model.scenes.map(s=>[s.start,s.end]),[[0,3],[3,9],[9,12],[12,16],[16,20]]);
  assert.equal(model.contextHeader,plan.contextHeader);assert.equal(model.scenes[0].context,true);
  assert.equal(model.scenes[2].type,'product');assert.equal(model.scenes[4].type,'cta');
  for(const broken of [[0,90,90,360,480,600],[0,10,270,360,480,600],[0,90,270,360,480,599]])assert.throws(()=>motionSceneModel(plan,broken,cues));
  for(const broken of [[{start:0,end:21,text:'Long'}],[{start:2,end:1,text:'Backwards'}],[{start:0,end:3,text:'A'},{start:2,end:4,text:'B'}]])assert.throws(()=>motionSceneModel(plan,bounds,broken),/phrase cues/);
});
test('caption-free exports retain timing and require an explicit boolean',()=>{
  assert.equal(motionSceneModel(plan,bounds,cues).burnCaptions,true);
  const model=motionSceneModel({...plan,burnCaptions:false},bounds,cues);
  assert.equal(model.burnCaptions,false);
  assert.deepEqual(model.cues,cues);
  assert.throws(()=>motionSceneModel({...plan,burnCaptions:'false'},bounds,cues),/boolean/);
});
test('animation copy rejects internal codes, offers, workflow labels and unsupported claims before rendering',()=>{
  assert.equal(validateMotionCopy(plan),plan);
  for(const hook of ['ẢNH10024','GIỌNG10024','Bài đăng này đã được lên lịch','demo này không phải sản phẩm Sakura','Mua 1 tặng 1','Nhắn shop ngay','Diệt khuẩn tuyệt đối'])assert.throws(()=>validateMotionCopy({...plan,hook}),undefined,hook);
  assert.throws(()=>validateMotionCopy({...plan,questions:['One']}),/three/);
  assert.throws(()=>validateMotionCopy({...plan,accent:'red'}),/palette/);
});
