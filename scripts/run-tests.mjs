import {readdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const directory=new URL('../test/',import.meta.url);
const files=(await readdir(directory)).filter(name=>name.endsWith('.test.mjs')).sort().map(name=>fileURLToPath(new URL(name,directory)));
if(!files.length)throw Error('No project tests found');
const child=spawn(process.execPath,['--test',...files],{stdio:'inherit',windowsHide:true});
child.on('error',error=>{console.error(error.message);process.exitCode=1;});
child.on('exit',(code,signal)=>{process.exitCode=code??(signal?1:0);});
