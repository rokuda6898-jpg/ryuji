import fs from "node:fs"; import path from "node:path";
const input=process.argv[2]||"data/manifest/site777-v7-latest.json", out=process.argv[3]||"data/ranking.json";
const src=JSON.parse(fs.readFileSync(input,"utf8"));
const DAY_LABEL=["当日","前日","2日前","3日前","4日前","5日前","6日前","7日前"];
let rows=[];
if(Array.isArray(src)) rows=src;
else if(Array.isArray(src.history)) rows=src.history;
else if(src.history&&typeof src.history==="object"){
  const machines=src.machines||{};
  rows=Object.values(src.history).map(r=>{
    const m=machines[r.modelcode+"|"+r.machineNo]||{};
    return {rate:4,modelcode:r.modelcode,machineNo:String(r.machineNo),model:m.modelName||r.modelcode,day:DAY_LABEL[Number(r.day)]||String(r.day),totalStart:Number(r.stats?.totalStart)||0,firstHits:Number(r.stats?.firstHits)||0,bigHits:Number(r.stats?.bigHits)||0,currentStart:Number(r.stats?.currentStart)||0,capturedAt:r.capturedAt||null};
  });
}
if(!rows.length) throw Error("SITE777履歴データが0件です");
const v=src.validation;
if(v&&v.ok===false) throw Error("SITE777取得データが未完成です: remainingModels="+v.remainingModels+", missingHistory="+v.missingHistory+", failures="+v.failures);
const four=rows.filter(r=>Number(r.rate||4)===4),by=new Map();
const dayOrder={"7日前":0,"6日前":1,"5日前":2,"4日前":3,"3日前":4,"2日前":5,"前日":6,"当日":7};
for(const r of four){const k=(r.modelcode||r.model||"")+"|"+String(r.machineNo);if(!by.has(k))by.set(k,[]);by.get(k).push(r)}
const ranking=[];
for(const [,x] of by){
 x.sort((a,b)=>(dayOrder[a.day]??99)-(dayOrder[b.day]??99));
 const past=x.filter(r=>r.day!=="当日"),today=x.find(r=>r.day==="当日"),recent=past.slice(-7);
 if(recent.length<7||!today) continue;
 const avg=k=>recent.reduce((s,r)=>s+(Number(r[k])||0),0/recent.length;
 const avgStart=avg("totalStart"),avgFirst=avg("firstHits"),avgCurrent=avg("currentStart");
 const active=Math.min(30,avgStart/50),first=Math.min(25,avgFirst*4),depth=Math.min(20,avgCurrent/25);
 const todayDepth=Math.min(15,(Number(today.currentStart)||0)/30),sample=10;
 const score=Math.round(Math.min(100,active+first+depth+todayDepth+sample));
 ranking.push({machineNo:x[0].machineNo,model:x[0].model,modelcode:x[0].modelcode||null,score,samples:recent.length,today,reasons:["7日平均累計スタート "+Math.round(avgStart),"7日平均初当り "+avgFirst.toFixed(1),"7日平均最終/現在スタート "+Math.round(avgCurrent),"当日現在スタート "+(Number(today.currentStart)||0)]});
}
ranking.sort((a,b)=>b.score-a.score);
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify({generatedAt:new Date().toISOString(),scope:"4-yen SITE777 8-day",sourceSchema:src.schemaVersion||"legacy",inputRows:four.length,rankedMachines:ranking.length,ranking},null,2));
console.log("SITE777 rows:",four.length,"ranked machines:",ranking.length);console.log(ranking.slice(0,10));
