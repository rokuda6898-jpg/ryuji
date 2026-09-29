import fs from "node:fs"; import path from "node:path";
const input=process.argv[2]||"data/history.json", out=process.argv[3]||"data/ranking.json";
const rows=JSON.parse(fs.readFileSync(input,"utf8")).filter(r=>Number(r.rate)===4), by=new Map();
for(const r of rows){const k=String(r.machineNo); if(!by.has(k))by.set(k,[]); by.get(k).push(r)}
const ranking=[];
for(const [machineNo,x] of by){x.sort((a,b)=>String(a.date).localeCompare(String(b.date))); const recent=x.slice(-7); const avg=k=>recent.reduce((s,r)=>s+(Number(r[k])||0),0)/Math.max(1,recent.length); const diff3=recent.slice(-3).reduce((s,r)=>s+(Number(r.diffBalls)||0),0); const volatility=Math.min(25,Math.abs(avg("diffBalls"))/1000), slump=Math.min(30,Math.max(0,-diff3/1500)), activity=Math.min(25,avg("spins")/100), sample=Math.min(20,x.length), score=Math.round(Math.min(100,volatility+slump+activity+sample)); ranking.push({machineNo,model:recent.at(-1)?.model||"",score,samples:x.length,reasons:[diff3<0?"直近3日が弱い":"直近3日は強め","7日平均回転 "+Math.round(avg("spins")),"履歴 "+x.length+"日"]})}
ranking.sort((a,b)=>b.score-a.score); fs.mkdirSync(path.dirname(out),{recursive:true}); fs.writeFileSync(out,JSON.stringify({generatedAt:new Date().toISOString(),scope:"4-yen-only",ranking},null,2)); console.log(ranking.slice(0,10));
