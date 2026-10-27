import test from 'node:test';
import assert from 'node:assert/strict';
import {planSakura} from '../src/sakura.mjs';
test('100-post plan excludes fabric spray and never invents completed posts',()=>{
  const source={sets:[{id:'01_gioi_thieu',ref:'clean',title:'Làm quen',caption:'Sakura',tags:'#Sakura',slides:[]},{id:'10_xa_vai',ref:'fabric',title:'Xả vải',slides:[]}]};
  const result=planSakura(source,{id:'sakura',assets:[],name:'Sakura',area:'TP.HCM'});
  assert.equal(result.queue.length,100);assert.equal(new Set(result.queue.map(p=>p.id)).size,100);
  assert.equal(result.queue.some(p=>p.angleId.includes('xa-vai')),false);
  assert.ok(result.queue.every(p=>!p.assetsVerified&&!p.receipt&&!p.publishAt));
  assert.ok(result.queue.every(p=>p.caption.includes('Mua 1 tặng 1, chỉ khi mua qua TikTok')));
  assert.ok(result.queue.every(p=>p.format==='photo'));
  assert.equal(result.queue.filter(p=>p.phase==='pilot').length,20);
});
