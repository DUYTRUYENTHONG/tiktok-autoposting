import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {createScaleProgress} from '../src/scale-progress.mjs';

try{
  const [command,id,file,...extra]=process.argv.slice(2);
  if(extra.length||!['revise','bind','submitting','receipt','status'].includes(command)||command==='status'&&(id||file)||command==='submitting'&&(!id||file)||['revise','bind','receipt'].includes(command)&&(!id||!file||!path.isAbsolute(file)))throw Error('Usage: scale-progress status | revise <intentID> <absolute-revision.json> | bind <intentID> <absolute-evidence.json> | submitting <intentID> | receipt <intentID> <absolute-realreceipt.json>');
  const bridge=createScaleProgress({...(process.env.TIKTOK_SCALE_PROGRESS_FILE?{journalFile:process.env.TIKTOK_SCALE_PROGRESS_FILE}:{})});
  if(command==='status'){
    const result=await bridge.status();console.log(JSON.stringify({campaignId:result.campaignId,planHash:result.planHash,journalFile:result.journalFile,journalExists:result.journalExists,counts:result.counts,activeItems:result.items.filter(i=>i.status!=='planned'||i.revisionHash)},null,2));
  }else{
    let input;if(file){if((await stat(file)).size>64*1024*1024)throw Error('Progress input exceeds64MB');input=JSON.parse(await readFile(file,'utf8'));}
    const result=command==='revise'?await bridge.revise(id,input):command==='bind'?await bridge.bind(id,input):command==='submitting'?await bridge.submitting(id):await bridge.receipt(id,input);
    console.log(JSON.stringify(result,null,2));if(command==='bind'&&result.status!=='ready')process.exitCode=2;
  }
}catch(error){console.error(error.message);process.exitCode=1;}
