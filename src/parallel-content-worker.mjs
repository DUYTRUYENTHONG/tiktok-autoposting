import {parentPort,workerData} from 'node:worker_threads';
import {loadIndex,createKnowledgePipeline} from './knowledge/index.mjs';

try {
  const index = await loadIndex();
  const result = await createKnowledgePipeline(index).invoke({query:workerData.query,productId:'sakura-cleaner-500ml',promotionKey:'evergreen-no-discount'});
  delete result.hits;
  parentPort.postMessage({ok:true,result:{...result, note:'Local retrieval and prompt preparation only; no model-generated media or posting.'}});
} catch (error) {
  parentPort.postMessage({ok:false,error:String(error?.message ?? error)});
}
