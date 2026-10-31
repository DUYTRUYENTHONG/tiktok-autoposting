import fs from 'node:fs/promises';
import {motionStatus,inspectMotionReceipt,motionQuality,renderMotionPlan,privateMotionFile} from '../src/motion-tools.mjs';
const [command,file,output]=process.argv.slice(2);
let result;
if(command==='status')result=await motionStatus();
else if(command==='inspect')result=await inspectMotionReceipt(file);
else if(command==='render')result=await renderMotionPlan(file);
else if(command==='quality'){
  result=await motionQuality(file);
  if(output){
    // Output must be a new file beside the verified private receipt.
    const receipt=await privateMotionFile(file);
    const path=await import('node:path');
    if(path.default.resolve(output)!==path.default.join(path.default.dirname(receipt),'quality-report.json'))throw Error('Write quality-report.json beside the receipt');
    await fs.writeFile(output,JSON.stringify(result,null,2),{flag:'wx'});
  }
}else throw Error('Use status | inspect RECEIPT | quality RECEIPT [OUTPUT] | render PLAN');
console.log(JSON.stringify(result,null,2));
