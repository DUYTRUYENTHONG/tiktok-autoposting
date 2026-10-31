import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {recordVoiceFeedback,voiceCorrectionContext,loadVoiceFeedback} from '../src/knowledge/voice-corrections.mjs';
try{
  const [command,file,...extra]=process.argv.slice(2);
  if(extra.length||!['record','query','status'].includes(command)||command==='status'&&file||command!=='status'&&!path.isAbsolute(file??''))throw Error('Usage: voice-corrections status | record ABS_REVIEW_REQUEST.json | query ABS_QUERY_REQUEST.json');
  const input=file?JSON.parse(await readFile(file,'utf8')):null;
  const result=command==='record'?await recordVoiceFeedback(input):command==='query'?await voiceCorrectionContext(input):{records:(await loadVoiceFeedback()).length,scope:'unresolved feedback only',modelTrained:false,approvedCorrections:0};
  console.log(JSON.stringify(result,null,2));
}catch(error){console.error(error.message);process.exitCode=1;}
