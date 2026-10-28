import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {hashFile} from './store.mjs';

export const footageStories={
  'sakura-101':{clips:['V090','V001','V023','V043','V028'],headline:'Tan ca rồi, vẫn phải tăng ca ở bếp?',takeaway:'Chia việc nhỏ. Hỏi đúng chất liệu.'},
  'sakura-102':{clips:['V023','V001','V043','V042','V040'],headline:'Cùng ăn một bữa, sao một người dọn?',takeaway:'Chia việc cho rõ. Chọn cách cho đúng.'},
  'sakura-103':{clips:['V040','V056','V042','V043','V028'],headline:'Phòng đã chật, đồ dọn nhà cứ thêm?',takeaway:'Hỏi đúng nhu cầu trước khi mua.'},
  'sakura-104':{clips:['V042','V043','V040','V028','V056'],headline:'Nhìn giống nhau, lau giống nhau?',takeaway:'Vẻ ngoài chưa nói hết chất liệu.'},
  'sakura-105':{clips:['V028','V043','V042','V040','V001'],headline:'Muốn sạch vết bám, lại sợ hỏng đồ?',takeaway:'Xem nhãn. Hỏi kỹ. Đừng đoán.'},
  'sakura-106':{clips:['V090','V023','V001','V040','V028'],headline:'Một bữa cơm, thêm một ca dọn?',takeaway:'Chọn một góc. Xem đúng vật liệu.'},
  'sakura-107':{clips:['V028','V040','V043','V042','V023'],headline:'Thấy tên Sakura là chốt đơn?',takeaway:'Đối chiếu đúng nhãn chai500ml.'},
  'sakura-108':{clips:['V052','V001','V043','V028','V040'],headline:'Bỏ thì tiếc, chà lại sợ hỏng?',takeaway:'Hỏi đúng chất liệu và lớp phủ.'},
  'sakura-109':{clips:['V028','V042','V040','V043','V052'],headline:'Được tặng thêm, có đúng thứ cần?',takeaway:'Mua vì nhu cầu. Hỏi rõ ưu đãi.'},
  'sakura-110':{clips:['V027','V084','V028','V042','V043'],headline:'Lau rồi, sao vẫn còn lấm tấm?',takeaway:'Gạch hay đá? Vết bám loại nào?'},
};
export function wrapVideoText(text,max=27){
  const lines=[];let line='';
  for(const word of text.normalize('NFC').split(/\s+/)){if(line&&(line+' '+word).length>max){lines.push(line);line=word;}else line+=(line?' ':'')+word;}
  if(line)lines.push(line);return lines.join('\n');
}
export const hookDetails={
  'sakura-101':'Hết giờ làm, chưa hết việc nhà.',
  'sakura-102':'Bữa cơm cả nhà. Việc dọn của ai?',
  'sakura-103':'Thêm một chai, thêm chật phòng?',
  'sakura-104':'Cùng màu, chưa chắc cùng chất liệu.',
  'sakura-105':'Vết bám nhỏ. Nỗi lo hỏng đồ lớn.',
  'sakura-106':'Nấu xong, ai nhận phần dọn?',
  'sakura-107':'Đúng tên rồi. Đã đúng loại chưa?',
  'sakura-108':'Hỏi lớp phủ trước khi chọn cách lau.',
  'sakura-109':'Quà hấp dẫn. Có đúng nhu cầu?',
  'sakura-110':'Đừng vội cho rằng lau chưa kỹ.'
};
export function transitionGraph(inputCount,{duration=0.25,clipSeconds=3}={}){
  if(!Number.isInteger(inputCount)||inputCount<2||inputCount>6||duration!==0.25||clipSeconds!==3)throw Error('Expected reviewed quarter-second crossfades');
  const filters=Array.from({length:inputCount},(_,i)=>`[${i}:v]settb=AVTB,setpts=PTS-STARTPTS[s${i}]`);
  let previous='s0';
  for(let i=1;i<inputCount;i++){const next=`mix${i}`;filters.push(`[${previous}][s${i}]xfade=transition=fade:duration=${duration}:offset=${i*(clipSeconds-duration)}[${next}]`);previous=next;}
  return {filters,output:previous};
}
export function bindProductReference(edl,productImage){
  if(!productImage?.path||!/^[a-f0-9]{64}$/.test(productImage.sha256)||productImage.role!=='user_supplied_product_reference')throw Error('Authentic product reference and checksum required');
  const {revision:_,...base}=edl,complete={...base,productImage};
  return {...complete,revision:createHash('sha256').update(JSON.stringify(complete)).digest('hex').slice(0,12)};
}
export function createFootageEdl(q,review,audio,rag){
  const story=footageStories[q.id];
  if(!story||q.phase!=='voice-test'||q.account!=='saigomlia'||q.receipt||['submitting','needs_review'].includes(q.status))throw Error('Expected an unsubmitted authorized video test');
  if(q.promotionKey!=='buy1-get1-tiktok-first50'||audio.provider!=='vieneu'||audio.voice!=='Thùy Dung'||audio.speed!==1.2||audio.referenceStyle!=='speaker-only')throw Error('Offer or accepted voice profile mismatch');
  const sourceIds=rag.sources?.map(s=>s.id)??[];
  if(rag.status!=='retrieved'||!sourceIds.includes('sakura:editorial:footage-video-policy')||!sourceIds.includes('sakura:offer:buy1-get1-tiktok-first50'))throw Error('Current source-grounded video policy and offer are required');
  const scenes=story.clips.map(id=>{
    const clip=review.clips.find(c=>c.id===id),range=review.recommendedRanges.find(r=>r.id===id);
    if(!clip?.allowedForRootNeutralPool||!clip.catalogHashMatches||!clip.intervalContactSheet?.visuallyInspected||!range||range.end-range.start<2.99||range.end>clip.duration)throw Error('Missing reviewed footage interval: '+id);
    return {id,source:clip.source,sha256:clip.sourceSha256,sourceUrl:clip.sourceUrl,start:range.start,duration:3,cropCenterX:range.cropCenterX??0.5,width:clip.width,height:clip.height,role:'illustrative_chore_context'};
  });
  const seconds=Math.max(20,Math.ceil(audio.qa.durationSeconds+2));
  if(seconds>30)throw Error('Narration exceeds the reviewed short-video window');
  const edl={queueId:q.id,account:q.account,variant:'stock-footage-pain-hook-v6-safe-text',language:'vi',promotionKey:q.promotionKey,leadCode:q.leadCode,headline:story.headline,hookDetail:hookDetails[q.id],takeaway:story.takeaway,scenes,transitions:{type:'fade',duration:0.25,count:5},safeText:{inquiryY:214,captionBottomY:1330,stockLabelY:532},stockSeconds:14,packshotSeconds:seconds-15+1.25,seconds,width:1080,height:1920,fps:30,voice:{path:audio.path,sha256:audio.sha256,provider:audio.provider,voice:audio.voice,speed:audio.speed,script:audio.script,copyRevision:audio.copyRevision},rag:{corpusHash:rag.corpusHash,sourceIds},stockIsSakuraDemo:false,musicAdded:false,publicationVerified:false};
  edl.revision=createHash('sha256').update(JSON.stringify(edl)).digest('hex').slice(0,12);
  return edl;
}
export async function verifyFootageInputs(edl){
  for(const scene of edl.scenes)if(await hashFile(scene.source)!==scene.sha256)throw Error('Source footage checksum changed: '+scene.id);
  if(await hashFile(edl.voice.path)!==edl.voice.sha256)throw Error('Narration checksum changed');
  if(edl.productImage&&await hashFile(edl.productImage.path)!==edl.productImage.sha256)throw Error('Product reference checksum changed');
}
export async function loadEditingRuntime(file){
  const runtime=JSON.parse((await readFile(file,'utf8')).replace(/^\uFEFF/,''));
  if(runtime.version!=='9.0.2'||await hashFile(runtime.ffmpeg)!==runtime.ffmpegSha256)throw Error('Editing runtime verification failed');
  return runtime;
}
