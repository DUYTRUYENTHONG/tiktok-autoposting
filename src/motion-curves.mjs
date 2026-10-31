// Adapted from cth9191/animate, kit/core.js at7e5eb56 (MIT).
// Full notice: third-party/animate-MIT.txt. No voice or score generation is used.
export function springEase(t,k=170,d=26){
  if(![t,k,d].every(Number.isFinite)||k<=0||d<=0)throw Error('Finite time and positive spring parameters required');
  if(t<=0)return 0;
  const w0=Math.sqrt(k),z=d/(2*w0);
  if(z<1){const wd=w0*Math.sqrt(1-z*z);return 1-Math.exp(-z*w0*t)*(Math.cos(wd*t)+(z*w0/wd)*Math.sin(wd*t));}
  return 1-Math.exp(-w0*t)*(1+w0*t);
}
export const motionProvenance=Object.freeze({repository:'https://github.com/cth9191/animate',commit:'7e5eb56feb2dd573f890e1b7b34748af43d58263',license:'MIT',component:'deterministic closed-form spring',scoreEnabled:false,voiceGenerationEnabled:false});
