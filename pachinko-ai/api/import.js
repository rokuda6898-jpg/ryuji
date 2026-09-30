import { parseSite777GraphList } from '../src/importers/site777-html.js';
export default async function handler(req,res){
 if(req.method!=='POST') return res.status(405).json({ok:false,error:'POST only'});
 try{
  const html=typeof req.body==='string'?req.body:(req.body?.html||'');
  if(!html) return res.status(400).json({ok:false,error:'html required'});
  const p=parseSite777GraphList(html);
  const sea=[/海物語/i,/大海/i,/スーパー海/i,/新海/i,/沖海/i,/地中海/i,/わんわんパラダイス/i];
  if(p.rate!==4) return res.status(400).json({ok:false,error:'4-yen only'});
  if(sea.some(x=>x.test(p.model||''))) return res.status(400).json({ok:false,error:'sea series excluded'});
  if(!p.machines.length) return res.status(400).json({ok:false,error:'no machines found'});
  return res.status(200).json({ok:true,capturedAt:new Date().toISOString(),model:p.model,day:p.day,machines:p.machines});
 }catch(e){return res.status(500).json({ok:false,error:e.message})}
}
