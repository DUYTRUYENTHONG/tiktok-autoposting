const $=id=>document.getElementById(id);
const fmt=n=>new Intl.NumberFormat('vi-VN').format(n);
const percent=n=>n===null||n===undefined?'Chưa có':`${(n*100).toFixed(1)}%`;
const element=(tag,text,cls)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;};
let current;
function render(data){
  current=data;const a=data.analysis;$('account').textContent=`@${data.account}`;
  const newTime=a.lastObservedAt?new Date(a.lastObservedAt).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'}):'Chưa có quan sát TikTok';
  $('freshness').textContent=`Số liệu: ${newTime}`;$('updated').textContent=`Cập nhật ${new Date().toLocaleTimeString('vi-VN')}`;
  const k=data.dailyKpi;
  const cards=[['Lượt xem đã ghi nhận',a.totalViews,'Snapshot mới nhất, không cộng trùng'],['Bài đã theo dõi',a.totalPosts,`${a.unattributed} bài chưa gắn góc nội dung`],['Giả thuyết nội dung',data.angles.length,'Chưa mặc định là góc thắng'],[`Đăng hôm nay · mục tiêu ${k?.target??20}`,k?.published??0,`${k?.scheduled??0} đã hẹn hôm nay · ${k?.underReview??0} đang xét duyệt · UTC+7`]];
  $('overview').replaceChildren(...cards.map(([label,value,detail])=>{const card=element('article',undefined,'stat');card.append(element('div',label,'stat-label'),element('div',fmt(value),'stat-value'),element('div',detail,'stat-detail'));return card;}));
  $('campaign-summary').textContent=data.products.length?`${data.products.map(p=>p.name).join(' · ')}. ${data.campaign?.area??data.products[0].area}. ${data.campaign?.scaleCampaign?'500 carousel + 500 video, nội dung tiếng Việt.':'Ưu tiên carousel ảnh, nội dung tiếng Việt.'}`:'Chờ nhập thư mục sản phẩm.';
  $('campaign-offer').textContent=data.campaign?.scaleCampaign?'Bản mới chỉ hiển thị ưu đãi khi đã xác minh đủ điều kiện.':data.campaign?.offer??'Chưa xác nhận ưu đãi';
  $('allocation').textContent=`${a.allocation}. Lead đủ thông tin đã ghi nhận: ${data.leadSummary?.qualified??'Chưa thu thập'}.`;$('measurement').textContent=a.measurement;
  $('connections').replaceChildren(...Object.values(data.connections).map(t=>element('li',t)));
  const selected=$('product-filter').value;
  $('product-filter').replaceChildren(element('option','Tất cả'));
  $('product-filter').firstChild.value='';
  for(const p of data.products){const option=element('option',p.name);option.value=p.id;$('product-filter').append(option);}
  $('product-filter').value=selected;renderAngles();
  $('schedule-basis').textContent=`${data.schedule.basis} · UTC+7`;
  $('slots').replaceChildren(...data.schedule.slots.map(s=>{const node=element('div',`${String(s.hour).padStart(2,'0')}:00`,'slot');node.append(element('small',s.weekday===null?'Khung giờ thử nghiệm':s.weekday===0?'Chủ nhật':`Thứ ${s.weekday+1}`));return node;}));
  const queue=data.queue??[];const published=queue.filter(p=>p.status==='published'&&p.receipt?.publishedVerifiedAt).length;
  const scheduled=queue.filter(p=>p.status==='scheduled'&&p.receipt?.scheduledVerifiedAt).length;
  const prepared=queue.filter(p=>p.assetsVerified).length;
  const review=queue.filter(p=>p.status==='under_review').length;
  const scale=data.campaign?.scaleCampaign;$('scale-campaign').hidden=!scale;
  if(scale){
    const items=queue.filter(q=>q.campaignId===scale.campaignId);
    const live=items.filter(q=>q.status==='published'&&q.receipt?.publishedVerifiedAt).length;
    const booked=items.filter(q=>q.status==='scheduled'&&q.receipt?.scheduledVerifiedAt).length;
    const pending=items.filter(q=>['under_review','submitting','needs_review'].includes(q.status)).length;
    const ready=items.filter(q=>q.status==='ready'&&q.assetsVerified&&!q.receipt).length;
    const target=(scale.counts?.photo??500)+(scale.counts?.video??500);
    $('scale-dates').textContent=`${scale.startDay} → ${scale.endDay} · UTC+7 · Tối đa 20 bài/ngày, 10 mỗi định dạng, gồm lịch đang giữ.`;
    $('scale-counts').replaceChildren(...[[Math.max(0,target-live-booked-pending-ready),'Chờ sản xuất / duyệt'],[ready,'Đủ điều kiện cục bộ'],[booked,'TikTok đã hẹn'],[pending,'Chờ đối soát / xét duyệt'],[live,'Đã xuất bản']].map(([n,label])=>{const node=element('div');node.append(element('strong',fmt(n)),element('span',label));return node;}));
    $('scale-policy').textContent='Kế hoạch không phải bài đã hẹn. Chỉ biên nhận TikTok mới được tính đã hẹn/xuất bản. Chưa có sổ đơn xác minh ưu đãi: bản mới không hiển thị giảm giá. Nội dung và giọng mới cần được kiểm tra; lượt xem không phải đơn hàng.';
  }
  $('queue-counts').replaceChildren(...[[queue.length,'Ý tưởng trong hàng đợi'],[prepared,'Đủ ảnh đã kiểm tra'],[scheduled,'Đã hẹn, có biên nhận'],[review,'TikTok đang xét duyệt'],[published,'Đã xuất bản']].map(([n,t])=>{const node=element('div');node.append(element('strong',fmt(n)),element('span',t));return node;}));
  $('progress-fill').style.width=`${Math.min(published,100)}%`;$('progress-fill').parentElement.setAttribute('aria-valuenow',String(Math.min(published,100)));
  $('briefs').replaceChildren(...data.angles.map(a=>{const d=element('details');d.append(element('summary',a.name),element('p',a.hookA),element('p',a.imagePrompt),element('p',a.videoPrompt));return d;}));
}
function renderAngles(){
  const rows=current.analysis.angles.filter(a=>!$('product-filter').value||a.productId===$('product-filter').value);
  $('angle-empty').hidden=rows.length>0;
  $('angle-rows').replaceChildren(...rows.map(a=>{
    const row=element('tr');const name=element('td',a.name);name.append(element('small',a.id));
    const status=element('td');status.append(element('span',a.signal,`badge ${a.signal==='Tín hiệu tốt'?'good':''}`));
    row.append(name,element('td',String(a.posts)),element('td',fmt(a.views)),element('td',percent(a.engagementRate)),element('td',a.uplift===null?'Chưa có':`${a.uplift>=0?'+':''}${percent(a.uplift)}`),status);return row;
  }));
}
let loading=false;
async function refresh(){if(loading)return;loading=true;try{const response=await fetch('/api/state');if(!response.ok)throw new Error('Không thể cập nhật dữ liệu');render(await response.json());$('error').hidden=true;}catch(e){$('error').textContent=`${e.message}. Dữ liệu trên màn hình có thể đã cũ.`;$('error').hidden=false;}finally{loading=false;}}
$('product-filter').addEventListener('change',renderAngles);$('refresh').addEventListener('click',refresh);refresh();setInterval(()=>{if(!document.hidden)refresh();},15000);
