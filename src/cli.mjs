import {readFile,writeFile,mkdir,readdir,cp} from 'node:fs/promises';
import {homedir} from 'node:os';
import path from 'node:path';
import {emptyState,mergeImport,buildBriefs,analyze,recommendSlots} from './engine.mjs';
import {root,loadState,saveState,updateState,ingestFolder} from './store.mjs';

const [command,...args]=process.argv.slice(2);
try{
  if(command==='init'){
    const state=await loadState();await saveState(state);console.log('Đã khởi tạo dữ liệu cục bộ; chưa bật đăng bài.');
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
    const state=await loadState();console.log(JSON.stringify({analysis:analyze(state),schedule:recommendSlots(state)},null,2));
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
    console.log('Lệnh: init | ingest <thư-mục> --area <khu-vực> | import <json> | brief | status | install-skills <deerflow>');
    if(command)process.exitCode=1;
  }
}catch(e){console.error(e.message);process.exitCode=1;}
