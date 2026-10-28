import {loadState} from '../src/store.mjs';
import {voiceBrief,renderVoice} from '../src/voice.mjs';
import {voiceHome} from '../src/voice.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const args=process.argv.slice(2),ids=[],options={};let prepareOnly=false;
for(let i=0;i<args.length;i++){
  const arg=args[i];
  if(arg==='--prepare-only')prepareOnly=true;
  else if(arg==='--voice'){if(!args[i+1]||args[i+1].startsWith('--'))throw Error('Missing preset voice');options.voiceName=args[++i];}
  else if(arg==='--speed'){if(!args[i+1])throw Error('Missing speaking speed');options.speed=Number(args[++i]);if(!Number.isFinite(options.speed)||options.speed<1||options.speed>2)throw Error('Speaking speed must be 1.0–2.0');}
  else if(arg==='--reference-style'){options.referenceStyle=args[++i];if(!['preset','speaker-only'].includes(options.referenceStyle))throw Error('Expected preset or speaker-only reference style');}
  else if(arg.startsWith('--'))throw Error('Unknown option');
  else ids.push(arg);
}
if(!ids.length||ids.length>20)throw Error('Provide 1–20 queue IDs');
const state=await loadState();
for(const id of ids){
  const brief=voiceBrief(state,id);
  if(prepareOnly){await mkdir(path.join(voiceHome,'scripts'),{recursive:true});const file=path.join(voiceHome,'scripts',id+'.json');await writeFile(file,JSON.stringify(brief,null,2));console.log(JSON.stringify({queueId:id,path:file,status:brief.status}));continue;}
  const audio=await renderVoice(state,id,brief.script,options);console.log(JSON.stringify({queueId:id,path:audio.path,status:audio.status,provider:audio.provider,voice:audio.voice,speed:audio.speed,...audio.qa}));
}
