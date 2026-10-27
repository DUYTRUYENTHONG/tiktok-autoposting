import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyState,mergeImport} from '../src/engine.mjs';
import {leadSummary} from '../src/daily-kpi.mjs';
test('lead updates deduplicate, retain attribution and ignore older observations',()=>{
  let state=mergeImport(emptyState(),{posts:[{id:'p',format:'photo',publishedAt:'2026-10-27T08:00:00+07:00'}]});
  const event={id:'local-contact-1',postId:'p',firstSeenAt:'2026-10-27T09:00:00+07:00',observedAt:'2026-10-27T09:00:00+07:00',status:'inquiry',source:'TikTok comment observed in browser'};
  state=mergeImport(state,{leadEvents:[event,{...event,status:'qualified',observedAt:'2026-10-27T10:00:00+07:00'}]});
  state=mergeImport(state,{leadEvents:[event]});
  assert.equal(leadSummary(state).inquiries,1);assert.equal(leadSummary(state).qualified,1);
  assert.throws(()=>mergeImport(state,{leadEvents:[{...event,firstSeenAt:'2026-10-27T09:05:00+07:00'}]}));
  assert.throws(()=>mergeImport(state,{leadEvents:[{...event,customerName:'Synthetic customer'}]}));
  assert.equal(leadSummary(emptyState()).qualified,null);
});
