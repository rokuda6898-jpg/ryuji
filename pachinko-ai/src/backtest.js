import fs from 'node:fs';
const rows=JSON.parse(fs.readFileSync(process.argv[2]||'data/history.json','utf8')).filter(x=>Number(x.rate)===4&&x.date).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
const dates=[...new Set(rows.map(x=>x.date))],tests=[];
for(let i=7;i<dates.length;i++){
 const d=dates[i],past=rows.filter(x=>x.date<d),today=rows.filter(x=>x.date===d),m=new Map();
 for(const r of past){const k=(r.modelcode||r.model||'')+'|'+String(r.machineNo);if(!m.has(k))m.set(k,[]);m.get(k).push(r)}
 const scores=[...m].map(([k,x])=>{
  const r=x.slice(-7);
  const avgStart=r.reduce((s,z)=>s+(Number(z.totalStart)||0),0)/Math.max(1,r.length);
  const avgFirst=r.reduce((s,z)=>s+(Number(z.firstHits)||0),0)/Math.max(1,r.length);
  const coverage=r.length/7;
  const score=Math.min(100,Math.min(45,avgStart/40)+Math.min(35,avgFirst*5)+Math.min(20,coverage*20));
  return{k,score,samples:r.length};
 }).filter(x=>x.samples>=5).sort((a,b)=>b.score-a.score).slice(0,10);
 const actual=new Map(today.map(x=>[((x.modelcode||x.model||'')+'|'+String(x.machineNo)),x]));
 const evaluated=scores.map(s=>({score:s.score,outcome:Number(actual.get(s.k)?.diffBalls)})).filter(x=>Number.isFinite(x.outcome));
 const positive=evaluated.filter(x=>x.outcome>0).length;
 const avgMove=evaluated.length?evaluated.reduce((s,x)=>s+x.outcome,0)/evaluated.length:null;
 tests.push({date:d,candidates:scores.length,evaluated:evaluated.length,top10Positive:positive,precision:evaluated.length?positive/evaluated.length:null,avgDiffBalls:avgMove});
}
const valid=tests.filter(x=>x.precision!=null);
console.log(JSON.stringify({days:tests.length,evaluatedDays:valid.length,avgPrecision:valid.length?valid.reduce((s,x)=>s+x.precision,0)/valid.length:null,avgDiffBalls:valid.length?valid.reduce((s,x)=>s+(x.avgDiffBalls||0),0)/valid.length:null,tests},null,2));
