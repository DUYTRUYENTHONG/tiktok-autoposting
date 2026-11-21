import test from 'node:test';
import assert from 'node:assert/strict';
import {containsDiscount} from '../src/scale-campaign.mjs';

test('the supplied99-percent cleaning commitment is not a price promotion',()=>{
 for(const text of [
  'Sakura cam kết sạch 99% vết bẩn. Dùng không như quảng cáo, cam kết hoàn tiền.',
  'SAKURA CAM KẾT SẠCH99%VẾT BẨN.',
 ])assert.equal(containsDiscount(text),false,text);
});

test('price promotions and unexplained percentages still require offer eligibility',()=>{
 for(const text of [
  'Mua 1 tặng 1 cho 50 khách hàng đầu tiên.',
  'Sakura cam kết sạch 99% vết bẩn. Giảm 20% hôm nay.',
  'Sakura cam kết sạch 99% vết bẩn. Miễn phí giao hàng.',
  'Ưu đãi 99%', '99%', 'Cam kết sạch 100% vết bẩn.',
  'Cam kết sạch 99.5% vết bẩn.',
 ])assert.equal(containsDiscount(text),true,text);
});
