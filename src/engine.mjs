export const emptyState = () => ({version:1,account:'saigomlia',language:'vi',products:[],angles:[],posts:[],snapshots:[],evidence:[],audience:null,updatedAt:null});
const requireValue = (ok, message) => { if(!ok) throw new Error(message); };
export function timestamp(value) {
  requireValue(typeof value==='string' && /(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value)), 'Thời gian phải theo ISO 8601 và có múi giờ');
  return Date.parse(value);
}
export function validateImport(input, state=emptyState()) {
  requireValue(input && typeof input==='object' && !Array.isArray(input),'Dữ liệu phải là một đối tượng JSON');
  for(const key of Object.keys(input)) requireValue(['posts','snapshots','audience','evidence'].includes(key),`Trường nhập không hỗ trợ: ${key}`);
  for(const key of ['posts','snapshots','evidence']) if(input[key]!==undefined) requireValue(Array.isArray(input[key]),`${key} phải là danh sách`);
  const posts = new Map(state.posts.map(p=>[p.id,p]));
  for(const p of input.posts??[]) {
    requireValue(typeof p.id==='string' && p.id.length>0,'Bài đăng cần id');
    timestamp(p.publishedAt);
    requireValue(['video','photo'].includes(p.format),'Định dạng phải là video hoặc photo');
    if(p.angleId) requireValue(state.angles.some(a=>a.id===p.angleId && a.productId===p.productId),'Góc nội dung không khớp sản phẩm');
    if(p.productId) requireValue(state.products.some(x=>x.id===p.productId),'Sản phẩm chưa được nhập');
    const previous=posts.get(p.id);
    if(previous) requireValue(['productId','angleId','format','publishedAt'].every(k=>previous[k]===p[k]),'Không được thay đổi định danh hoặc cohort của bài đã nhập');
    posts.set(p.id,p);
  }
  for(const s of input.snapshots??[]) {
    requireValue(posts.has(s.postId),'Snapshot tham chiếu bài chưa được nhập');
    requireValue(timestamp(s.observedAt)>=timestamp(posts.get(s.postId).publishedAt),'Snapshot có trước thời điểm đăng');
    requireValue(typeof s.source==='string' && s.source.trim().length>0,'Snapshot cần nguồn số liệu');
    for(const key of ['views','likes','comments','shares','saves']) {
      if(key==='views'||s[key]!==undefined) requireValue(Number.isSafeInteger(s[key]) && s[key]>=0,`Chỉ số ${key} phải là số nguyên không âm`);
    }
    for(const key of ['completionRate','retention3s']) if(s[key]!==undefined) requireValue(Number.isFinite(s[key])&&s[key]>=0&&s[key]<=1,`${key} phải trong khoảng 0–1`);
  }
  if(input.audience) {
    const a=input.audience;
    timestamp(a.observedAt);
    requireValue(typeof a.source==='string'&&a.source.trim().length>0,'Dữ liệu người xem cần nguồn');
    requireValue(['Asia/Ho_Chi_Minh','Asia/Bangkok'].includes(a.timezone),'Chuẩn hóa giờ người xem sang UTC+7 trước khi nhập');
    requireValue(Array.isArray(a.slots)&&a.slots.length>0,'Dữ liệu người xem cần khung giờ');
    const keys=new Set();
    for(const s of a.slots) {
      requireValue(Number.isInteger(s.weekday)&&s.weekday>=0&&s.weekday<=6&&Number.isInteger(s.hour)&&s.hour>=0&&s.hour<=23&&Number.isFinite(s.active)&&s.active>=0,'Khung giờ người xem không hợp lệ');
      const key=`${s.weekday}:${s.hour}`;
      requireValue(!keys.has(key),'Khung giờ người xem bị trùng'); keys.add(key);
    }
  }
  for(const e of input.evidence??[]) {
    requireValue(typeof e.id==='string'&&typeof e.summary==='string'&&['paid','organic','first-party'].includes(e.context),'Bằng chứng cần id, summary và context');
    const url=new URL(e.url); requireValue(['https:','http:'].includes(url.protocol),'URL bằng chứng không hợp lệ');
    timestamp(e.accessedAt);
  }
  return input;
}
export function mergeImport(state,input) {
  validateImport(input,state);
  const merge=(a,b,key)=>[...new Map([...a,...b].map(x=>[key(x),x])).values()];
  return {...state,posts:merge(state.posts,input.posts??[],x=>x.id),snapshots:merge(state.snapshots,input.snapshots??[],x=>`${x.postId}:${x.observedAt}`),evidence:merge(state.evidence,input.evidence??[],x=>x.id),audience:input.audience??state.audience};
}
function latestSnapshots(state,eligibleOnly=false) {
  const posts=new Map(state.posts.map(p=>[p.id,p])); const latest=new Map();
  for(const s of state.snapshots) {
    const p=posts.get(s.postId); if(!p)continue;
    const age=(Date.parse(s.observedAt)-Date.parse(p.publishedAt))/3600000;
    if(eligibleOnly&&(age<24||age>72))continue;
    if(!latest.has(s.postId)||Date.parse(s.observedAt)>Date.parse(latest.get(s.postId).observedAt))latest.set(s.postId,s);
  }
  return latest;
}
export function analyze(state) {
  const latest=latestSnapshots(state); const eligible=latestSnapshots(state,true);
  const aggregate=posts=>{
    const rows=posts.map(p=>eligible.get(p.id)).filter(Boolean);
    const views=rows.reduce((n,s)=>n+s.views,0);
    const complete=rows.filter(s=>['likes','comments','shares','saves'].every(k=>Number.isFinite(s[k])));
    const completeViews=complete.reduce((n,s)=>n+s.views,0);
    const interactions=complete.reduce((n,s)=>n+s.likes+s.comments+s.shares+s.saves,0);
    return {posts:rows.length,completePosts:complete.length,views,engagementRate:completeViews?interactions/completeViews:null};
  };
  const angles=state.angles.map(a=>{
    const candidates=state.posts.filter(p=>p.angleId===a.id&&p.productId===a.productId);
    // Format cohorts are never mixed. Generic briefs default to video.
    const format=a.format??'video';
    const own=aggregate(candidates.filter(p=>p.format===format));
    const control=aggregate(state.posts.filter(p=>p.productId===a.productId&&p.angleId&&p.angleId!==a.id&&p.format===format));
    let signal='Chưa đủ dữ liệu'; let uplift=null;
    if(own.posts>=3&&own.completePosts>=3&&own.views>=500){
      signal='Chưa có đối chứng';
      if(control.posts>=3&&control.completePosts>=3&&control.views>=500&&control.engagementRate>0){
        uplift=own.engagementRate/control.engagementRate-1;
        signal=uplift>=0.2?'Tín hiệu tốt':uplift<=-0.2?'Cần cải thiện':'Tiếp tục thử nghiệm';
      }
    }
    return {...a,...own,controlPosts:control.posts,uplift,signal};
  });
  const newest=[...latest.values()].map(s=>s.observedAt).sort((a,b)=>Date.parse(b)-Date.parse(a))[0]??null;
  return {angles,totalPosts:state.posts.length,totalViews:[...latest.values()].reduce((n,s)=>n+s.views,0),unattributed:state.posts.filter(p=>!p.angleId).length,lastObservedAt:newest,allocation:angles.some(a=>a.signal==='Tín hiệu tốt')?'70% góc có tín hiệu · 30% thử nghiệm':'Chia đều các giả thuyết để lấy dữ liệu',measurement:'Tương tác / lượt xem; cửa sổ quan sát 24–72 giờ; tín hiệu vận hành, chưa phải kết luận nhân quả'};
}
export function recommendSlots(state,now=new Date()) {
  const a=state.audience; const age=a?(now-Date.parse(a.observedAt))/86400000:Infinity;
  if(a&&age>=0&&age<=28&&a.slots.some(s=>s.active>0))return {basis:`Hoạt động người xem · ${a.source}`,timezone:a.timezone,observedAt:a.observedAt,slots:[...a.slots].sort((x,y)=>y.active-x.active).slice(0,3),automatic:false};
  return {basis:'Thử nghiệm, chưa có dữ liệu người xem',timezone:'Asia/Ho_Chi_Minh',observedAt:a?.observedAt??null,slots:[{weekday:null,hour:12,active:null},{weekday:null,hour:19,active:null},{weekday:null,hour:21,active:null}],automatic:false};
}
const patterns=[
  ['van-de','Một tình huống quen thuộc','Bạn có gặp tình huống này khi dùng {name}?','Nêu một vấn đề thật rồi trình bày giải pháp; cần xác minh công dụng.'],
  ['huong-dan','Hướng dẫn sử dụng','Dùng {name} thế nào cho đúng?','Quay từng bước theo hướng dẫn của nhà sản xuất.'],
  ['lua-chon','Giúp khách chọn đúng','Trước khi chọn {name}, hãy kiểm tra điều này.','Giải thích tiêu chí chọn từ thông tin sản phẩm đã xác minh.'],
  ['giai-dap','Gỡ băn khoăn','Điều bạn muốn biết trước khi mua {name}.','Trả lời một câu hỏi khách hàng có nguồn; không bịa câu hỏi phổ biến.'],
  ['can-canh','Cận cảnh sản phẩm','Xem kỹ {name} trước khi quyết định.','Quay bao bì, kích thước và chi tiết thật; không dựng kết quả thử nghiệm.'],
  ['dia-phuong','Bối cảnh địa phương','Bạn ở {area} và đang tìm hiểu {name}?','Nêu bối cảnh địa phương; chỉ nói giao hàng khi có xác nhận.']
];
export function buildBriefs(state) {
  return state.products.flatMap(p=>patterns.map(([key,name,hook,proof])=>{
    const text=hook.replaceAll('{name}',p.name).replaceAll('{area}',p.area||'khu vực của bạn');
    return {id:`${p.id}-${key}`,productId:p.id,name,hookA:text,hookB:`Một góc nhìn khác về ${p.name}: bạn cần biết gì?`,status:'Giả thuyết chưa được kiểm chứng',proofRequired:proof,cta:'Nhắn tin để hỏi thông tin phù hợp với nhu cầu của bạn.',
      imagePrompt:`Tạo ảnh sản phẩm dọc 9:16, bối cảnh đời thường tại ${p.area||'Việt Nam'}. Sản phẩm: ${p.name}. Bám sát ảnh tham chiếu thật, giữ đúng bao bì, nhãn, màu sắc và tỷ lệ. Góc nội dung: ${name}. Chừa vùng trống cho tiêu đề tiếng Việt đặt ở bước hậu kỳ. Không bịa chứng nhận, giá, ưu đãi hoặc hình ảnh trước/sau. Chưa có ảnh tham chiếu thì dừng tạo ảnh sản phẩm.`,
      videoPrompt:`Video dọc 9:16 dài 20–25 giây, toàn bộ lời nói và phụ đề bằng tiếng Việt. 0–3 giây: ${text} 3–15 giây: ${proof} 15–20 giây: cận cảnh sản phẩm thật. 20–25 giây: lời mời nhắn tin. Dùng cảnh quay hoặc ảnh sản phẩm được cung cấp; không dựng lời chứng thực hay bằng chứng công dụng. Giữ chữ cách mép và kiểm tra dấu tiếng Việt.`,
      researchQueries:[`${p.name} ${p.area} khách hàng thắc mắc`,`${p.name} cách dùng đánh giá Việt Nam`,`${p.name} TikTok Creative Center Việt Nam`],evidenceIds:[],assets:p.assets.map(x=>x.path)};
  }));
}
