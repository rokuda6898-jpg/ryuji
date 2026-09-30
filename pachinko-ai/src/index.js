import fs from "node:fs"; import path from "node:path";
const input=process.argv[2]||"data/manifest/site777-4yen-latest.json", out=process.argv[3]||"data/ranking.json";
const src=JSON.parse(fs.readFileSync(input,"utf8")), raw=Array.isArray(src)?src:(src.history||[]);
const rows=raw.filter(r=>Number(r.rate||4)===4), by=new Map();
const dayOrder={"7日前":0,"6日前":1,"5日前":2,"4日前":3,"3日前":4,"2日前":5,"前日":6,"当日":7};
for(const r of rows){const k=String(r.machineNo);if(!by.has(k))by.set(k,[]);by.get(k).push(r)}
const ranking=[];
for(const [machineNo,x] of by){
 x.sort((a,b)=>(dayOrder[a.day]??99)-(dayOrder[b.day]??99));
 const past=x.filter(r=>r.day!=="当日"),today=x.find(r=>r.day==="当日"),recent=past.slice(-7);
 const avg=k=>recent.reduce((s,r)=>s+(Number(r[k])||0),0)/Math.max(1,recent.length);
 const avgStart=avg("totalStart"),avgFirst=avg("firstHits"),avgCurrent=avg("currentStart");
 const active=Math.min(30,avgStart/50),first=Math.min(25,avgFirst*4),depth=Math.min(20,avgCurrent/25);
 const todayDepth=Math.min(15,(Number(today?.currentStart)||0)/30),sample=Math.min(10,recent.length*1.5);
 const score=Math.round(Math.min(100,active+first+depth+todayDepth+sample));
 ranking.push({machineNo,model:x[0]?.model||"",score,samples:recent.length,today:today||null,reasons:["7日平均累計スタート "+Math.round(avgStart),"7日平均初当り "+avgFirst.toFixed(1),"7日平均最終/現在スタート "+Math.round(avgCurrent),"当日現在スタート "+(Number(today?.currentStart)||0)]});
}
ranking.sort((a,b)=>b.score-a.score);fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify({generatedAt:new Date().toISOString(),scope:"4-yen SITE777 8-day",ranking},null,2));console.log(ranking.slice(0,10));