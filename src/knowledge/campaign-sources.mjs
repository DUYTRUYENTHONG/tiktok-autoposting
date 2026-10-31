import {readFile, stat} from 'node:fs/promises';
import path from 'node:path';
import {hash} from './index.mjs';
import {defaultFile, root} from '../store.mjs';

// Existing reviewed label evidence, not a new inspection or a document mtime.
const labelEvidence={name:'Nước lau đa năng Sakura 500 ml',volume:'500 ml',volumeSource:'Ảnh nhãn sản phẩm được cung cấp',verifiedAt:'2026-10-28T02:36:21.386Z'};
const reviewedEditorialHash='b471a0caff0ff57de75a8dafe536cc3794e02af09c98edf441e128c61dd6547c';
const iso=v=>typeof v==='string'&&/T.*(?:Z|[+-]\d\d:\d\d)$/.test(v)&&Number.isFinite(Date.parse(v));
export function assertReviewedEditorial(text) {
  const section=text.split(/^## Verified input and editorial facts.*$/m)[1]?.split(/^## /m)[0].trim().replace(/\r\n/g,'\n');
  if(!section||hash(section)!==reviewedEditorialHash)throw new Error('Editorial facts changed: review the source, imported facts and approved section hash before reindexing');
  return section;
}
const policyLine=(text,prefix)=>{
  const lines=text.replace(/\r\n/g,'\n').split('\n').filter(line=>line.startsWith(prefix));
  if(lines.length!==1)throw Error('Current campaign policy missing/ambiguous: '+prefix);
  return lines[0].slice(2);
};

// Never import queue, receipts, customer messages, full facts, private paths,
// media, contact numbers or historical cards as current entitlement.
export async function campaignSources(file=defaultFile,{policyRoot=root,ctaFile=path.join(policyRoot,'state','cta-policy.json')}={}) {
  const campaign=JSON.parse(await readFile(file,'utf8'));
  const product=campaign.products?.find(p=>p.id==='sakura-cleaner-500ml');
  if(!product||product.name!==labelEvidence.name||product.facts?.volume!==labelEvidence.volume||product.facts.volumeSource!==labelEvidence.volumeSource)throw Error('Reviewed Sakura500ml label evidence missing/changed: review identity importer');
  const editorialFile=path.join(policyRoot,'docs','FOOTAGE_EDITING.md');
  const editorial=assertReviewedEditorial(await readFile(editorialFile,'utf8'));
  const editorialObserved=(await stat(editorialFile)).mtime.toISOString();
  const goalFile=path.join(policyRoot,'docs','CAMPAIGN_GOAL.md'),goal=await readFile(goalFile,'utf8');
  const goalObserved=(await stat(goalFile)).mtime.toISOString();
  const offerPolicy=policyLine(goal,'- New content is evergreen');
  if(!offerPolicy.includes('unless current offer eligibility is verified')||!offerPolicy.includes('Historical accepted offers remain unchanged'))throw Error('Evergreen policy changed: review eligibility importer');
  const voicePolicy=policyLine(goal,'- Use selected voice');
  const researchPolicy=policyLine(goal,'- Research is ongoing:');
  const cadencePolicy=policyLine(goal,'- October31 update:');
  const cta=JSON.parse(await readFile(ctaFile,'utf8'));
  if(cta.primaryCta!=='Gọi số điện thoại trong bio để được tư vấn'||cta.publicPostCodes!==false||cta.userFacingPostCodes!==false||cta.secondaryEnabled!==false||!iso(cta.updatedAt))throw Error('Call-only/private-code CTA policy missing or changed: review importer');
  const base={productId:product.id,verified:true,validFrom:'2026-10-28T00:00:00+07:00',validTo:null,promotionKey:'*'};
  return [
    {...base,sourceId:'sakura:identity:500ml',section:'identity',text:`Sản phẩm: ${product.name}. Dung tích: ${product.facts.volume}. Nguồn dung tích: ${product.facts.volumeSource}. Chưa có xác minh về hiệu quả làm sạch.`,
      sourceUri:'private:campaign.products[sakura-cleaner-500ml].facts (previously reviewed500ml label)',sourceHash:hash(labelEvidence),verifiedAt:labelEvidence.verifiedAt,timestampBasis:'original500ml label/card visual QA timestamp retained; no new label inspection or cleaning-efficacy test',claimFields:['identity','volume']},
    {...base,sourceId:'sakura:policy:evergreen',section:'current-promotion-policy',
      text:`Chính sách nội dung mới: evergreen, không in hoặc đọc khuyến mãi khi chưa xác minh đủ điều kiện tại thời điểm xuất bản. Thẻ ưu đãi cũ và bài đã được nhận không xác minh số đơn còn lại. Hỏi giá và điều kiện trước khi đặt. ${offerPolicy} Nguồn này chỉ xác định chính sách, không cấp quyền dùng ưu đãi hoặc xác minh sổ đơn.`,
      sourceUri:'docs/CAMPAIGN_GOAL.md',sourceHash:hash({offerPolicy}),verifiedAt:goalObserved,timestampBasis:'policy document modification time only; not offer/redemption verification',claimFields:['promotion-policy']},
    {...base,sourceId:'sakura:policy:material-check',section:'safety-and-evidence',
      text:'Sakura: hỏi tên vật liệu, ảnh bề mặt và loại vết bám trước khi tư vấn. Đọc nhãn sản phẩm và hướng dẫn của nhà sản xuất bề mặt. Chưa xác minh hiệu quả làm sạch, chứng nhận hoặc tính phù hợp với mọi vật liệu. Không tự suy diễn dùng trên màn hình, da, đá hay lồng máy giặt. Góc nội dung là giả thuyết chưa có nhãn thắng.',
      sourceUri:'docs/FOOTAGE_EDITING.md#verified-input-and-editorial-facts',sourceHash:hash({editorial,policy:'material-check-no-efficacy-v1'}),verifiedAt:editorialObserved,timestampBasis:'reviewed editorial policy document modification time only; no product-efficacy test',claimFields:['material-check','content-evidence']},
    {...base,sourceId:'sakura:editorial:footage-video-policy',section:'editorial-video-policy',
      text:`Chính sách video/footage Sakura: Thùy Dung, nữ miền Nam, tốc độ1.2x, speaker-only; lời đọc mới vẫn cần nghe kiểm tra đúng WAV, không kế thừa duyệt giọng. Kho100MP4 và100JPG được catalog khai báo Pexels stock, không phải demo Sakura hay bằng chứng hiệu quả. Dùng bối cảnh minh họa và packshot Sakura thật. Demo trung thực có thể là đối chiếu nhãn/vật liệu; không dựng kết quả tẩy sạch. Nhạc cần kiểm tra thương mại tại tài khoản; không suy diễn top bảng xếp hạng. ${voicePolicy} ${researchPolicy} Lịch hiện tại từ chính sách mới: ${cadencePolicy}`,
      sourceUri:'docs/FOOTAGE_EDITING.md#verified-input-and-editorial-facts + docs/CAMPAIGN_GOAL.md',sourceHash:hash({editorial,voicePolicy,researchPolicy,cadencePolicy}),verifiedAt:goalObserved,timestampBasis:'current campaign policy document modification time only; footage catalog/voice policy, not new media or efficacy verification',claimFields:['video-policy','voice-preference','footage-catalog','editorial-direction']},
    {...base,validFrom:cta.updatedAt,sourceId:'sakura:policy:call-only-cta',section:'current-cta-policy',
      text:`CTA hiện tại: ${cta.primaryCta}. Nêu nhu cầu làm sạch, bề mặt và vật liệu để được tư vấn. Không yêu cầu inbox, không nói có link bấm được, không tự ghi số điện thoại chưa xác minh. Mã bài, mã hỏi hàng và tên file chỉ dùng nội bộ; không in hoặc đọc trong nội dung công khai. Giữ nguyên bài đã được nhận và lời đọc đã duyệt chính xác; lời đọc thay đổi cần nghe duyệt lại.`,
      sourceUri:'private:state/cta-policy.json (allowlisted policy fields only) + docs/CAMPAIGN_GOAL.md',sourceHash:hash({primaryCta:cta.primaryCta,publicPostCodes:cta.publicPostCodes,userFacingPostCodes:cta.userFacingPostCodes,secondaryEnabled:cta.secondaryEnabled,updatedAt:cta.updatedAt}),verifiedAt:cta.updatedAt,timestampBasis:'declared user CTA policy update timestamp; not a verified telephone number or call-attribution record',claimFields:['cta-policy']},
  ];
}
