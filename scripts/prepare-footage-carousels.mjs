import {mkdir,writeFile,readFile} from 'node:fs/promises';
import path from 'node:path';
import {buildIndex,createKnowledgePipeline,privateKnowledgeDir} from '../src/knowledge/index.mjs';
import {campaignSources} from '../src/knowledge/campaign-sources.mjs';
import {createHybridRetriever} from '../src/knowledge/embeddings.mjs';
import {prepareCarouselBriefs} from '../src/knowledge/carousel-briefs.mjs';
import {root} from '../src/store.mjs';

try {
  // Read the current canonical facts; no campaign/queue writes. Models must already be cached.
  const directory=process.env.TIKTOK_KNOWLEDGE_DIR??privateKnowledgeDir;
  const cachePath=path.resolve(directory).toLowerCase(),repositoryPath=path.resolve(root).toLowerCase();
  if(!path.isAbsolute(directory)||cachePath===repositoryPath||cachePath.startsWith(repositoryPath+path.sep))throw new Error('Knowledge/model cache must be an absolute private directory outside the repository');
  const index=buildIndex(await campaignSources());
  const hybrid=await createHybridRetriever(index,'e5',{directory,allowDownload:false});
  let manifest;
  try {
    const pipeline=createKnowledgePipeline(index,{retriever:request=>hybrid.retrieve(request)});
    manifest=await prepareCarouselBriefs({index,pipeline});
  }finally{await hybrid.dispose();}
  const output=path.join(path.dirname(directory),'carousel-footage');
  await mkdir(output,{recursive:true});
  const filename=path.join(output,`briefs-${manifest.briefsHash.slice(0,16)}.json`);
  let reused=false;
  try{const existing=JSON.parse(await readFile(filename,'utf8'));if(existing.briefsHash!==manifest.briefsHash)throw new Error('Existing manifest conflicts with brief hash');reused=true;}
  catch(error){if(error.code!=='ENOENT')throw error;await writeFile(filename,JSON.stringify(manifest,null,2),{encoding:'utf8',mode:0o600,flag:'wx'});}
  console.log(JSON.stringify({filename,reused,posts:manifest.posts.length,slides:manifest.posts.reduce((sum,p)=>sum+p.slides.length,0),inquiryCodes:manifest.posts.map(p=>p.inquiryCode),corpusHash:manifest.corpusHash,mode:manifest.mode,fineTunedModelUsed:false,generativeLLMUsed:false,queueModified:false,submittedCount:0},null,2));
}catch(error){console.error(error.message);process.exitCode=1;}
