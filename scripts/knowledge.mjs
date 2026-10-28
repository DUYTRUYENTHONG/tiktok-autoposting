import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {campaignSources} from '../src/knowledge/campaign-sources.mjs';
import {persistIndex,loadIndex,createKnowledgePipeline,evaluateRetrieval,privateKnowledgeDir} from '../src/knowledge/index.mjs';
import {createHybridRetriever,embeddingModels} from '../src/knowledge/embeddings.mjs';

const [command,...args] = process.argv.slice(2);
const directory = process.env.TIKTOK_KNOWLEDGE_DIR ?? privateKnowledgeDir;
try {
  if (command === 'index') {
    const result = await persistIndex(await campaignSources(),directory);
    console.log(JSON.stringify({changed:result.changed,sources:result.index.sources.length,corpusHash:result.index.corpusHash,file:result.filename},null,2));
  } else if (command === 'query' || command === 'hybrid-query') {
    const modelName=command==='hybrid-query'?args.shift():null;
    const [query,productId='sakura-cleaner-500ml',promotionKey='buy1-get1-tiktok-first50'] = args;
    const index=await loadIndex(directory);
    const hybrid=modelName?await createHybridRetriever(index,modelName,{directory}):null;
    try {
      const result = await createKnowledgePipeline(index,hybrid?{retriever:request=>hybrid.retrieve(request)}:{}).invoke({query,productId,promotionKey});
      delete result.hits;
      console.log(JSON.stringify(result,null,2));
    }finally{await hybrid?.dispose();}
  } else if (command === 'evaluate' || command === 'compare-embeddings') {
    const filename = args[0];
    if (!filename || !path.isAbsolute(filename)) throw new Error('Pass an absolute path to an explicitly labeled evaluation JSON array');
    const index=await loadIndex(directory),cases=JSON.parse(await readFile(filename,'utf8'));
    const lexical=await evaluateRetrieval(index,cases);
    if(command==='evaluate')console.log(JSON.stringify(lexical,null,2));
    else {
      const report={note:'Small labeled retrieval benchmark, not a production acceptance or content-performance benchmark',lexical,models:{}};
      for(const name of Object.keys(embeddingModels)) {
        const start=performance.now();
        const hybrid=await createHybridRetriever(index,name,{directory,allowDownload:args.includes('--download-models')});
        try{report.models[name]={model:hybrid.model,setupMs:performance.now()-start,embeddingIndexChanged:hybrid.changed,...await evaluateRetrieval(index,cases,{retriever:r=>hybrid.retrieve(r)})};}
        finally{await hybrid.dispose();}
        console.error(`Completed local ${name} retrieval benchmark`);
      }
      console.log(JSON.stringify(report,null,2));
    }
  } else throw new Error('Usage: knowledge index | query "question" | hybrid-query minilm|e5 "question" | evaluate C:\\absolute\\cases.json | compare-embeddings C:\\absolute\\cases.json [--download-models]');
} catch (e) { console.error(e.message); process.exitCode=1; }
