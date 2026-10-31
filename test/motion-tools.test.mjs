import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {root,hashFile} from '../src/store.mjs';
import {privateMotionFile,inspectMotionReceipt} from '../src/motion-tools.mjs';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';

test('motion tools use actual private bytes and reject path escapes and changed video',async()=>{
  const directory=await fs.mkdtemp(path.join(root,'state/motion-test-'));
  try{
    const video=path.join(directory,'fixture.mp4'),receipt=path.join(directory,'receipt.json');
    await fs.writeFile(video,'technical fixture, not playable video');
    await fs.writeFile(receipt,JSON.stringify({path:video,sha256:await hashFile(video),animation:{engine:'Sakura JavaScript Canvas'},published:false,scheduled:false}));
    assert.equal((await inspectMotionReceipt(receipt)).video,await fs.realpath(video));
    await assert.rejects(privateMotionFile(path.join(root,'package.json')),/escapes/);
    await assert.rejects(privateMotionFile('relative.json'),/absolute/);
    await assert.rejects(privateMotionFile(video),/artifact path/);
    const junction=path.join(directory,'outside');await fs.symlink(root,junction,'junction');
    await assert.rejects(privateMotionFile(path.join(junction,'package.json')),/escapes/);
    await fs.unlink(junction);
    await fs.appendFile(video,'changed');await assert.rejects(inspectMotionReceipt(receipt),/bytes differ/);
  }finally{await fs.rm(directory,{recursive:true,force:true});}
});

for(const server of ['src/motion-mcp.mjs','dist/sakura-motion-mcp.mjs'])test('motion MCP exposes scoped local tools: '+server,async()=>{
  const client=new Client({name:'motion-test',version:'1.0.0'});
  try{
    await client.connect(new StdioClientTransport({command:process.execPath,args:[path.join(root,server)]}));
    const tools=(await client.listTools()).tools;
    assert.deepEqual(tools.map(t=>t.name),['motion_status','motion_inspect','motion_quality','motion_render']);
    assert.equal(tools.find(t=>t.name==='motion_render').annotations.readOnlyHint,false);
    assert.equal(tools.find(t=>t.name==='motion_quality').annotations.readOnlyHint,true);
    const status=await client.callTool({name:'motion_status',arguments:{}});
    assert.equal(JSON.parse(status.content[0].text).cloudProvidersEnabled,false);
    const outside=await client.callTool({name:'motion_render',arguments:{planFile:path.join(root,'package.json')}});
    assert.equal(outside.isError,true);assert.match(outside.content[0].text,/escapes/);
  }finally{await client.close();}
});
