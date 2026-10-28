import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import path from 'node:path';
import {homedir} from 'node:os';
import {createHash} from 'node:crypto';
import {root,hashFile} from '../src/store.mjs';
import {loadEditingRuntime,wrapVideoText} from '../src/footage-video.mjs';
const run=promisify(execFile),input=process.argv[2];
if(!input||!path.isAbsolute(input))throw Error('Pass an absolute private carousel brief manifest');
const brief=JSON.parse(await readFile(input,'utf8'));
if(brief.mode!=='retrieval-grounded-editorial-template'||brief.fineTunedModelUsed!==false||brief.posts.length!==10||brief.promotionKey!=='buy1-get1-tiktok-first50')throw Error('Expected ten source-grounded unsubmitted carousel drafts');
const review=JSON.parse(await readFile(path.join(root,'state','carousel-image-review.json'),'utf8'));
const pool=review.images.filter(i=>i.catalogHashMatches&&i.crop3x4?.visuallyInspected&&i.notSakuraDemo&&i.notEndorsement);
if(pool.length<10)throw Error('At least ten reviewed stock images are required');
const runtime=await loadEditingRuntime(path.join(root,'state','footage-toolchain','runtime.json'));
const selections=[['I001','I039','I006'],['I006','I010','I075'],['I020','I014','I016'],['I067','I075','I073'],['I036','I072','I004'],['I004','I100','I006'],['I070','I067','I073'],['I012','I004','I006'],['I019','I020','I061'],['I077','I073','I006']];
const product='C:/Users/CROSSIAN/Downloads/nước tẩy đa năng sakura/Sakura_10_Carousel_50_Anh/Sakura_10_Carousel/Anh_tham_chieu/Sakura_nuoc_lau_500ml.jpg',productHash=await hashFile(product);
const photoSelections=pool.map(i=>({id:i.id,sha256:i.sourceSha256,crop:i.crop3x4.normalizedBox}));
const digest=createHash('sha256').update(JSON.stringify({brief:brief.briefsHash,photoSelections,selections,productHash,renderer:'photo-layout-v2'})).digest('hex').slice(0,16);
const output=path.join(homedir(),'.codex','data','tiktok-autoposting','carousel-footage',`rendered-${digest}`);await mkdir(output,{recursive:true});
await copyFile('C:/Windows/Fonts/arial.ttf',path.join(output,'font.ttf'));await copyFile('C:/Windows/Fonts/arialbd.ttf',path.join(output,'bold.ttf'));
const manifest={...brief,renderedAt:new Date().toISOString(),output,renderer:'photo-layout-v2',renderedPosts:[],publication:{authorizedByThisManifest:false,canonicalQueueModified:false,submittedCount:0},visualReviewStatus:'needs_final_review'};
for(const [postIndex,post] of brief.posts.entries()){
  const slides=[];
  for(const slide of post.slides){
    const stock=slide.order!==4;
    const image=stock?pool.find(i=>i.id===selections[postIndex][slide.order-1]):null;
    if(stock&&!image)throw Error('Selected story image lacks reviewed crop');
    const source=image?.source??product,sourceHash=image?.sourceSha256??productHash;
    if(await hashFile(source)!==sourceHash)throw Error('Source image checksum changed');
    const c=image?.crop3x4;
    if(stock&&(![c.x,c.y,c.width,c.height].every(Number.isInteger)||c.width<=0||c.height<=0))throw Error('Reviewed crop missing pixel dimensions');
    const prefix=`${post.id}-${slide.order}`,texts={heading:wrapVideoText(slide.heading,27),body:slide.body.split('\n').map(part=>wrapVideoText(part,slide.order===1?28:38)).join('\n'),footer:wrapVideoText(stock?'Ảnh minh họa · Không phải thử nghiệm Sakura':slide.footer,54),number:`${slide.order}/4`};
    if(texts.heading.split('\n').length>2||texts.body.split('\n').length>6||texts.footer.split('\n').length>2)throw Error('Text exceeds reviewed layout budget: '+prefix);
    for(const [key,value] of Object.entries(texts))await writeFile(path.join(output,`${prefix}-${key}.txt`),value,'utf8');
    const draw=(name,size,y,{bold=false,color='0x392343'}={})=>`drawtext=fontfile=${bold?'bold.ttf':'font.ttf'}:textfile=${prefix}-${name}.txt:expansion=none:fontsize=${size}:fontcolor=${color}:x=(w-tw)/2:y=${y}:line_spacing=11`;
    const framing=stock?`crop=${c.width}:${c.height}:${c.x}:${c.y},scale=1080:1440`:'scale=1000:650:force_original_aspect_ratio=decrease,pad=1080:1440:(ow-iw)/2:250:color=0xf8f2ed';
    const filters=[framing,'drawbox=x=0:y=0:w=1080:h=230:color=0x392343:t=fill','drawbox=x=0:y=920:w=1080:h=520:color=0xf8f2ed@0.96:t=fill',draw('heading',slide.order===1?78:60,48,{bold:true,color:'white'}),draw('body',slide.order===1?60:48,961,{bold:slide.order===1}),draw('footer',31,1320),`drawtext=fontfile=bold.ttf:textfile=${prefix}-number.txt:fontsize=32:fontcolor=white:box=1:boxcolor=0x392343@0.8:boxborderw=12:x=w-tw-45:y=265`];
    const destination=path.join(output,prefix+'.jpg');
    await run(runtime.ffmpeg,['-hide_banner','-loglevel','error','-y','-i',source,'-vf',filters.join(','),'-frames:v','1','-q:v','2','-threads','2',destination],{cwd:output,timeout:30000,windowsHide:true});
    const {stdout}=await run(runtime.ffprobe,['-v','error','-show_streams','-of','json',destination],{windowsHide:true});const probe=JSON.parse(stdout).streams[0];
    if(probe.width!==1080||probe.height!==1440)throw Error('Carousel dimensions failed');
    slides.push({...slide,path:destination,sha256:await hashFile(destination),asset:{kind:stock?'stock-photo-illustration':'authentic-product-reference',path:source,sha256:sourceHash,sourceId:image?.id??null,sourceUrl:image?.sourceUrl??null,crop:c??null,sourceVisuallyReviewed:stock,finalVisuallyReviewed:false},printedAiWording:false});
  }
  manifest.renderedPosts.push({...post,slides,status:'rendered_needs_final_visual_review',publicationVerified:false});
}
const file=path.join(output,'manifest.json');await writeFile(file,JSON.stringify(manifest,null,2));
console.log(JSON.stringify({manifest:file,posts:manifest.renderedPosts.length,slides:40,fineTunedModelUsed:false,status:manifest.visualReviewStatus}));
