import {readFile,writeFile,mkdir,stat,rename,unlink,realpath} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {homedir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {hashFile} from './store.mjs';

const run=promisify(execFile),root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const hash=value=>createHash('sha256').update(typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value)).digest('hex');
export const subtitleHome=process.env.TIKTOK_SUBTITLE_HOME??path.join(homedir(),'.codex/data/tiktok-autoposting/voice/subtitles');
export const subtitleModel=Object.freeze({id:'Xenova/whisper-small',revision:'2d67713f236afa48a18992566e7647f6ca848e13',
  sourceModel:'openai/whisper-small',runtime:'@huggingface/transformers',runtimeVersion:'4.3.2',dtype:'q8',device:'cpu',
  graphs:{'onnx/encoder_model_quantized.onnx':'969f5ac12974340386bf7a02ea6626003e5e2dee396ffc6ab0eec282bf55ba06',
    'onnx/decoder_model_merged_quantized.onnx':'fcfc6100dc7339e7507e10f8b274350be7c4f8d8b575f0293f94cc0e156d6d24'}});
const modelFiles=['config.json','generation_config.json','preprocessor_config.json','tokenizer.json','tokenizer_config.json',
  'special_tokens_map.json','normalizer.json','added_tokens.json','vocab.json','merges.txt','README.md',...Object.keys(subtitleModel.graphs)];
const digits=['khong','mot','hai','ba','bon','nam','sau','bay','tam','chin'];
const subtitleVersion=4;
const fold=s=>s.normalize('NFD').replace(/\p{M}/gu,'').replaceAll('đ','d').replaceAll('Đ','D').toLowerCase();
const surfaceWords=s=>s.normalize('NFC').trim().split(/\s+/u).filter(Boolean);

function numericWords(s,leadNumber){
  if(s===leadNumber||s.length>2)return [...s].map(d=>digits[Number(d)]);
  const n=Number(s);if(n<10)return [digits[n]];
  const tens=Math.floor(n/10),last=n%10;
  return [...(tens===1?['muoi']:[digits[tens],'muoi']),...(last?[last===5?'lam':last===1&&tens>1?'mot':digits[last]]:[])];
}
function atoms(words,{leadNumber,asr=false}={}){
  const raw=[];
  words.forEach((item,i)=>{
    const text=asr?item.text:item;
    for(const part of fold(text).match(/[a-z]+|\d+/g)??[]){
      for(let key of /^\d+$/.test(part)?numericWords(part,leadNumber):[part]){
        raw.push({key,first:i,last:i,...(asr?{start:item.timestamp[0],end:item.timestamp[1]}:{})});
      }
    }
  });
  raw.forEach((a,i)=>{if(a.key==='lam'&&raw[i-1]?.key==='muoi')a.key='nam';});
  const result=[];
  for(let i=0;i<raw.length;i++){
    const a=raw[i],b=raw[i+1],c=raw[i+2];
    const count=a.key==='sa'&&b?.key==='cu'&&c?.key==='ra'?3:
      (a.key==='tich'&&['toc','tok'].includes(b?.key))||(a.key==='tik'&&b?.key==='tok')?2:1;
    const key=count===3?'sakura':count===2?'tiktok':a.key;
    result.push({...a,key,last:raw[i+count-1].last,...(asr?{end:raw[i+count-1].end}:{})});i+=count-1;
  }
  return result;
}
function wrapTwoLines(text,max=38){
  if(text.length<=max)return text;
  const words=surfaceWords(text),options=[];
  for(let i=1;i<words.length;i++){
    const a=words.slice(0,i).join(' '),b=words.slice(i).join(' ');
    if(a.length<=max&&b.length<=max)options.push({text:a+'\n'+b,cost:Math.abs(a.length-b.length)});
  }
  options.sort((a,b)=>a.cost-b.cost);
  if(!options.length)throw Error('Subtitle cannot fit two readable lines');
  return options[0].text;
}
function scriptSegments(words,protectedAtoms=[]){
  const segments=[];let first=0;
  for(let i=0;i<words.length;i++){
    const chars=words.slice(first,i+1).join(' ').length;
    const next=words[i+1]?.length??0;
    if(protectedAtoms.some(a=>a.first<=i&&a.last>i))continue;
    if(i===words.length-1||(i-first>=3&&/[.!?;]$/u.test(words[i]))||chars+1+next>66){
      segments.push({first,last:i,text:words.slice(first,i+1).join(' ')});first=i+1;
    }
  }
  const tail=segments.at(-1),prior=segments.at(-2);
  if(tail&&prior&&tail.text.length<12&&(prior.text+' '+tail.text).length<=74){prior.text+=' '+tail.text;prior.last=tail.last;segments.pop();}
  return segments;
}
export function subtitleKey({queueId,audioSha256,script,modelManifestSha256='',algorithmVersion=subtitleVersion}){
  return hash({queueId,audioSha256,scriptSha256:hash(script),model:subtitleModel,modelManifestSha256,layout:'1080x1920-Arial48-pos540x1620',version:algorithmVersion});
}
export function alignSubtitleScript(script,chunks,duration,{leadNumber,minCoverage=.85}={}){
  if(typeof script!=='string'||!script.trim()||!Number.isFinite(duration)||duration<=0)throw Error('Expected script and actual WAV duration');
  const words=surfaceWords(script),invalid=[],observed=[];let previousStart=-1;
  for(const [i,c] of (chunks??[]).entries()){
    const t=c.timestamp;
    if(typeof c.text!=='string'||!Array.isArray(t)||t.length!==2||t.some(x=>typeof x!=='number'||!Number.isFinite(x))
      ||t[0]<0||t[1]<t[0]||t[1]>duration+.03||t[0]<previousStart){invalid.push(i);continue;}
    observed.push(c);previousStart=t[0];
  }
  const expected=atoms(words,{leadNumber}),heard=atoms(observed,{leadNumber,asr:true});
  if(expected.length>500||heard.length>700)throw Error('Expected a short narration, not a long transcript');
  const dp=Array.from({length:expected.length+1},()=>new Uint16Array(heard.length+1));
  for(let i=expected.length-1;i>=0;i--)for(let j=heard.length-1;j>=0;j--)
    dp[i][j]=expected[i].key===heard[j].key?1+dp[i+1][j+1]:Math.max(dp[i+1][j],dp[i][j+1]);
  const matches=[],matched=new Set();let i=0,j=0;
  while(i<expected.length&&j<heard.length){
    if(expected[i].key===heard[j].key){
      const a=expected[i],b=heard[j];matches.push({...a,start:b.start,end:b.end,asrAtom:j});
      for(let k=a.first;k<=a.last;k++)matched.add(k);i++;j++;
    }else if(dp[i+1][j]>=dp[i][j+1])i++;else j++;
  }
  const unmatched=words.map((word,index)=>({word,index})).filter(r=>!matched.has(r.index));
  let run=0,maxUnmatchedRun=0;for(let k=0;k<words.length;k++){run=matched.has(k)?0:run+1;maxUnmatchedRun=Math.max(run,maxUnmatchedRun);}
  const critical=new Set();
  if(/^mua\b/.test(fold(script)))for(let k=0;k<words.length;k++){critical.add(k);if(/[.!?]$/u.test(words[k]))break;}
  expected.forEach((a,k)=>{
    if(['sakura','tiktok'].includes(a.key)||a.key==='giong'){
      const last=a.key==='giong'?Math.min(words.length-1,a.last+(leadNumber?.length??3)):a.last;
      for(let n=a.first;n<=last;n++)critical.add(n);
    }
    if(a.key==='muoi'&&expected[k-1]?.key==='nam'){critical.add(a.first);critical.add(expected[k-1].first);}
  });
  const criticalUnmatched=[...critical].filter(k=>!matched.has(k)).map(index=>({index,word:words[index]}));
  const cues=[],unmappedSegments=[],problems=[];
  for(const segment of scriptSegments(words,expected)){
    const anchors=matches.filter(a=>a.first>=segment.first&&a.last<=segment.last);
    if(!anchors.length){unmappedSegments.push(segment);continue;}
    const cue={start:anchors[0].start,end:anchors.at(-1).end,text:segment.text,
      scriptFirst:segment.first,scriptLast:segment.last,matchedWordCount:segment.last-segment.first+1-unmatched.filter(r=>r.index>=segment.first&&r.index<=segment.last).length};
    const previous=cues.at(-1);
    if(previous&&previous.end>cue.start){
      if((previous.text+' '+cue.text).length<=74){previous.text+=' '+cue.text;previous.end=Math.max(previous.end,cue.end);previous.scriptLast=cue.scriptLast;previous.matchedWordCount+=cue.matchedWordCount;continue;}
      problems.push('Overlapping ASR anchors cannot be split without inventing timing');
    }
    cues.push(cue);
  }
  try{for(const cue of cues)cue.text=wrapTwoLines(cue.text);validateSubtitleCues(cues,duration);}catch(e){problems.push(e.message);}
  const coverage=matched.size/words.length;
  if(cues.some(c=>c.end-c.start<.25||(c.text.replaceAll('\n','').length/(c.end-c.start)>45)))problems.push('Caption interval too short/fast for readable playback');
  const usable=coverage>=minCoverage&&maxUnmatchedRun<=2&&!criticalUnmatched.length&&!invalid.length&&!unmappedSegments.length
    &&matched.has(0)&&matched.has(words.length-1)&&!problems.length&&cues.length>0;
  return {status:usable?'needs_playback_review':'needs_alignment_review',usable,coverage,wordCount:words.length,matchedWordCount:matched.size,
    maxUnmatchedRun,unmatched,criticalUnmatched,invalidAsrChunks:invalid,unmappedSegments,problems,cues,matches,
    method:'Whisper ASR word timestamps + lexical reviewed-script phrase envelopes; not forced alignment or uniformly distributed timing',
    normalization:'Case/diacritic-insensitive matching; explicit Sakura/TikTok and spoken-number aliases. Display text remains the reviewed script.'};
}
function characterDistance(a,b){
  let previous=Array.from({length:b.length+1},(_,j)=>j);
  for(let i=1;i<=a.length;i++){const current=[i];for(let j=1;j<=b.length;j++)current[j]=Math.min(current[j-1]+1,previous[j]+1,previous[j-1]+Number(a[i-1]!==b[j-1]));previous=current;}
  return previous[b.length]/Math.max(a.length,b.length,1);
}
export function phraseSubtitlePreview(script,chunks,duration,activity,{leadNumber,strictAlignment=alignSubtitleScript(script,chunks,duration,{leadNumber})}={}){
  // A separate, explicitly weaker preview mode. Substitution anchors retain the
  // actual ASR times; measured WAV bounds cap overrun. Nothing is spaced uniformly.
  if(strictAlignment.coverage<.6||!activity?.intervals?.length)return {...strictAlignment,previewFallbackRejected:'Insufficient lexical/speech support'};
  const valid=[],boundaryCorrections=[];
  for(const [i,c] of (chunks??[]).entries()){
    const [start,end]=c.timestamp??[];
    if(typeof start!=='number'||typeof end!=='number'||!Number.isFinite(start)||!Number.isFinite(end)||start<0||start>=duration||end<start||end>duration+.3)continue;
    const bounded=Math.min(end,duration);if(end!==bounded)boundaryCorrections.push({asrChunk:i,originalEnd:end,actualWavEnd:duration});
    valid.push({...c,timestamp:[start,bounded]});
  }
  const words=surfaceWords(script),expected=atoms(words,{leadNumber}),heard=atoms(valid,{leadNumber,asr:true});
  const cost=Array.from({length:expected.length+1},()=>new Float64Array(heard.length+1));
  for(let i=0;i<=expected.length;i++)cost[i][0]=i*.9;
  for(let j=0;j<=heard.length;j++)cost[0][j]=j*.9;
  for(let i=1;i<=expected.length;i++)for(let j=1;j<=heard.length;j++)cost[i][j]=Math.min(
    cost[i-1][j-1]+characterDistance(expected[i-1].key,heard[j-1].key),cost[i-1][j]+.9,cost[i][j-1]+.9);
  let i=expected.length,j=heard.length;const anchors=[];
  while(i&&j){
    const substitution=cost[i-1][j-1]+characterDistance(expected[i-1].key,heard[j-1].key);
    if(Math.abs(cost[i][j]-substitution)<1e-8){anchors.push({...expected[i-1],start:heard[j-1].start,end:heard[j-1].end,exact:expected[i-1].key===heard[j-1].key});i--;j--;}
    else if(Math.abs(cost[i][j]-(cost[i-1][j]+.9))<1e-8)i--;else j--;
  }
  anchors.reverse();const cues=[],problems=[],gaps=[];
  for(const segment of scriptSegments(words,expected)){
    const selected=anchors.filter(a=>a.first>=segment.first&&a.last<=segment.last);
    if(!selected.length){problems.push('No ASR phrase anchor for:'+segment.text);continue;}
    const cue={start:selected[0].start,end:selected.at(-1).end,text:segment.text,
      exactAnchorRatio:selected.filter(a=>a.exact).length/selected.length,scriptFirst:segment.first,scriptLast:segment.last};
    const prior=cues.at(-1);
    if(prior&&prior.end>cue.start){
      if((prior.text+' '+cue.text).length<=74){prior.text+=' '+cue.text;prior.end=Math.max(prior.end,cue.end);prior.scriptLast=cue.scriptLast;continue;}
      problems.push('ASR phrase envelopes overlap beyond two-line capacity');
    }
    cues.push(cue);
  }
  for(const [index,cue] of cues.entries()){
    // Include the nearby measured beginning of speech when ASR starts late.
    const firstSpeech=activity.intervals.find(r=>r.start<=cue.start&&r.end>cue.start);
    if(firstSpeech&&cue.start-firstSpeech.start<=.15&&firstSpeech.start>=(cues[index-1]?.end??0))cue.start=firstSpeech.start;
    try{cue.text=wrapTwoLines(cue.text);}catch(e){problems.push(e.message);}
  }
  for(let n=1;n<cues.length;n++)gaps.push({start:cues[n-1].end,end:cues[n].start,seconds:cues[n].start-cues[n-1].end});
  try{validateSubtitleCues(cues,duration);}catch(e){problems.push(e.message);}
  if(cues.some(c=>c.end-c.start<.25||c.text.replaceAll('\n','').length/(c.end-c.start)>45))problems.push('Phrase cue too brief/fast; inspect alignment');
  const preserved=cues.map(c=>c.text.replaceAll('\n',' ')).join(' ')===words.join(' ');
  if(!preserved)problems.push('Not all reviewed-script words fit the phrase preview');
  const usable=preserved&&!problems.length&&cues.length>0;
  return {...strictAlignment,status:usable?'needs_playback_review':'needs_alignment_review',usable,cues,problems,
    method:'Phrase-caption preview using genuine ASR substitution/exact anchors and measured speech/WAV boundaries; not forced or precise word alignment',
    confidence:'Phrase timing requires human playback review; lexical mismatch remains unresolved',
    asrLexicalCoverage:strictAlignment.coverage,criticalUnmatched:strictAlignment.criticalUnmatched,boundaryCorrections,gaps,
    lowConfidencePhrases:cues.filter(c=>c.exactAnchorRatio<.7).map(c=>({text:c.text,start:c.start,end:c.end,exactAnchorRatio:c.exactAnchorRatio})),
    preciseWordAlignment:false,publicationReady:false};
}
export function validateSubtitleCues(cues,duration){
  if(!Number.isFinite(duration)||duration<=0||!Array.isArray(cues)||!cues.length)throw Error('Empty subtitles or invalid actual duration');
  let previous=0;
  for(const c of cues){
    if(!Number.isFinite(c.start)||!Number.isFinite(c.end)||c.start<0||c.end<=c.start||c.end>duration+.03||c.start<previous-.0001)throw Error('Subtitle timing is outside WAV bounds or overlapping');
    const lines=c.text?.split('\n');if(!lines||lines.length>2||lines.some(s=>!s.trim()||s.length>38)||/[\r\x00]/u.test(c.text))throw Error('Subtitles require at most two readable lines');
    previous=c.end;
  }
  return true;
}
function stamp(seconds,ass=false){
  const scale=ass?100:1000,n=Math.round(seconds*scale),s=Math.floor(n/scale),fraction=String(n%scale).padStart(ass?2:3,'0');
  return `${String(Math.floor(s/3600)).padStart(ass?1:2,'0')}:${String(Math.floor(s/60)%60).padStart(2,'0')}:${String(s%60).padStart(2,'0')}${ass?'.':','}${fraction}`;
}
export function subtitleSrt(cues,duration){validateSubtitleCues(cues,duration);return cues.map((c,i)=>`${i+1}\n${stamp(c.start)} --> ${stamp(c.end)}\n${c.text}\n`).join('\n');}
export function subtitleAss(cues,duration){
  validateSubtitleCues(cues,duration);
  const header='[Script Info]\nScriptType: v4.00+\nPlayResX: 1080\nPlayResY: 1920\nWrapStyle: 2\nScaledBorderAndShadow: yes\n\n[V4+ Styles]\nFormat: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding\nStyle: Voice,Arial,48,&H00FFFFFF,&H00FFFFFF,&H70000000,&H70000000,-1,0,0,0,100,100,0,0,3,8,0,2,75,75,300,1\n\n[Events]\nFormat: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text\n';
  return header+cues.map(c=>`Dialogue: 0,${stamp(c.start,true)},${stamp(c.end,true)},Voice,,0,0,0,,{\\an2\\pos(540,1620)}${c.text.replaceAll('\\','＼').replaceAll('{','｛').replaceAll('}','｝').replaceAll('\n','\\N')}`).join('\n')+'\n';
}
async function privateOutput(directory){
  const requested=path.resolve(directory);await mkdir(requested,{recursive:true});const resolved=await realpath(requested),checkout=await realpath(root);
  if(resolved===checkout||resolved.startsWith(checkout+path.sep))throw Error('Subtitle audio/models/receipts must stay outside Git checkout');return resolved;
}

export async function ensureSubtitleModel({home=subtitleHome,download=false}={}){
  const directory=path.join(await privateOutput(home),'models','whisper-small-2d67713f'),manifestFile=path.join(directory,'assets.json');
  await mkdir(directory,{recursive:true});
  let manifest;try{manifest=JSON.parse(await readFile(manifestFile,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
  if(!manifest){
    if(!download)throw Error('Pinned subtitle ASR model missing; run prepare-video-subtitles.mjs --download-model');
    const response=await fetch(`https://huggingface.co/api/models/${subtitleModel.id}/revision/${subtitleModel.revision}?blobs=true`);
    if(!response.ok)throw Error(`Public model metadata download failed:${response.status}`);
    const info=await response.json();if(info.sha!==subtitleModel.revision)throw Error('ASR model revision mismatch');
    const files=[];
    for(const file of modelFiles){
      const item=info.siblings.find(r=>r.rfilename===file);if(!item)throw Error('Pinned ASR file missing:'+file);
      if(item.size>160_000_000)throw Error('Unexpectedly large ASR model artifact');
      const target=path.join(directory,...file.split('/'));await mkdir(path.dirname(target),{recursive:true});
      try{await stat(target);}catch(e){
        if(e.code!=='ENOENT')throw e;
        const resource=await fetch(`https://huggingface.co/${subtitleModel.id}/resolve/${subtitleModel.revision}/${file}`);
        if(!resource.ok)throw Error('Public ASR artifact download failed:'+file);
        const {Readable,Transform}=await import('node:stream'),{pipeline}=await import('node:stream/promises'),{createWriteStream}=await import('node:fs');
        let bytes=0;const limiter=new Transform({transform(chunk,_encoding,done){bytes+=chunk.length;done(bytes>item.size?Error('ASR download exceeds pinned size'):null,chunk);}});
        try{await pipeline(Readable.fromWeb(resource.body),limiter,createWriteStream(target+'.partial',{flags:'wx'}));await rename(target+'.partial',target);}
        catch(error){await unlink(target+'.partial').catch(()=>{});throw error;}
      }
      const content=await readFile(target),actual=hash(content);
      const published=item.lfs?.sha256??createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${content.length}\0`),content])).digest('hex');
      if(content.length!==item.size||(item.lfs?actual!==item.lfs.sha256:published!==item.blobId))throw Error('Pinned public artifact checksum mismatch:'+file);
      files.push({file,path:target,bytes:item.size,sha256:actual,publishedLfsSha256:item.lfs?.sha256??null,publishedGitBlobSha1:item.blobId});
    }
    manifest={model:subtitleModel.id,revision:subtitleModel.revision,sourceModel:subtitleModel.sourceModel,downloadedAt:new Date().toISOString(),files};
    await writeFile(manifestFile,JSON.stringify(manifest,null,2),'utf8');
  }
  if(manifest.model!==subtitleModel.id||manifest.revision!==subtitleModel.revision||modelFiles.some(file=>!manifest.files.some(r=>r.file===file)))throw Error('ASR asset manifest mismatch');
  for(const item of manifest.files){
    const target=path.join(directory,...item.file.split('/'));
    if(!modelFiles.includes(item.file)||(await stat(target)).size!==item.bytes||await hashFile(target)!==item.sha256)throw Error('ASR asset checksum mismatch:'+item.file);
    if(subtitleModel.graphs[item.file]&&item.sha256!==subtitleModel.graphs[item.file])throw Error('ASR graph pin mismatch');
  }
  return {directory,manifestFile,manifestSha256:await hashFile(manifestFile),model:subtitleModel,files:manifest.files};
}
export async function createSubtitleTranscriber(modelAssets){
  const installed=JSON.parse(await readFile(path.join(root,'node_modules/@huggingface/transformers/package.json'),'utf8'));
  if(installed.version!==subtitleModel.runtimeVersion)throw Error('Expected pinned Transformers.js4.3.2');
  const {pipeline,env}=await import('@huggingface/transformers');env.allowRemoteModels=false;env.allowLocalModels=true;env.useBrowserCache=false;
  const offline=async callback=>{const prior=globalThis.fetch;globalThis.fetch=async()=>{throw Error('Network disabled for local subtitle inference');};try{return await callback();}finally{globalThis.fetch=prior;}};
  const pipe=await offline(()=>pipeline('automatic-speech-recognition',modelAssets.directory,{dtype:'q8',device:'cpu',local_files_only:true,
    session_options:{intra_op_num_threads:2,inter_op_num_threads:1}}));
  return {async transcribe(samples){return offline(()=>pipe(samples,{language:'vietnamese',task:'transcribe',return_timestamps:'word',max_new_tokens:240,num_beams:1}));},dispose:()=>pipe.dispose()};
}
export async function narrationSource(queueItem){
  if(!/^sakura-10[1-5]$/u.test(queueItem?.id)||!queueItem.voicePreview?.receiptFile)throw Error('Expected current narrated video101–105');
  const receiptFile=queueItem.voicePreview.receiptFile,video=JSON.parse(await readFile(receiptFile,'utf8')),voice=video.voice;
  if(video.queueId!==queueItem.id||!voice?.script||!voice.path||!voice.sha256||video.sha256!==queueItem.voicePreview.sha256)throw Error('Current video/voice receipt mismatch');
  if(await hashFile(voice.path)!==voice.sha256||await hashFile(video.path)!==video.sha256)throw Error('WAV/video checksum mismatch; regenerate subtitle inputs');
  const scriptFile=voice.path.replace(/\.wav$/iu,'.txt');
  if((await readFile(scriptFile,'utf8')).trim()!==voice.script.trim())throw Error('Reviewed voice script file mismatch');
  return {queueId:queueItem.id,receiptFile,sourceReceiptSha256:await hashFile(receiptFile),videoPath:video.path,videoSha256:video.sha256,
    audioPath:voice.path,audioSha256:voice.sha256,script:voice.script,scriptFile,scriptSha256:hash(voice.script),
    listeningVerified:voice.listeningVerified===true,voiceRevisionRequired:queueItem.voiceRevisionRequired===true||video.voiceRevisionRequired===true,
    voiceProfile:{voice:voice.voice,speed:voice.speed,referenceStyle:voice.referenceStyle},leadCode:voice.leadCode,spokenLeadCode:voice.spokenLeadCode};
}
export function speechActivity(samples,rate=16000){
  const window=Math.round(rate*.02),levels=[];
  for(let start=0;start<samples.length;start+=window){let sum=0;const end=Math.min(start+window,samples.length);for(let j=start;j<end;j++)sum+=samples[j]**2;levels.push(Math.sqrt(sum/(end-start)));}
  const threshold=Math.max(.004,Math.max(...levels)*.08),intervals=[];let start=null;
  for(let i=0;i<=levels.length;i++){
    if(i<levels.length&&levels[i]>=threshold){start??=i*.02;}
    else if(start!==null){if(i*.02-start>=.04)intervals.push({start,end:Math.min(i*.02,samples.length/rate)});start=null;}
  }
  return {method:'Measured20ms RMS activity, not linguistic/word alignment',threshold,intervals};
}
export async function prepareVideoSubtitles(queueItem,{ffmpeg,transcriber,modelAssets,home=subtitleHome,reuseAsrFile}={}){
  const source=await narrationSource(queueItem),key=subtitleKey({...source,modelManifestSha256:modelAssets.manifestSha256}),
    directory=path.join(await privateOutput(home),'renders',`${source.queueId}-${key.slice(0,16)}`),receiptFile=path.join(directory,'receipt.json');
  await mkdir(directory,{recursive:true});
  try{const prior=JSON.parse(await readFile(receiptFile,'utf8'));await verifySubtitleReceipt(prior,source);return {...prior,receiptFile,cached:true};}catch(e){if(e.code!=='ENOENT')throw e;}
  const {stdout}=await run(ffmpeg,['-hide_banner','-loglevel','error','-i',source.audioPath,'-ac','1','-ar','16000','-f','f32le','pipe:1'],{encoding:'buffer',maxBuffer:20*1024*1024,timeout:30000,windowsHide:true});
  const samples=new Float32Array(stdout.buffer.slice(stdout.byteOffset,stdout.byteOffset+stdout.byteLength)),duration=samples.length/16000;
  if(!samples.length||samples.some(x=>!Number.isFinite(x)))throw Error('Invalid local narration PCM');
  let asr;const started=performance.now();
  if(reuseAsrFile){asr=JSON.parse(await readFile(reuseAsrFile,'utf8'));if(asr.audioSha256!==source.audioSha256||asr.model!==subtitleModel.id||asr.revision!==subtitleModel.revision||asr.offline!==true||asr.script!==source.script||Math.abs(asr.durationSeconds-duration)>.03)throw Error('Reused ASR record does not match actual narration/model');}
  else asr={queueId:source.queueId,audioSha256:source.audioSha256,script:source.script,durationSeconds:duration,model:subtitleModel.id,revision:subtitleModel.revision,offline:true,output:await transcriber.transcribe(samples)};
  const asrFile=path.join(directory,'asr.json');await writeFile(asrFile,JSON.stringify(asr,null,2),'utf8');
  const activity=speechActivity(samples),leadNumber=source.leadCode?.match(/\d+/u)?.[0];
  let alignment=alignSubtitleScript(source.script,asr.output.chunks,duration,{leadNumber});
  if(!alignment.usable)alignment=phraseSubtitlePreview(source.script,asr.output.chunks,duration,activity,{leadNumber,strictAlignment:alignment});
  const alignmentFile=path.join(directory,'alignment.json');await writeFile(alignmentFile,JSON.stringify(alignment,null,2),'utf8');
  let srtFile=null,assFile=null;
  if(alignment.usable){srtFile=path.join(directory,'voice.srt');assFile=path.join(directory,'voice.ass');await writeFile(srtFile,subtitleSrt(alignment.cues,duration),'utf8');await writeFile(assFile,subtitleAss(alignment.cues,duration),'utf8');}
  const record={schemaVersion:1,algorithmVersion:subtitleVersion,key,...source,receiptFile,durationSeconds:duration,status:alignment.status,usable:alignment.usable,
    model:{...subtitleModel,manifestFile:modelAssets.manifestFile,manifestSha256:modelAssets.manifestSha256},
    asrFile,asrSha256:await hashFile(asrFile),alignmentFile,alignmentSha256:await hashFile(alignmentFile),
    srtFile,srtSha256:srtFile?await hashFile(srtFile):null,assFile,assSha256:assFile?await hashFile(assFile):null,
    timingMethod:alignment.method,coverage:alignment.coverage,criticalUnmatched:alignment.criticalUnmatched,
    speechActivity:activity,alignmentConfidence:alignment.confidence??'Lexically supported ASR phrase envelopes; still needs playback',
    lowConfidencePhrases:alignment.lowConfidencePhrases??[],timingGaps:alignment.gaps??[],elapsedSeconds:(performance.now()-started)/1000,
    offline:true,playbackVerified:false,published:false,createdAt:new Date().toISOString(),
    limitations:'ASR-derived word anchors and reviewed-script phrase envelopes; not forced alignment, listening acceptance or publication. Poor alignment abstains; no uniform timing.'};
  await writeFile(receiptFile,JSON.stringify(record,null,2),'utf8');return record;
}
export async function verifySubtitleReceipt(receipt,source){
  if(receipt.audioSha256!==source.audioSha256||receipt.scriptSha256!==source.scriptSha256||hash(source.script)!==source.scriptSha256
    ||await hashFile(source.audioPath)!==source.audioSha256||(await readFile(source.scriptFile,'utf8')).trim()!==source.script.trim())throw Error('Subtitle audio/script is stale');
  const version=receipt.algorithmVersion??3;
  if(![3,4].includes(version)||receipt.key!==subtitleKey({...source,modelManifestSha256:receipt.model?.manifestSha256,algorithmVersion:version}))throw Error('Subtitle key/model mismatch');
  for(const [file,digest] of [[receipt.asrFile,receipt.asrSha256],[receipt.alignmentFile,receipt.alignmentSha256],[receipt.srtFile,receipt.srtSha256],[receipt.assFile,receipt.assSha256]].filter(([file])=>file))
    if(await hashFile(file)!==digest)throw Error('Subtitle asset checksum mismatch');
  if(receipt.usable){
    const alignment=JSON.parse(await readFile(receipt.alignmentFile,'utf8'));
    if(!alignment.usable||!receipt.srtFile||!receipt.assFile||receipt.status!=='needs_playback_review')throw Error('Subtitle receipt is not a usable playback preview');
    validateSubtitleCues(alignment.cues,receipt.durationSeconds);
  }
  return true;
}
