// Exact user-approved dated cadence. This grants no media or native schedule approval.
export const tenDayReference='2026-10-31 user:50posts/day for next10days; keep50/day and allow shorter spacing in call_d82047ce29ae414c8c593e085ae320aa';
export function isTenDayPolicy(p){return p?.startDay==='2026-11-01'&&p.endDay==='2026-11-10'&&p.dailyTotal===50&&p.targetTotal===500&&p.targetPhoto===50&&p.targetVideo===0&&p.minSpacingMinutes===15&&p.policyReference===tenDayReference;}
export const videoRolloutReference='2026-11-01 user: Actual video posts; schedule50posts for today and the next20days';
export function isVideoRolloutPolicy(p){return p?.startDay==='2026-11-01'&&p.endDay==='2026-11-21'&&p.dailyTotal===50&&p.targetTotal===1050&&p.targetPhoto===0&&p.targetVideo===50&&p.minSpacingMinutes===15&&p.policyReference===videoRolloutReference;}
export const mixedRolloutReference='2026-11-01 user: free only for3videos;30carousels and17redesigned videos, within50posts/day';
export function isMixedRolloutPolicy(p){return p?.startDay==='2026-11-01'&&p.endDay==='2026-11-21'&&p.dailyTotal===50&&p.targetTotal===1050&&p.targetPhoto===30&&p.targetVideo===20&&p.minSpacingMinutes===15&&p.policyReference===mixedRolloutReference;}
export function rollingLimits(state,at){
 const goal=state.campaign?.rollingGoal;
 if([tenDayReference,videoRolloutReference,mixedRolloutReference].includes(goal?.policyReference)){
  const day=String(at).slice(0,10);
  const expectedEnd=goal.policyReference===tenDayReference?'2026-11-10':'2026-11-21';
  if(goal.dailyTarget!==50||goal.minSpacingMinutes!==15||goal.startDay!=='2026-11-01'||goal.endDay!==expectedEnd||day<goal.startDay||day>goal.endDay)throw Error('Outside current dated cadence');
  return {cap:50,spacingMinutes:15};
 }
 return {cap:goal?.dailyTarget===20?20:30,spacingMinutes:20};
}
