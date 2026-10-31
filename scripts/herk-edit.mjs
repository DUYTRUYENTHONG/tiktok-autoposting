import path from 'node:path';
import {inspectHerkEdit,prepareHerkEdit} from '../src/herk-edit.mjs';

try{
  const [command,receiptFile,...args]=process.argv.slice(2),options={receiptFile};
  if(!['inspect','prepare'].includes(command)||!path.isAbsolute(receiptFile??''))throw Error('Usage: herk-edit inspect|prepare ABSOLUTE_RECEIPT.json [--review ABSOLUTE_REVIEW.json] [--run-footage-validator]');
  for(let i=0;i<args.length;i++){if(args[i]==='--review'&&path.isAbsolute(args[i+1]??''))options.reviewFile=args[++i];else if(args[i]==='--run-footage-validator'&&command==='prepare')options.runFootageValidator=true;else throw Error('Unknown/missing Herk editing option');}
  if(command==='inspect'){
    const r=await inspectHerkEdit(options);console.log(JSON.stringify({intentId:r.intentId,bindingHash:r.bindingHash,status:r.status,publicationReady:false,sourceReview:r.sourceReview,sourceAudioSha256:r.receipt.voice.sha256,sourceCount:r.inputs.length,rawAsrChunks:r.transcript.words.length,invalidChunks:r.transcript.invalidChunks,upstream:r.upstream,blockers:r.blockers},null,2));
  }else{
    const r=await prepareHerkEdit(options);console.log(JSON.stringify({directory:r.directory,manifestFile:r.manifestFile,reused:r.reused,status:r.manifest.status,publicationReady:false,sourceAudioSha256:r.manifest.sourceAudioSha256,footageValidation:r.manifest.footageValidation,planValidation:r.manifest.planValidation,blockers:r.manifest.blockers},null,2));
  }
}catch(e){console.error(e.message);process.exitCode=1;}
