import {vietnamDay} from './daily-kpi.mjs';
const validTime=x=>typeof x==='string'&&/T.*(?:Z|[+-]\d\d:\d\d)$/u.test(x)&&Number.isFinite(Date.parse(x));
// Customer allocations are not orders or conversions. A count attestation never forecasts future capacity.
export function contactPromotionEligibility(ledger,publishAt,{now=new Date().toISOString()}={}){
 const no=reason=>({showDiscount:false,reason,requiresPublicationRecheck:true});
 if(!validTime(now)||!validTime(publishAt))throw Error('Actual publication and check timestamps required');
 const t=ledger?.terms;
 if(ledger?.campaignId!=='sakura-contact-50-november'||t?.unit!=='customers'||t.capacity!==50||t.channel!=='TikTok-origin contact'||t.startDay!=='2026-11-01'||t.endDay!=='2026-11-10')return no('Wrong customer campaign or terms');
 if(ledger.countsVerified!==true||ledger.countSource?.kind!=='user-confirmation'||!/^chat:[a-zA-Z0-9_-]+$/u.test(ledger.countSource?.reference??''))return no('Actual customer-count confirmation required');
 if(!Number.isInteger(ledger.remainingCustomers)||!Number.isInteger(ledger.allocatedCustomers)||ledger.remainingCustomers<=0||ledger.allocatedCustomers<0||ledger.remainingCustomers+ledger.allocatedCustomers!==50)return no('Customer allowance exhausted, unknown or inconsistent');
 const check=Date.parse(now),publish=Date.parse(publishAt),verified=Date.parse(ledger.countVerifiedAt);
 if(!validTime(ledger.countVerifiedAt)||verified>check||check-verified>15*60000)return no('Customer count is stale or future-dated');
 const day=vietnamDay(publishAt);if(day<t.startDay||day>t.endDay)return no('Outside authorized campaign dates');
 if(publish>check||check-publish>5*60000||vietnamDay(ledger.countVerifiedAt)!==day)return no('Fresh publication-time confirmation required; no future availability guarantee');
 return {showDiscount:true,promotionKey:'buy1-get1-first50-tiktok-contacts',unit:'customers',text:'Mua 1 tặng 1 cho 50 khách hàng đầu tiên liên hệ từ TikTok',remainingCustomers:ledger.remainingCustomers,allocatedCustomers:ledger.allocatedCustomers,verifiedAt:ledger.countVerifiedAt,source:ledger.countSource.reference,requiresPublicationRecheck:true};
}
