import test from 'node:test';import assert from 'node:assert/strict';
import {observedScalePromotion} from '../src/scale-progress.mjs';
test('observed promotion uses bound actual creative, preserving customer/order distinction',()=>{
 const bound={boundCreative:{offerReview:{containsDiscount:true,conditionalOfferDisclosureVerified:true,containsRemainingCountClaim:false},contactOfferLedger:{path:'private-ledger',sha256:'hash'}}};
 assert.deepEqual(observedScalePromotion(bound),{promotionKey:'buy1-get1-first50-tiktok-contacts',discountIncluded:true});
 bound.boundCreative.offerReview.containsDiscount=false;
 assert.deepEqual(observedScalePromotion(bound),{promotionKey:'evergreen-no-discount',discountIncluded:false});
 delete bound.boundCreative.offerReview.containsDiscount;
 assert.deepEqual(observedScalePromotion(bound),{promotionKey:'unknown',discountIncluded:null});
 bound.boundCreative.offerReview.containsDiscount=true;delete bound.boundCreative.contactOfferLedger;
 assert.deepEqual(observedScalePromotion(bound),{promotionKey:'unknown',discountIncluded:true});
});
