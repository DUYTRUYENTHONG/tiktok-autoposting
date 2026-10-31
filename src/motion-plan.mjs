import {assertConsumerOverlay} from './consumer-overlays.mjs';
import {assertEvergreen} from '../scripts/render-scale-video-preview.mjs';

export function validateMotionCopy(plan){
  if(!/^0x[0-9a-f]{6}$/u.test(plan.accent??'')||!Array.isArray(plan.questions)||plan.questions.length!==3)throw Error('Use an explicit palette and three material/need questions');
  for(const value of [plan.contextHeader,plan.hook,plan.bodyHeading,plan.bodyDetail,...plan.questions]){
    if(typeof value!=='string'||!value.trim()||value.length>240)throw Error('Use bounded, nonempty Vietnamese motion text');
    assertConsumerOverlay(value);assertEvergreen(value);
    const text=value.normalize('NFD').replace(/\p{M}/gu,'').replaceAll('đ','d').toLowerCase();
    if(/\b(?:anh|giong|bep)\s*\d{3,}\b|sakura[-_](?:scale[-_])?\d+/u.test(text))throw Error('Keep internal identifiers private');
    if(/\b(?:inbox|nhan tin|nhan shop|gui shop|link trong bio|bam link)\b/u.test(text))throw Error('Use the call-only CTA');
    if(/sach bong|tay sach moi|diet khuan|diet virus|an toan tuyet doi|dung duoc moi|khach hang noi|khach da dung|cam ket|bao dam|chung nhan/u.test(text))throw Error('Unsupported result or testimonial in motion text');
  }
  return plan;
}
