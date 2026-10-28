// A recommendation is not evidence of a Vietnam trend or commercial clearance.
export function selectMusic(candidates,history,{now=new Date(),mood}={}){
  const used=new Set(history.slice(-19).map(m=>m.soundId));
  const valid=candidates.filter(m=>/^\d+$/.test(m.soundId??'')&&m.title&&m.region==='VN'&&m.businessUseVerified===true&&m.availableInAccount===true&&Number.isInteger(m.trendRank)&&m.trendRank>0&&
    /^https:\/\/(?:ads|www)\.tiktok\.com\//.test(m.sourceUrl??'')&&Number.isFinite(Date.parse(m.checkedAt))&&Date.parse(m.checkedAt)<=Number(now)&&Number(now)-Date.parse(m.checkedAt)<=7*86400000&&!used.has(m.soundId));
  valid.sort((a,b)=>Number(Boolean(b.moods?.includes(mood)))-Number(Boolean(a.moods?.includes(mood)))||a.trendRank-b.trendRank);
  return valid[0]?{...valid[0],status:'selected_needs_ui_verification'}:{status:'needs_selection',reason:'No fresh, distinct Vietnam trend with verified commercial use and account availability. Inspect the native picker; do not invent a track or repeat the previous sound.'};
}
