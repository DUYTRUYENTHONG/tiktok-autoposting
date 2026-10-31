// Runs only in an isolated, offline rendering page. Payloads are data, never evaluated code.
export function installMotionCanvas(){
  const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d',{alpha:false});let model,assets=new Map(),bounds=[],frameNumber=0;
  const clamp=v=>Math.min(1,Math.max(0,v)),ease=t=>window.sakuraSpring(Math.max(0,t)),mix=(a,b,t)=>a+(b-a)*t;
  const rr=(x,y,w,h,r=18)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,r);};
  function words(text,width,size,weight='700'){
    ctx.font=`${weight} ${size}px Arial`;const result=[];
    for(const paragraph of text.split('\n')){let line='';for(const word of paragraph.split(/\s+/).filter(Boolean)){const next=line?line+' '+word:word;if(line&&ctx.measureText(next).width>width){result.push(line);line=word;}else line=next;}result.push(line);}
    return result;
  }
  function text(value,x,y,{size=64,width=840,color=model.ink,weight='700',maxLines=3,align='left',alpha=1,role='heading'}={}){
    let lines=words(value,width,size,weight);while(lines.length>maxLines&&size>36){size-=2;lines=words(value,width,size,weight);}
    ctx.save();ctx.globalAlpha*=clamp(alpha);ctx.fillStyle=color;ctx.font=`${weight} ${size}px Arial`;ctx.textAlign=align;ctx.textBaseline='top';const lineHeight=size*1.20;
    lines.forEach((line,i)=>{const measured=ctx.measureText(line),w=measured.width,left=align==='center'?x-w/2:x,top=y+i*lineHeight;ctx.fillText(line,x,top);if(alpha>.95&&(left<60||left+w>960||top<60||top+lineHeight>1600||w>width+.5||lines.length>maxLines))bounds.push({frame:frameNumber,role,text:line,x:left,y:top,width:w,size});});ctx.restore();return lines.length*lineHeight;
  }
  function picture(id,x,y,w,h,{cover=true,zoom=1,alpha=1,shadow=false}={}){
    const asset=assets.get(id);if(!asset)return;const sw=asset.videoWidth||asset.naturalWidth,sh=asset.videoHeight||asset.naturalHeight,scale=(cover?Math.max(w/sw,h/sh):Math.min(w/sw,h/sh))*zoom,dw=sw*scale,dh=sh*scale;
    ctx.save();ctx.globalAlpha*=alpha;if(shadow){ctx.shadowColor='rgba(20,30,40,.14)';ctx.shadowBlur=28;ctx.shadowOffsetY=14;ctx.fillStyle='white';rr(x,y,w,h);ctx.fill();ctx.shadowColor='transparent';}rr(x,y,w,h,shadow?18:0);ctx.clip();ctx.drawImage(asset,x+(w-dw)/2,y+(h-dh)/2,dw,dh);ctx.restore();
  }
  function heading(scene,local){
    text(scene.context?model.contextHeader:'SAKURA / 500 ml',90,100,{size:29,color:model.accent,maxLines:1,role:'brand'});
    const delay=(scene.type==='questions'||scene.type==='cta') ? .22 : 0,arrival=scene.type==='media'?1:clamp((local-delay)/.2);
    text(scene.heading,90,190,{size:scene.type==='media'?72:68,maxLines:scene.heading.includes('\n')?2:1,alpha:arrival});
    if(scene.detail)text(scene.detail,90,315,{size:41,color:model.accent,weight:'400',maxLines:1,alpha:arrival,role:'detail'});
  }
  function sceneBody(scene,t,local){
    ctx.fillStyle=model.background;ctx.fillRect(0,0,1080,1920);heading(scene,local);
    if(scene.type==='media')picture(scene.assetId,0,400,1080,1040,{zoom:1+Math.min(.025,local*.0025)});
    if(scene.type==='product'){
      text('SAKURA',600,660,{size:58,width:330,color:model.accent,maxLines:1,alpha:clamp(local/.25)});text('500 ml',600,760,{size:66,width:330,maxLines:1});text('Nước lau\nđa năng',600,900,{size:48,width:330,weight:'400',maxLines:2});
    }
    if(scene.type==='questions')scene.questions.forEach((label,i)=>{
      const at=.25+i*.18,p=clamp(ease((local-at)*1.15)),y=560+i*230+28*(1-p);ctx.save();ctx.globalAlpha*=clamp((local-at)/.16);ctx.fillStyle='white';rr(90,y,900,166,18);ctx.fill();ctx.fillStyle=model.accent;rr(90,y,8,166,4);ctx.fill();text(String(i+1).padStart(2,'0'),132,y+58,{size:37,width:70,color:model.accent,maxLines:1,role:'step'});text(label,225,y+51,{size:52,width:665,maxLines:1,role:'question'});ctx.restore();
    });
    if(scene.type==='cta'){
      const p=clamp((local-.25)/.20);text('GỌI SỐ',550,730,{size:78,width:380,color:model.accent,maxLines:1,alpha:p,role:'cta'});text('TRONG BIO',550,850,{size:60,width:380,maxLines:1,alpha:p,role:'cta'});text('Nói rõ chỗ cần lau\nvà chất liệu bề mặt.',550,1040,{size:33,width:380,weight:'400',maxLines:2,alpha:p,role:'cta-detail'});
    }
  }
  function productLayer(t){
    const keys=model.scenes.filter(s=>['product','questions','cta'].includes(s.type));if(!keys.length||t<keys[0].start)return;
    const positions={product:{x:90,y:420,w:450,h:940},questions:{x:815,y:70,w:110,h:230},cta:{x:90,y:470,w:400,h:850}};
    let current=keys[0],previous=null;for(const key of keys)if(t>=key.start){previous=current===key?previous:current;current=key;}else break;
    const target=positions[current.type],local=t-current.start,p=clamp(ease(local)),from=previous?positions[previous.type]:{...target,y:target.y+80};
    picture('product',mix(from.x,target.x,p),mix(from.y,target.y,p),mix(from.w,target.w,p),mix(from.h,target.h,p),{cover:false,alpha:previous?1:clamp(local/.2),shadow:true});
  }
  function caption(t){const cue=model.cues.find(c=>t>=c.start&&t<c.end);if(!cue)return;const value=cue.text.replaceAll('\n',' ').replaceAll('Sa cu ra','Sakura'),size=48,lines=words(value,840,size,'700'),top=1550-lines.length*size*1.2;ctx.fillStyle=model.background;ctx.fillRect(0,top-14,1080,1600-top+14);text(value,540,top,{size,width:840,align:'center',maxLines:3,role:'caption'});}
  window.motionInitialize=async payload=>{
    model=payload;canvas.width=1080;canvas.height=1920;
    for(const spec of payload.assets){if(spec.kind==='video'){const video=document.createElement('video');video.muted=true;video.preload='auto';video.src=spec.data;await new Promise((resolve,reject)=>{video.onloadeddata=resolve;video.onerror=()=>reject(Error('Cannot decode local video asset'));});assets.set(spec.id,video);}else{const image=new Image();image.src=spec.data;await image.decode();assets.set(spec.id,image);}}
    await document.fonts.ready;return {assets:assets.size,font:'Arial',width:canvas.width,height:canvas.height};
  };
  window.motionFrame=async frame=>{
    frameNumber=frame;const t=frame/model.fps,index=Math.max(0,model.scenes.findIndex(s=>t>=s.start&&t<s.end)),scene=model.scenes[index];
    for(const candidate of [scene,model.scenes[index-1]].filter(Boolean)){const asset=assets.get(candidate.assetId);if(asset instanceof HTMLVideoElement){const wanted=Math.max(0,Math.min(asset.duration-.035,t-candidate.start));if(Math.abs(asset.currentTime-wanted)>.015)await new Promise(resolve=>{asset.onseeked=resolve;asset.currentTime=wanted;});}}
    ctx.clearRect(0,0,1080,1920);const previous=model.scenes[index-1],local=t-scene.start,transition=scene.transitionSeconds??.18;
    if(previous&&local<transition){sceneBody(previous,t,t-previous.start);ctx.save();ctx.globalAlpha=clamp(local/transition);sceneBody(scene,t,local);ctx.restore();}else sceneBody(scene,t,local);
    productLayer(t);caption(t);return canvas.toDataURL('image/jpeg',.96).split(',')[1];
  };
  window.motionAudit=()=>({textOverflow:bounds.slice(0,100),textOverflowCount:bounds.length,framesRendered:frameNumber+1,canvas:{width:1080,height:1920},deterministicClock:true,voiceRetimed:false,fonts:'Arial'});
}
