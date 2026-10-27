import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,copyFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {root} from '../src/store.mjs';

test('MCP initializes, validates tool inputs, and exposes local read-only campaign tools',async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'sakura-mcp-'));
  const client=new Client({name:'test-client',version:'1.0.0'});
  const transport=new StdioClientTransport({command:process.execPath,args:[path.join(root,'src','mcp.mjs')],env:{...process.env,TIKTOK_CAMPAIGN_FILE:path.join(dir,'campaign.json')}});
  try{
    await client.connect(transport);
    const listed=await client.listTools();assert.equal(listed.tools.length,4);
    assert.ok(listed.tools.every(t=>t.annotations.readOnlyHint));
    const result=await client.callTool({name:'campaign_summary',arguments:{}});
    assert.equal(result.isError,undefined);assert.match(result.content[0].text,/saigomlia/);
    const invalid=await client.callTool({name:'creative_brief',arguments:{queueId:42}});assert.equal(invalid.isError,true);
  }finally{await client.close();await rm(dir,{recursive:true,force:true});}
});
test('bundled plugin starts without importing node_modules at runtime',async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'sakura-bundle-'));
  const bundle=path.join(dir,'server.mjs');
  await copyFile(path.join(root,'dist','sakura-mcp.mjs'),bundle);
  const client=new Client({name:'bundle-test',version:'1.0.0'});
  const transport=new StdioClientTransport({command:process.execPath,args:[bundle],cwd:dir,env:{...process.env,TIKTOK_CAMPAIGN_FILE:path.join(dir,'campaign.json')}});
  try{
    await client.connect(transport);assert.equal((await client.listTools()).tools.length,4);
    const result=await client.callTool({name:'campaign_summary',arguments:{}});
    assert.equal(JSON.parse(result.content[0].text).dailyKpi.target,20);
  }finally{await client.close();await rm(dir,{recursive:true,force:true});}
});
