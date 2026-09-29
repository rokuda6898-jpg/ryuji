import fs from 'node:fs';
const rows=JSON.parse(fs.readFileSync(process.argv[2]||'data/history.json','utf8')).filter(x=>Number(x.rate)===4).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
const dates=[...new Set(rows.map(x=>x.date))],tests=[];
for(let i=7;i<dates.length;i++){const d=dates[i],past=rows.filter(x=>x.date<d),today=rows.filter(x=>x.date===d),m=new Map();for(const r of past){const k=String(r.machineNo);if(!m.has(k))m.set(k,[]);m.get(k).push(r)}const scores=[...m].map(([k,x])=>{const r=x.slice(-7),diff3=r.slice(-3).reduce((s,z)=>s+(+z.diffBalls||0),0);return{k,score:Math.max(0,-diff3)}}).sort((a,b)=>b.score-a.score).slice(0,10);const hit=scores.filter(s=>(today.find(x=>String(x.machineNo)===s.k)?.diffBalls||0)>0).length;tests.push({date:d,top10Positive:hit})}
console.log(JSON.stringify({days:tests.length,avgTop10Positive:tests.length?tests.reduce((s,x)=>s+x.top10Positive,0)/tests.length:null,tests},null,2));
