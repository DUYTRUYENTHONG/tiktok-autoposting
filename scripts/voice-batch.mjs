import {loadState} from '../src/store.mjs';
import {voiceBrief,renderVoice} from '../src/voice.mjs';
import {voiceHome} from '../src/voice.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const args=process.argv.slice(2),prepareOnly=args.includes('--prepare-only'),ids=args.filter(a=>a!=='--prepare-only');
if(!ids.length||ids.length>20)throw Error('Provide 1–20 queue IDs');
const state=await loadState();
for(const id of ids){
  const brief=voiceBrief(state,id);
  if(prepareOnly){await mkdir(path.join(voiceHome,'scripts'),{recursive:true});const file=path.join(voiceHome,'scripts',id+'.json');await writeFile(file,JSON.stringify(brief,null,2));console.log(JSON.stringify({queueId:id,path:file,status:brief.status}));continue;}
  const audio=await renderVoice(state,id,brief.script);console.log(JSON.stringify({queueId:id,path:audio.path,status:audio.status,...audio.qa}));
}
