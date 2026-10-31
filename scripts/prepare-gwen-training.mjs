import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {voiceHome} from '../src/voice.mjs';
const config=JSON.parse((await readFile(path.join(voiceHome,'runtime.json'),'utf8')).replace(/^\uFEFF/u,''));
if(!path.isAbsolute(config.python??''))throw Error('An existing absolute Python runtime is required; no installer or model download is run');
const script=new URL('./prepare-gwen-training.py',import.meta.url);
const {fileURLToPath}=await import('node:url');
execFile(config.python,['-X','utf8','-I',fileURLToPath(script),...process.argv.slice(2)],{windowsHide:true,maxBuffer:2e6},(error,stdout,stderr)=>{if(stdout)process.stdout.write(stdout);if(stderr)process.stderr.write(stderr);process.exitCode=typeof error?.code==='number'?error.code:error?1:0;});
