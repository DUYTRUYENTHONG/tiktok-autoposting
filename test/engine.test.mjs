import test from 'node:test';
import assert from 'node:assert/strict';
import { analyze, recommendSlots, validateImport, buildBriefs, emptyState } from '../src/engine.mjs';

test('empty data never creates a winner or fake engagement', () => {
  const result = analyze(emptyState());
  assert.deepEqual(result.angles, []);
  assert.equal(result.totalViews, 0);
});
test('timestamps need timezone and metrics must be nonnegative', () => {
  assert.throws(() => validateImport({posts:[{id:'p',publishedAt:'2026-10-20T12:00:00'}]}));
  assert.throws(() => validateImport({snapshots:[{postId:'p',observedAt:'2026-10-21T12:00:00Z',views:-1}]}));
});
test('unknown attribution is rejected', () => {
  assert.throws(() => validateImport({posts:[{id:'p',angleId:'missing',productId:'x',format:'video',publishedAt:'2026-10-20T12:00:00Z'}]},emptyState()));
});
test('latest eligible snapshot per post is used without double counting', () => {
  const state=emptyState();
  state.posts=[{id:'p',productId:'x',angleId:'a',format:'video',publishedAt:'2026-10-20T00:00:00Z'}];
  state.angles=[{id:'a',productId:'x',name:'Góc thử'}];
  state.snapshots=[{postId:'p',observedAt:'2026-10-21T00:00:00Z',views:100,likes:1},{postId:'p',observedAt:'2026-10-22T00:00:00Z',views:200,likes:4},{postId:'p',observedAt:'2026-10-25T00:00:00Z',views:900,likes:50}];
  const result=analyze(state);
  assert.equal(result.totalViews,900);
  assert.equal(result.angles[0].views,200);
  assert.equal(result.angles[0].signal,'Chưa đủ dữ liệu');
});
test('cross-product results cannot create a winning signal', () => {
  const state=emptyState();
  state.angles=[{id:'a',productId:'x',name:'A'},{id:'b',productId:'y',name:'B'}];
  for(let i=0;i<6;i++){
    state.posts.push({id:`p${i}`,angleId:i<3?'a':'b',productId:i<3?'x':'y',format:'video',publishedAt:'2026-10-20T00:00:00Z'});
    state.snapshots.push({postId:`p${i}`,observedAt:'2026-10-21T00:00:00Z',views:500,likes:i<3?50:1,comments:0,shares:0,saves:0});
  }
  assert.equal(analyze(state).angles[0].signal,'Chưa có đối chứng');
});
test('fresh measured audience hours beat experimental defaults', () => {
  const state=emptyState();
  state.audience={timezone:'Asia/Ho_Chi_Minh',source:'TikTok Studio',observedAt:'2026-10-27T00:00:00Z',slots:[{weekday:2,hour:20,active:100},{weekday:2,hour:12,active:20}]};
  assert.equal(recommendSlots(state,new Date('2026-10-27T02:00:00Z')).slots[0].hour,20);
  assert.equal(recommendSlots(emptyState()).basis,'Thử nghiệm, chưa có dữ liệu người xem');
  assert.match(recommendSlots(state,new Date('2026-12-01T00:00:00Z')).basis,/Thử nghiệm/);
});
test('briefs retain product and angle IDs and never invent proof', () => {
  const state=emptyState();
  state.products=[{id:'sp1',name:'Sản phẩm A',area:'TP.HCM',facts:{},assets:[]}];
  const briefs=buildBriefs(state);
  assert.ok(briefs.length>=4);
  assert.equal(briefs[0].productId,'sp1');
  assert.match(briefs[0].imagePrompt,/bao bì/);
  assert.match(briefs[0].status,/Giả thuyết/);
});
test('photo angles use photo outcomes and exclude missing engagement fields',()=>{
  const state=emptyState();state.angles=[{id:'a',productId:'x',format:'photo',name:'Ảnh'}];
  state.posts=[{id:'p',angleId:'a',productId:'x',format:'photo',publishedAt:'2026-10-20T00:00:00Z'}];
  state.snapshots=[{postId:'p',observedAt:'2026-10-21T00:00:00Z',views:500,likes:10}];
  const result=analyze(state).angles[0];assert.equal(result.views,500);assert.equal(result.engagementRate,null);
});

test('paid and unknown distributions cannot act as organic controls',()=>{
  const state=emptyState();state.angles=[{id:'a',productId:'x',format:'photo',distribution:'organic'}];
  for(let i=0;i<9;i++){
    state.posts.push({id:`d${i}`,angleId:i<3?'a':'b',productId:'x',format:'photo',distribution:i<3?'organic':i<6?'paid':undefined,publishedAt:'2026-10-20T00:00:00Z'});
    state.snapshots.push({postId:`d${i}`,observedAt:'2026-10-21T00:00:00Z',views:500,likes:10,comments:0,shares:0,saves:0});
  }
  const result=analyze(state).angles[0];assert.equal(result.posts,3);assert.equal(result.controlPosts,0);assert.equal(result.signal,'Chưa có đối chứng');
});
