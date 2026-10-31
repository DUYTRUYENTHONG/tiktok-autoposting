import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,utimes,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {campaignSources} from '../src/knowledge/campaign-sources.mjs';
import {buildIndex,persistIndex,createKnowledgePipeline} from '../src/knowledge/index.mjs';
import {root} from '../src/store.mjs';

const at='2026-10-31T03:00:00Z',policyTime='2026-10-31T02:00:00Z';
async function fixture(){
  const dir=await mkdtemp(path.join(os.tmpdir(),'knowledge-evergreen-'));
  await mkdir(path.join(dir,'docs'));await mkdir(path.join(dir,'state'));
  for(const name of ['FOOTAGE_EDITING.md','CAMPAIGN_GOAL.md']){
    const file=path.join(dir,'docs',name);await writeFile(file,await readFile(path.join(root,'docs',name),'utf8'));await utimes(file,new Date(policyTime),new Date(policyTime));
  }
  await writeFile(path.join(dir,'state','cta-policy.json'),JSON.stringify({primaryCta:'Gọi số điện thoại trong bio để được tư vấn',publicPostCodes:false,userFacingPostCodes:false,secondaryEnabled:false,updatedAt:'2026-10-29T03:57:01.121Z',privateNumber:'DO-NOT-IMPORT-CTA-PRIVATE'}));
  const campaign={products:[{id:'sakura-cleaner-500ml',name:'Nước lau đa năng Sakura 500 ml',facts:{volume:'500 ml',volumeSource:'Ảnh nhãn sản phẩm được cung cấp',offer:'DO-NOT-IMPORT-LEGACY',claimsVerified:false},assets:[{path:'DO-NOT-IMPORT-ASSET'}]}],campaign:{currentPromotion:{key:'buy1-get1-tiktok-first50',verifiedAt:'2026-10-28T02:36:21.386Z',visuallyVerified:true,remainingOrders:null,redeemedOrders:null,offerAsset:{path:'DO-NOT-IMPORT-OFFER'}},orderLedger:null},queue:[{caption:'DO-NOT-IMPORT-QUEUE'}],messages:['DO-NOT-IMPORT-MESSAGE']};
  const file=path.join(dir,'campaign.json');
  return {dir,campaign,file,async sources(){await writeFile(file,JSON.stringify(campaign));return campaignSources(file,{policyRoot:dir});},async clean(){await rm(dir,{recursive:true,force:true});}};
}
const ask=query=>({query,productId:'sakura-cleaner-500ml',promotionKey:'evergreen-no-discount',asOf:at});

test('campaign ingestion is evergreen with missing, unknown or stale offer/redemption evidence; never renews label QA',async()=>{
  const f=await fixture();try{
    for(const offer of [undefined,f.campaign.campaign.currentPromotion,{key:'other',verifiedAt:'2020-01-01T00:00:00Z',remainingOrders:49}]){
      f.campaign.campaign.currentPromotion=offer;f.campaign.campaign.orderLedger={verified:true,remainingOrders:49,verifiedAt:'2020-01-01T00:00:00Z'};
      const sources=await f.sources(),index=buildIndex(sources),chain=createKnowledgePipeline(index);
      assert.equal(sources.length,5);assert.ok(sources.every(s=>s.promotionKey==='*'&&!s.claimFields.includes('offer')));
      assert.equal(sources.find(s=>s.section==='identity').verifiedAt,'2026-10-28T02:36:21.386Z');
      assert.ok(sources.find(s=>s.section==='current-promotion-policy').timestampBasis.includes('not offer/redemption verification'));
      assert.doesNotMatch(JSON.stringify(sources),/DO-NOT-IMPORT|Mua 1 tặng 1|50 đơn đầu tiên/);
      for(const query of ['Ưu đãi Sakura TikTok hiện tại?','Còn lại bao nhiêu đơn?','Sakura giá bao nhiêu?','Mua một tặng một còn áp dụng không?']){
        const result=await chain.invoke(ask(query));assert.equal(result.status,'abstained',query);assert.equal(result.prompt,null);
      }
      assert.equal((await chain.invoke({...ask('Ưu đãi TikTok'),promotionKey:'buy1-get1-tiktok-first50'})).status,'abstained');
    }
  }finally{await f.clean();}
});

test('actual LangChain evergreen identity, call CTA and latest editorial retrieval stay source-cited and idempotent',async()=>{
  const f=await fixture();try{
    const sources=await f.sources(),first=await persistIndex(sources,path.join(f.dir,'index'));
    assert.equal((await persistIndex(await f.sources(),path.join(f.dir,'index'))).changed,false);
    const chain=createKnowledgePipeline(first.index);
    for(const [query,id,copy] of [
      ['Dung tích Sakura?','sakura:identity:500ml',/500 ml/],
      ['CTA gọi số điện thoại trong bio','sakura:policy:call-only-cta',/Gọi số điện thoại trong bio/],
      ['Chính sách video footage và giọng?','sakura:editorial:footage-video-policy',/20 verified public posts/],
      ['Chính sách evergreen','sakura:policy:evergreen',/không in hoặc đọc/],
    ]){const result=await chain.invoke(ask(query));assert.equal(result.mode,'retrieval-and-prompt-only');assert.equal(result.status,'retrieved',query);assert.ok(result.sources.some(s=>s.id===id));assert.match(result.prompt,copy);}
    const identity=sources.find(s=>s.section==='identity');await utimes(path.join(f.dir,'docs','CAMPAIGN_GOAL.md'),new Date(at),new Date(at));
    assert.equal((await f.sources()).find(s=>s.section==='identity').verifiedAt,identity.verifiedAt);
    assert.equal((await chain.invoke({...ask('Dung tích Sakura?'),asOf:'2026-11-05T03:00:00Z'})).status,'abstained');
  }finally{await f.clean();}
});

test('changed label, reviewed editorial section or call-only policy fail closed',async()=>{
  const f=await fixture();try{
    f.campaign.products[0].facts.volume='750 ml';await assert.rejects(f.sources(),/label evidence/);f.campaign.products[0].facts.volume='500 ml';
    const file=path.join(f.dir,'docs','FOOTAGE_EDITING.md'),original=await readFile(file,'utf8');await writeFile(file,original.replace('Thùy Dung','Changed voice'));await assert.rejects(f.sources(),/facts changed/);await writeFile(file,original);
    const ctaFile=path.join(f.dir,'state','cta-policy.json'),cta=JSON.parse(await readFile(ctaFile,'utf8'));await writeFile(ctaFile,JSON.stringify({...cta,publicPostCodes:true}));await assert.rejects(f.sources(),/CTA policy/);
  }finally{await f.clean();}
});

test('knowledge CLI defaults to evergreen rather than the retired offer and cannot authorize unknown discounts',async()=>{
  const f=await fixture();try{
    const directory=path.join(f.dir,'cli-index');await persistIndex(await f.sources(),directory);
    const run=query=>spawnSync(process.execPath,['scripts/knowledge.mjs','query',query],{cwd:root,encoding:'utf8',env:{...process.env,TIKTOK_KNOWLEDGE_DIR:directory}});
    const identity=run('Dung tích Sakura?');assert.equal(identity.status,0,identity.stderr);const result=JSON.parse(identity.stdout);
    assert.equal(result.status,'retrieved');assert.match(result.prompt,/Ưu đãi: evergreen-no-discount/);assert.doesNotMatch(result.prompt,/buy1-get1-tiktok-first50/);
    const offer=run('Ưu đãi Sakura TikTok hiện tại?');assert.equal(offer.status,0,offer.stderr);assert.equal(JSON.parse(offer.stdout).status,'abstained');
  }finally{await f.clean();}
});
