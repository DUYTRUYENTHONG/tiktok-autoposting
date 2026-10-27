import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {loadState,root} from './store.mjs';
import {analyze,recommendSlots} from './engine.mjs';

export function createServer(stateFile){
  const files={'/':['index.html','text/html; charset=utf-8'],'/app.js':['app.js','text/javascript; charset=utf-8'],'/style.css':['style.css','text/css; charset=utf-8']};
  return http.createServer(async(req,res)=>{
    const host=req.headers.host??'';
    if(!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host)){res.writeHead(403);res.end('Forbidden');return;}
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Cache-Control','no-store');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'");
    if(req.method!=='GET'){res.writeHead(405);res.end('Read-only');return;}
    try{
      const url=new URL(req.url,'http://localhost');
      if(url.pathname==='/api/state'){
        const state=await loadState(stateFile);
        const products=state.products.map(({sourceDirectory,assets,...p})=>({...p,assets:assets.map(({path:filename,...asset})=>asset)}));
        const angles=state.angles.map(({assets,...a})=>a);
        const analysis=analyze({...state,angles});
        const output={...state,products,angles,analysis,schedule:recommendSlots(state),connections:{metrics:'Nhập số liệu cục bộ · chưa kết nối TikTok tự động',publishing:'Chưa bật đăng tự động',deerflow:'Đã clone · chưa chạy dịch vụ'},now:new Date().toISOString()};
        res.writeHead(200,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(output));return;
      }
      if(!files[url.pathname]){res.writeHead(404);res.end('Not found');return;}
      const [file,type]=files[url.pathname];const content=await readFile(path.join(root,'public',file));
      res.writeHead(200,{'Content-Type':type});res.end(content);
    }catch(e){res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Không thể đọc dữ liệu; kiểm tra tệp cục bộ.'}));}
  });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  const port=Number(process.env.TIKTOK_TRACKER_PORT??4318);
  createServer().listen(port,'127.0.0.1',()=>console.log(`Tracker: http://127.0.0.1:${port}`));
}
