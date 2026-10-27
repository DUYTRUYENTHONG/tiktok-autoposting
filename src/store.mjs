import {readFile,writeFile,mkdir,rename,readdir,lstat,open,unlink} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {emptyState} from './engine.mjs';

export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const defaultFile=path.join(root,'state','campaign.json');
export async function loadState(file=defaultFile){
  try{return JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')return emptyState();throw e;}
}
export async function saveState(state,file=defaultFile){
  await mkdir(path.dirname(file),{recursive:true});
  const temporary=`${file}.${randomUUID()}.tmp`;
  await writeFile(temporary,JSON.stringify({...state,updatedAt:new Date().toISOString()},null,2),'utf8');
  await rename(temporary,file);
}
export async function updateState(transform,file=defaultFile){
  await mkdir(path.dirname(file),{recursive:true});
  const lock=`${file}.lock`; let handle;
  for(let attempt=0;attempt<40;attempt++){
    try{handle=await open(lock,'wx');break;}catch(e){if(e.code!=='EEXIST')throw e;await new Promise(resolve=>setTimeout(resolve,25));}
  }
  if(!handle)throw new Error('Dữ liệu đang được cập nhật; kiểm tra tiến trình đang chạy trước khi thử lại');
  try{const state=await transform(await loadState(file));await saveState(state,file);return state;}
  finally{await handle.close();await unlink(lock);}
}
export async function hashFile(file){const hash=createHash('sha256');for await(const chunk of createReadStream(file))hash.update(chunk);return hash.digest('hex');}
const media=/\.(jpe?g|png|webp|mp4|mov|webm)$/i;
export async function ingestFolder(directory,area){
  if(!path.isAbsolute(directory))throw new Error('Cần đường dẫn thư mục tuyệt đối');
  if(!area?.trim())throw new Error('Cần khu vực phục vụ');
  const info=await lstat(directory);if(!info.isDirectory()||info.isSymbolicLink())throw new Error('Đường dẫn phải là thư mục thật');
  const products=[];let count=0;
  async function walk(dir,depth=0){
    if(depth>5)throw new Error('Thư mục vượt quá 5 cấp');
    const entries=await readdir(dir,{withFileTypes:true});
    const files=entries.filter(e=>e.isFile()&&!e.name.startsWith('.')&&!/(?:cookie|secret|credential|token)/i.test(e.name));
    let facts={};const manifest=files.find(e=>e.name==='product.json');
    if(manifest){const filename=path.join(dir,manifest.name);if((await lstat(filename)).size>1048576)throw new Error('product.json quá lớn');facts=JSON.parse(await readFile(filename,'utf8'));if(!facts||typeof facts!=='object'||Array.isArray(facts))throw new Error('product.json phải là đối tượng');}
    const assets=[];
    for(const f of files.filter(e=>media.test(e.name))){
      if(++count>2000)throw new Error('Thư mục vượt quá 2.000 tài sản');
      const filename=path.join(dir,f.name);const stat=await lstat(filename);
      assets.push({path:filename,name:f.name,bytes:stat.size,sha256:await hashFile(filename),kind:/\.(mp4|mov|webm)$/i.test(f.name)?'video':'image'});
    }
    if(assets.length||manifest){
      const id=createHash('sha256').update(path.resolve(dir).toLowerCase()).digest('hex').slice(0,12);
      products.push({id,name:typeof facts.name==='string'?facts.name:path.basename(dir),area,facts,assets,sourceDirectory:dir});
    }
    for(const d of entries.filter(e=>e.isDirectory()&&!e.name.startsWith('.')&&!['node_modules','state','profiles'].includes(e.name)))await walk(path.join(dir,d.name),depth+1);
  }
  await walk(path.resolve(directory));return products;
}
