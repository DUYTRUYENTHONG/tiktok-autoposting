const timezone='Asia/Ho_Chi_Minh';
export function vietnamDay(value){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(value));
  const get=key=>parts.find(p=>p.type===key).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function dailyKpi(state,day=vietnamDay(new Date())){
  let target=state.campaign?.dailyTarget??20;
  const schedule=state.campaign?.dailyTargetSchedule;
  if(schedule){
    const validDay=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/u.test(value)&&Number.isFinite(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
    if(!validDay(schedule.fromDay)||!validDay(schedule.throughDay)||schedule.fromDay>schedule.throughDay||!Number.isInteger(schedule.target)||schedule.target<1||schedule.target>100)throw Error('Invalid dated daily target policy');
    if(day>=schedule.fromDay&&day<=schedule.throughDay)target=schedule.target;
  }
  const sameDay=value=>value&&Number.isFinite(Date.parse(value))&&vietnamDay(value)===day;
  const published=new Set(),scheduled=new Set(),underReview=new Set();
  for(const q of state.queue??[]){
    const r=q.receipt;if(!r?.platformId)continue;
    if(q.status==='published'&&r.publishedVerifiedAt&&sameDay(r.publishedAt))published.add(r.platformId);
    if(q.status==='scheduled'&&r.scheduledVerifiedAt&&sameDay(r.scheduledAt))scheduled.add(r.platformId);
    if(q.status==='under_review'&&sameDay(r.submittedVerifiedAt))underReview.add(r.platformId);
  }
  for(const id of published){scheduled.delete(id);underReview.delete(id);}
  for(const id of scheduled)underReview.delete(id);
  return {day,timezone,target,published:published.size,scheduled:scheduled.size,underReview:underReview.size,toPublish:Math.max(0,target-published.size),toPrepare:Math.max(0,target-published.size-scheduled.size-underReview.size)};
}
export function planDailySlots(state,day,now=new Date()){
  const uncertain=(state.queue??[]).filter(q=>['submitting','needs_review'].includes(q.status));
  if(uncertain.length)return {day,slots:[],blockedBy:uncertain.map(q=>q.id),basis:'Cần đối soát bài chưa rõ kết quả trước khi lập lịch mới.'};
  const progress=dailyKpi(state,day),reserved=(state.queue??[]).filter(q=>q.status==='scheduled'&&q.receipt?.scheduledVerifiedAt&&vietnamDay(q.receipt.scheduledAt)===day).map(q=>Date.parse(q.receipt.scheduledAt));
  const start=Date.parse(`${day}T08:00:00+07:00`),end=Date.parse(`${day}T22:15:00+07:00`);
  const candidates=[];
  for(let t=start;t<=end;t+=5*60000)if(t>=Number(now)+30*60000&&!reserved.some(r=>Math.abs(r-t)<20*60000))candidates.push(t);
  const chosen=[];
  for(let i=0;i<progress.toPrepare&&candidates.length;i++){
    const target=progress.toPrepare===1?candidates[0]:candidates[0]+(candidates.at(-1)-candidates[0])*i/(progress.toPrepare-1);
    const options=candidates.filter(t=>!chosen.some(c=>Math.abs(c-t)<20*60000));
    if(!options.length)break;
    chosen.push(options.reduce((best,t)=>Math.abs(t-target)<Math.abs(best-target)?t:best));
  }
  const slots=chosen.sort((a,b)=>a-b).map(t=>new Date(t+7*3600000).toISOString().slice(0,19)+'+07:00');
  return {day,slots,shortfall:Math.max(0,progress.toPrepare-slots.length),basis:'Khung giờ thử nghiệm 08:00–22:15; trừ lịch đã giữ, cách nhau tối thiểu20 phút; chưa phải giờ tối ưu đã xác minh.'};
}
export function leadSummary(state,day){
  const events=(state.leadEvents??[]).filter(e=>!day||vietnamDay(e.firstSeenAt)===day);
  if(!events.length)return {inquiries:null,qualified:null,orders:null,basis:'Chưa thu thập lead được gắn nguồn bài.'};
  return {inquiries:events.length,qualified:events.filter(e=>['qualified','order'].includes(e.status)).length,orders:events.filter(e=>e.status==='order').length,basis:'Chỉ các liên hệ đã quan sát và gắn nguồn; không phải toàn bộ hộp thư.'};
}
