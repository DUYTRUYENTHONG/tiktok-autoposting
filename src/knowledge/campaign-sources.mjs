import {readFile, stat} from 'node:fs/promises';
import path from 'node:path';
import {hash} from './index.mjs';
import {defaultFile, root} from '../store.mjs';

// This release's editorial facts were read and reviewed with the user-authorized source.
// A changed facts section needs review, rather than renewing hardcoded facts via a new mtime.
const reviewedEditorialHash='b471a0caff0ff57de75a8dafe536cc3794e02af09c98edf441e128c61dd6547c';
export function assertReviewedEditorial(text) {
  const section=text.split(/^## Verified input and editorial facts.*$/m)[1]?.split(/^## /m)[0].trim().replace(/\r\n/g,'\n');
  if(!section||hash(section)!==reviewedEditorialHash)throw new Error('Editorial facts changed: review the source, imported facts and approved section hash before reindexing');
  return section;
}

// Deliberate allowlist: no customer messages, leads, browser data, media, or whole-campaign serialization.
export async function campaignSources(file = defaultFile) {
  const campaign = JSON.parse(await readFile(file,'utf8'));
  const product = campaign.products?.find(p=>p.id === 'sakura-cleaner-500ml');
  if (!product || product.facts?.volume !== '500 ml' || !product.facts.volumeSource) throw new Error('Verified Sakura SKU source missing');
  const offer = campaign.campaign?.currentPromotion;
  const compact=value=>String(value).normalize('NFC').replace(/\s/g,'').toLowerCase();
  if (offer?.key !== 'buy1-get1-tiktok-first50' || offer.unit !== 'orders' || offer.maxOrders !== 50 || offer.channel!=='TikTok'
      || compact(offer.text)!==compact('Mua 1 tặng 1 cho 50 đơn đầu tiên từ TikTok') || !offer.visuallyVerified || !offer.verifiedAt) throw new Error('Current verified first-50-order offer missing or changed: review importer');
  const termsFile = path.join(root,'docs','PROMOTION_TERMS.md');
  const terms = await readFile(termsFile,'utf8');
  if (!terms.includes('50') || !terms.includes('orders')) throw new Error('Promotion source changed: review importer');
  const readmeFile=path.join(root,'README.md'), readme=await readFile(readmeFile,'utf8');
  const policyObserved=(await stat(readmeFile)).mtime.toISOString();
  const editorialFile=path.join(root,'docs','FOOTAGE_EDITING.md');
  const editorial=await readFile(editorialFile,'utf8');
  assertReviewedEditorial(editorial);
  const editorialObserved=(await stat(editorialFile)).mtime.toISOString();
  const base = {productId:product.id, verified:true, validFrom:'2026-10-28T00:00:00+07:00',validTo:null};
  return [
    {...base,sourceId:'sakura:identity:500ml',promotionKey:'*',section:'identity',text:`Sản phẩm: ${product.name}. Dung tích: ${product.facts.volume}. Nguồn dung tích: ${product.facts.volumeSource}. Chưa có xác minh về hiệu quả làm sạch.`,
      sourceUri:'private:campaign.products[sakura-cleaner-500ml].facts + docs/PROMOTION_TERMS.md (500ml card QA)',sourceHash:hash({name:product.name,volume:product.facts.volume,volumeSource:product.facts.volumeSource}),verifiedAt:offer.verifiedAt,timestampBasis:'current-promotion-card visual QA; no cleaning-efficacy test',claimFields:['identity','volume']},
    {...base,sourceId:'sakura:offer:buy1-get1-tiktok-first50',promotionKey:offer.key,section:'current-promotion',
      text:'Ưu đãi Sakura: Mua 1 tặng 1 cho 50 đơn đầu tiên từ TikTok. Giới hạn 50 đơn hàng, không phải 50 khách hàng; không đặt lại theo từng bài hoặc từng ngày. Số đơn đã đổi và còn lại chưa biết. Không có giá, hạn chót, miễn phí giao hàng hoặc giới hạn mỗi khách được xác minh.',
      sourceUri:'docs/PROMOTION_TERMS.md + private:campaign.campaign.currentPromotion',sourceHash:hash({terms,offer:{key:offer.key,text:offer.text,maxOrders:offer.maxOrders,unit:offer.unit}}),verifiedAt:offer.verifiedAt,claimFields:['offer','channel','maxOrders','unit']},
    {...base,sourceId:'sakura:policy:material-check',promotionKey:'*',section:'safety-and-evidence',
      text:'Sakura: hỏi tên vật liệu, ảnh bề mặt và loại vết bám trước khi tư vấn. Đọc nhãn sản phẩm và hướng dẫn của nhà sản xuất bề mặt. Chưa xác minh hiệu quả làm sạch, chứng nhận hoặc tính phù hợp với mọi vật liệu. Không tự suy diễn dùng trên màn hình, da, đá hay lồng máy giặt. Góc nội dung hiện là giả thuyết chưa có nhãn thắng.',
      sourceUri:'README.md#content-skills-and-agents',sourceHash:hash(readme),verifiedAt:policyObserved,timestampBasis:'policy source modification time; no product-efficacy test',claimFields:['material-check','content-evidence']},
    {...base,sourceId:'sakura:editorial:footage-video-policy',promotionKey:'*',section:'editorial-video-policy',
      text:'Chính sách biên tập video Sakura cập nhật ngày 28/10/2026: chiến dịch mới1.000bài gồm500carousel và500video,20bài/ngày. Chỉ hiển thị ưu đãi khi đã xác minh đủ điều kiện; chưa có sổ đơn/số đơn còn lại được xác minh nên bản mới không chứa ưu đãi, không bắt buộc lời mở đầu khuyến mãi. Giữ nguyên bài đã được nền tảng nhận. Chủ kênh đã chấp nhận giọng Thùy Dung, nữ miền Nam, tốc độ1.2x; lời đọc mới vẫn cần nghe kiểm tra. Kho footage có100MP4 và100JPG; catalog khai báo Pexels stock, không phải demo Sakura hay bằng chứng hiệu quả. Dùng bối cảnh có nhãn minh họa và packshot Sakura thật; demo trung thực có thể là đối chiếu nhãn/vật liệu, không phải chứng minh tẩy sạch. Hash, quyền sử dụng, QA, nhạc thương mại, render và receipt đăng bài là các kiểm tra riêng. Không gọi nhạc là top bảng xếp hạng nếu chưa xác minh.',
      sourceUri:'docs/FOOTAGE_EDITING.md',sourceHash:hash(editorial),verifiedAt:editorialObserved,timestampBasis:'editorial policy document modification time; authority and observation recorded in that source',claimFields:['video-policy','voice-preference','footage-catalog','editorial-direction']},
  ];
}
