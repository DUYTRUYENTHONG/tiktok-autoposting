import path from 'node:path';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {privateKnowledgeDir,hash,retrieve} from './index.mjs';

// Pinned Hub revisions, recorded from the public model API on 2026-10-28.
export const embeddingModels = {
  minilm:{id:'Xenova/paraphrase-multilingual-MiniLM-L12-v2',revision:'2c4055b12046f11709e9df2c122e59ffbdc2f900',queryPrefix:'',passagePrefix:'',minCosine:0.5},
  e5:{id:'Xenova/multilingual-e5-small',revision:'761b726dd34fb83930e26aab4e9ac3899aa1fa78',queryPrefix:'query: ',passagePrefix:'passage: ',minCosine:0.75},
};

export async function createLocalEmbedder(name,{directory=privateKnowledgeDir,allowDownload=false}={}) {
  const model=embeddingModels[name];if(!model)throw new Error('Choose embedding model minilm or e5');
  const {pipeline,env}=await import('@huggingface/transformers');
  env.cacheDir=path.join(directory,'models');
  env.allowRemoteModels=allowDownload;
  // An explicit revision directory avoids v4's remote file-discovery path during offline reload.
  const modelPath=allowDownload?model.id:path.join(env.cacheDir,...model.id.split('/'),model.revision);
  const extractor=await pipeline('feature-extraction',modelPath,{revision:model.revision,dtype:'q8',device:'cpu',local_files_only:!allowDownload,
    session_options:{intra_op_num_threads:4,inter_op_num_threads:1}});
  return {model,async embed(text,{query=false}={}) {
    const result=await extractor((query?model.queryPrefix:model.passagePrefix)+text,{pooling:'mean',normalize:true});
    return Array.from(result.data);
  },async dispose(){await extractor.dispose();}};
}

export async function createHybridRetriever(index,name,{directory=privateKnowledgeDir,allowDownload=false}={}) {
  const embedder=await createLocalEmbedder(name,{directory,allowDownload});
  const filename=path.join(directory,`embeddings-${name}.json`);
  let saved;
  try{saved=JSON.parse(await readFile(filename,'utf8'));}catch(e){if(e.code!=='ENOENT'){await embedder.dispose();throw e;}}
  let changed=false;
  if(saved?.version!==1||saved?.corpusHash!==index.corpusHash||saved?.revision!==embedder.model.revision||saved?.modelId!==embedder.model.id||saved?.dtype!=='q8'||saved?.pooling!=='mean'||saved?.normalize!==true) {
    const vectors={};
    for(const source of index.sources)vectors[source.sourceId]=await embedder.embed(source.text);
    saved={version:1,corpusHash:index.corpusHash,modelId:embedder.model.id,revision:embedder.model.revision,dtype:'q8',pooling:'mean',normalize:true,vectors};
    saved.vectorHash=hash(vectors);
    await mkdir(directory,{recursive:true});await writeFile(filename,JSON.stringify(saved),{mode:0o600});changed=true;
  }
  if(saved.vectorHash!==hash(saved.vectors)){await embedder.dispose();throw new Error('Embedding checksum mismatch');}
  return {model:embedder.model,changed,filename,dispose:()=>embedder.dispose(),async retrieve(request) {
    const started=performance.now();
    const queryVector=await embedder.embed(request.query,{query:true});
    return {...retrieve(index,{...request,dense:{modelId:embedder.model.id,revision:embedder.model.revision,sourceVectors:saved.vectors,queryVector,minCosine:embedder.model.minCosine}}),latencyMs:performance.now()-started};
  }};
}
