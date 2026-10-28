import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,cp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {root} from '../src/store.mjs';
test('isolated voice plugin exposes safe schemas and reports missing runtime instead of fabricating audio',async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'voice-mcp-')),client=new Client({name:'voice-test',version:'1.0.0'});
  try{
    await cp(path.join(root,'plugins','sakura-voice-lab'),path.join(dir,'plugin'),{recursive:true});
    await client.connect(new StdioClientTransport({command:process.execPath,args:[path.join(dir,'plugin','dist','voice-mcp.mjs')],cwd:dir,env:{...process.env,TIKTOK_CAMPAIGN_FILE:path.join(dir,'campaign.json'),TIKTOK_VOICE_HOME:path.join(dir,'voice')}}));
    const tools=(await client.listTools()).tools;assert.equal(tools.length,4);
    assert.equal(tools.find(t=>t.name==='voice_presets').annotations.readOnlyHint,true);
    assert.equal(tools.find(t=>t.name==='render_voice').inputSchema.properties.speed.maximum,2);
    assert.deepEqual(tools.find(t=>t.name==='render_voice').inputSchema.properties.referenceStyle.enum,['preset','speaker-only']);
    assert.equal(tools.find(t=>t.name==='render_voice').annotations.readOnlyHint,false);
    assert.equal((await client.callTool({name:'voice_status',arguments:{}})).isError,true);
    assert.equal((await client.callTool({name:'voice_brief',arguments:{queueId:'../../escape'}})).isError,true);
    assert.equal((await client.callTool({name:'voice_brief',arguments:{queueId:'sakura-999'}})).isError,true);
  }finally{await client.close();await rm(dir,{recursive:true,force:true});}
});
