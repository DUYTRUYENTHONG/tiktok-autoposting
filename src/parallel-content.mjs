import {Worker} from 'node:worker_threads';

// Isolated, bounded editorial preparation. Never submits or changes campaign state.
export function validateContentJobs(jobs) {
  if (!Array.isArray(jobs) || jobs.length < 1 || jobs.length > 50) throw Error('Supply 1–50 content jobs');
  const seen = new Set();
  const queries = new Set();
  for (const job of jobs) {
    if (!job || typeof job.id !== 'string' || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(job.id) || seen.has(job.id)) throw Error('Job IDs must be unique lowercase identifiers');
    if (typeof job.query !== 'string' || !job.query.trim() || job.query.length > 500) throw Error('Each job needs a query of at most 500 characters');
    const normalized = job.query.trim().replace(/\s+/g,' ').toLocaleLowerCase('vi');
    if (queries.has(normalized)) throw Error('Each job requires a distinct query');
    seen.add(job.id);
    queries.add(normalized);
  }
  return jobs;
}

export async function runBounded(jobs, work, concurrency = 3) {
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 3) throw Error('Concurrency must be 1–3');
  let next = 0;
  const results = Array(jobs.length);
  await Promise.all(Array.from({length:Math.min(concurrency,jobs.length)}, async () => {
    while (next < jobs.length) {
      const index = next++;
      try { results[index] = {id:jobs[index].id, status:'completed', result:await work(jobs[index])}; }
      catch (error) { results[index] = {id:jobs[index].id, status:'failed', error:String(error?.message ?? error)}; }
    }
  }));
  return results;
}

export function runContentWorker(job) {
  return new Promise((resolve,reject) => {
    const worker = new Worker(new URL('./parallel-content-worker.mjs',import.meta.url), {workerData:job});
    let received = false;
    worker.once('message', message => { received = true; message.ok ? resolve(message.result) : reject(Error(message.error)); });
    worker.once('error', reject);
    worker.once('exit', code => { if (!received) reject(Error(`Content worker exited before a result (${code})`)); });
  });
}
