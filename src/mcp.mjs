import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {z} from 'zod';
import {loadState} from './store.mjs';
import {analyze,recommendSlots} from './engine.mjs';
import {dailyKpi} from './daily-kpi.mjs';

const server=new McpServer({name:'sakura-content-lab',version:'0.1.0'});
const annotations={readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false};
const result=value=>({content:[{type:'text',text:JSON.stringify(value,null,2)}]});
server.registerTool('campaign_summary',{description:'Read local Sakura campaign, verified progress and data freshness. Does not fetch TikTok.',inputSchema:{},annotations},async()=>{
  const s=await loadState();const analysis=analyze(s);const q=s.queue??[];
  return result({account:s.account,campaign:s.campaign??null,dailyKpi:dailyKpi(s),products:s.products.map(p=>({id:p.id,name:p.name,area:p.area})),analysis,progress:{planned:q.length,assetReady:q.filter(p=>p.assetsVerified).length,underReview:q.filter(p=>p.status==='under_review').length,scheduled:q.filter(p=>p.status==='scheduled'&&p.receipt?.scheduledVerifiedAt).length,published:q.filter(p=>p.status==='published'&&p.receipt?.publishedVerifiedAt).length},updatedAt:s.updatedAt});
});
server.registerTool('angle_performance',{description:'Read attributed angle signals with cohort and sample-size limitations.',inputSchema:{},annotations},async()=>result(analyze(await loadState())));
server.registerTool('recommend_schedule',{description:'Read fresh audience activity recommendations or explicitly experimental fallback slots. Does not schedule posts.',inputSchema:{},annotations},async()=>result(recommendSlots(await loadState())));
server.registerTool('creative_brief',{description:'Read a named local queue item and its Vietnamese slide/caption prompts. No generation or posting occurs.',inputSchema:{queueId:z.string().min(1).max(80)},annotations},async({queueId})=>{
  const s=await loadState();const q=(s.queue??[]).find(x=>x.id===queueId);
  if(!q)return {isError:true,content:[{type:'text',text:'Không tìm thấy queueId.'}]};
  const {assets,receipt,...brief}=q;return result({...brief,assetCount:assets.length});
});
await server.connect(new StdioServerTransport());
