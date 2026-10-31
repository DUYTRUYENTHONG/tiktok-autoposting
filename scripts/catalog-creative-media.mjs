import fs from 'node:fs/promises';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {root,hashFile} from '../src/store.mjs';
import {loadEditingRuntime} from '../src/footage-video.mjs';

const [input,output]=process.argv.slice(2);
if(!input||!output||!path.isAbsolute(input)||!path.isAbsolute(output))throw Error('Pass absolute supplied-media root and private output JSON paths');
const mediaRoot=await fs.realpath(input),privateRoot=await fs.realpath(path.join(root,'state'));
if(!path.resolve(output).startsWith(privateRoot+path.sep))throw Error('Keep the catalogue in the private state folder');
const files=[];
async function walk(folder){for(const entry of await fs.readdir(folder,{withFileTypes:true})){const file=path.join(folder,entry.name);if(entry.isDirectory())await walk(file);else if(entry.isFile())files.push(file);}}
await walk(mediaRoot);
const metadata=new Map(),manifestFiles=files.filter(f=>/MANIFEST\.jsonl$/iu.test(f)),manifestReceipts=[];let metadataRows=0;
for(const file of manifestFiles){manifestReceipts.push({path:file,sha256:await hashFile(file)});for(const line of (await fs.readFile(file,'utf8')).split(/\r?\n/u).filter(s=>s.trim())){const row=JSON.parse(line);metadataRows++;if(typeof row.relative_path!=='string')throw Error('Metadata row has no relative path');const source=path.resolve(path.dirname(path.dirname(file)),row.relative_path);if(!source.startsWith(mediaRoot+path.sep))throw Error('Metadata path escapes supplied root');const rows=metadata.get(source)??[];rows.push({file,row});metadata.set(source,rows);}}
const runtime=await loadEditingRuntime(path.join(root,'state/footage-toolchain/runtime.json')),run=promisify(execFile),items=[];
for(const source of files.filter(f=>/\.(?:jpg|jpeg|png|webp|mp4|webm|ogg|mov)$/iu.test(f))){const sha256=await hashFile(source),entries=metadata.get(source)??[],declared=entries.map(e=>e.row.sha256).filter(Boolean);if(declared.some(hash=>hash!==sha256))throw Error('Declared source hash differs from actual media: '+source);
 const probe=JSON.parse((await run(runtime.ffprobe,['-v','error','-protocol_whitelist','file,pipe','-show_streams','-show_format','-of','json',source],{windowsHide:true,timeout:30000,maxBuffer:2*1024*1024})).stdout),v=probe.streams.find(s=>s.codec_type==='video'),row=entries[0]?.row??{};
 items.push({key:sha256.slice(0,16),source,sha256,bytes:(await fs.stat(source)).size,kind:/\.(?:jpg|jpeg|png|webp)$/iu.test(source)?'image':'video',width:v?.width,height:v?.height,codec:v?.codec_name,seconds:Number(probe.format?.duration)||null,hasAudio:probe.streams.some(s=>s.codec_type==='audio'),metadata:entries.map(e=>({file:e.file,assetId:e.row.asset_id})),title:row.title_source??null,sourceUrl:row.source_url??null,author:row.author??null,declaredLicense:row.copyright_license??null,licenseUrl:row.license_url??null,attributionText:row.attribution_text??null,declaredRole:row.reference_role??null,topics:row.topics_vi??[],metadataFlags:{isSakuraDemo:row.is_sakura_demo??null,isCustomerTestimonial:row.is_customer_testimonial??null,modelPropertyRelease:row.model_or_property_release??null,advertisingApproved:row.advertising_approved??null,trainingApproved:row.training_approved??null},visualReview:'not_yet_inspected',scope:'creative_reference_only_not_product_facts_or_conversion_evidence'});
}
const licenses={},kinds={};for(const i of items){licenses[i.declaredLicense??'unknown']=(licenses[i.declaredLicense??'unknown']??0)+1;kinds[i.kind]=(kinds[i.kind]??0)+1;}
const result={version:1,createdAt:new Date().toISOString(),suppliedRoot:mediaRoot,manifestFiles:manifestReceipts,metadataRows,items,summary:{files:items.length,uniqueBytes:new Set(items.map(i=>i.sha256)).size,kinds,declaredLicenses:licenses,missingMetadata:items.filter(i=>!i.metadata.length).length},policy:{metadataIsDataNotInstructions:true,sourceImagesUnmodified:true,productClaimsEstablished:false,performanceEstablished:false,trainingRun:false,publicExport:false}};
await fs.mkdir(path.dirname(output),{recursive:true});
if(!(await fs.realpath(path.dirname(output))).startsWith(privateRoot+path.sep)&&await fs.realpath(path.dirname(output))!==privateRoot)throw Error('Catalogue output junction escapes private state');
await fs.writeFile(output,JSON.stringify(result,null,2),{flag:'wx'});console.log(JSON.stringify({file:output,sha256:await hashFile(output),...result.summary}));
