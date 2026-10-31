// Exact user-approved dated cadence. This grants no media or native schedule approval.
export const tenDayReference='2026-10-31 user:50posts/day for next10days; keep50/day and allow shorter spacing in call_d82047ce29ae414c8c593e085ae320aa';
export function isTenDayPolicy(p){return p?.startDay==='2026-11-01'&&p.endDay==='2026-11-10'&&p.dailyTotal===50&&p.targetTotal===500&&p.targetPhoto===50&&p.targetVideo===0&&p.minSpacingMinutes===15&&p.policyReference===tenDayReference;}
export function rollingLimits(state,at){
 const goal=state.campaign?.rollingGoal;
 if(goal?.policyReference===tenDayReference){
  const day=String(at).slice(0,10);
  if(goal.dailyTarget!==50||goal.minSpacingMinutes!==15||day<goal.startDay||day>goal.endDay)throw Error('Outside current ten-day cadence');
  return {cap:50,spacingMinutes:15};
 }
 return {cap:goal?.dailyTarget===20?20:30,spacingMinutes:20};
}
