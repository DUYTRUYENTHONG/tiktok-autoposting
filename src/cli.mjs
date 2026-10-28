import {readFile,writeFile,mkdir,readdir,cp} from 'node:fs/promises';
import {homedir} from 'node:os';
import path from 'node:path';
import {emptyState,mergeImport,buildBriefs,analyze,recommendSlots} from './engine.mjs';
import {root,loadState,saveState,updateState,ingestFolder} from './store.mjs';
import {prepareSakura} from './sakura.mjs';
import {dailyKpi,leadSummary} from './daily-kpi.mjs';

const [command,...args]=process.argv.slice(2);
try{
  if(command==='init'){
    const state=await loadState();await saveState(state);console.log('Đã khởi tạo dữ liệu cục bộ; chưa bật đăng bài.');
  }else if(command==='sakura'){
    const result=await prepareSakura(args[0]);
    await updateState(state=>{
      const priorQueue=new Map((state.queue??[]).map(x=>[x.id,x]));
      return {...state,products:[...state.products.filter(p=>p.id!==result.product.id),result.product],angles:[...state.angles.filter(a=>a.productId!==result.product.id),...result.angles],queue:result.queue.map(q=>priorQueue.get(q.id)??q),campaign:{...result.campaign,...state.campaign}};
    });
    console.log(`Đã chuẩn bị 100 brief; ${result.campaign.existingCarouselSets} bộ ảnh nguồn cần QA; chưa đăng bài.`);
  }else if(command==='ingest'){
    const areaIndex=args.indexOf('--area');const area=areaIndex>=0?args[areaIndex+1]:null;
    const products=await ingestFolder(args[0],area);
    await updateState(state=>{
      const merged=[...new Map([...state.products,...products].map(p=>[p.id,p])).values()];
      const next={...state,products:merged};const briefs=buildBriefs(next);
      next.angles=[...new Map([...briefs,...state.angles].map(a=>[a.id,a])).values()];return next;
    });console.log(`Đã nhập ${products.length} nhóm sản phẩm/tài sản. Kiểm tra cách nhóm trước khi tạo nội dung.`);
  }else if(command==='import'){
    const input=JSON.parse(await readFile(args[0],'utf8'));
    await updateState(state=>mergeImport(state,input));console.log('Đã nhập và đối soát số liệu; không cộng trùng snapshot.');
  }else if(command==='brief'){
    const state=await loadState();const briefs=buildBriefs(state);
    const file=path.join(root,'state','creative-briefs.json');await mkdir(path.dirname(file),{recursive:true});
    await writeFile(file,JSON.stringify({generatedAt:new Date().toISOString(),briefs},null,2),'utf8');console.log(file);
  }else if(command==='status'){
    const state=await loadState();console.log(JSON.stringify({dailyKpi:dailyKpi(state),leads:leadSummary(state),analysis:analyze(state),schedule:recommendSlots(state)},null,2));
  }else if(command==='install-agents'){
    const source=path.join(root,'.codex','agents');const destination=path.join(homedir(),'.codex','agents');
    await mkdir(destination,{recursive:true});
    for(const name of (await readdir(source)).filter(n=>n.endsWith('.toml'))){
      const text=await readFile(path.join(source,name),'utf8');const target=path.join(destination,name);
      try{if(await readFile(target,'utf8')!==text)throw new Error(`Agent đã tồn tại với nội dung khác: ${target}`);}
      catch(e){if(e.code!=='ENOENT')throw e;await writeFile(target,text,{encoding:'utf8',flag:'wx'});}
      console.log(target);
    }
  }else if(command==='register-plugin'||command==='register-voice-plugin'){
    const file=path.join(homedir(),'.agents','plugins','marketplace.json');let catalog={name:'duytruyenthong-personal',interface:{displayName:'DuyTruyenThong Personal Tools'},plugins:[]};
    try{catalog=JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
    const pluginRoot=command==='register-voice-plugin'?path.join(root,'plugins','sakura-voice-lab'):root;
    const relative=path.relative(homedir(),pluginRoot).split(path.sep).join('/');
    if(relative.startsWith('..')||path.isAbsolute(relative))throw new Error('Personal marketplace requires the checkout inside the user home');
    const entry={name:command==='register-voice-plugin'?'sakura-voice-lab':'sakura-content-lab',source:{source:'local',path:`./${relative}`},policy:{installation:'AVAILABLE',authentication:'ON_INSTALL'},category:'Productivity'};
    const old=catalog.plugins.find(p=>p.name===entry.name);
    if(old&&JSON.stringify(old.source)!==JSON.stringify(entry.source))throw new Error('Plugin cùng tên đã có nguồn khác; giữ nguyên cấu hình');
    if(!old){catalog.plugins.push(entry);await mkdir(path.dirname(file),{recursive:true});await writeFile(file,JSON.stringify(catalog,null,2),'utf8');}
    console.log(`Đã đăng ký nguồn plugin tại ${file}. Cần refresh/restart app và cài từ nguồn cá nhân; chưa xác nhận plugin đã được runtime tải.`);
  }else if(command==='install-skills'){
    if(!path.isAbsolute(args[0]??''))throw new Error('Cần đường dẫn DeerFlow tuyệt đối');
    const source=path.join(root,'skills');const names=(await readdir(source,{withFileTypes:true})).filter(x=>x.isDirectory()).map(x=>x.name);
    for(const base of [path.join(homedir(),'.codex','skills'),path.join(args[0],'skills','custom')]){
      for(const name of names){
        const destination=path.join(base,name);const sourceText=await readFile(path.join(source,name,'SKILL.md'),'utf8');
        try{const existing=await readFile(path.join(destination,'SKILL.md'),'utf8');if(existing!==sourceText)throw new Error(`Kỹ năng đã tồn tại với nội dung khác: ${destination}`);}
        catch(e){if(e.code!=='ENOENT')throw e;await mkdir(base,{recursive:true});await cp(path.join(source,name),destination,{recursive:true,errorOnExist:true,force:false});}
        console.log(destination);
      }
    }
  }else{
    console.log('Lệnh: init | sakura <thư-mục> | ingest <thư-mục> --area <khu-vực> | import <json> | brief | status | install-skills <deerflow>');
    if(command)process.exitCode=1;
  }
}catch(e){console.error(e.message);process.exitCode=1;}
