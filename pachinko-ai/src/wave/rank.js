import {waveFeatures,cosineSimilarity} from './features.js';

const clamp=(v,min=0,max=100)=>Math.max(min,Math.min(max,Number.isFinite(v)?v:min));
const values=p=>(p||[]).map(x=>Number(x?.value??x?.diffBalls??x)).filter(Number.isFinite);
const weightedAverage=(xs=[])=>{let n=0,d=0;for(const x of xs){if(Number.isFinite(x.value)&&Number.isFinite(x.weight)){n+=x.value*x.weight;d+=x.weight}}return d?n/d:50};
const stddev=(xs=[])=>{const a=xs.filter(Number.isFinite);if(a.length<2)return 0;const m=a.reduce((s,x)=>s+x,0)/a.length;return Math.sqrt(a.reduce((s,x)=>s+(x-m)**2,0)/a.length)};

function trendScore(points=[],portion=.35){
 const y=values(points); if(y.length<3)return 50;
 const range=Math.max(1,Math.max(...y)-Math.min(...y));
 const n=Math.max(2,Math.ceil(y.length*portion)),seg=y.slice(-n);
 const slope=(seg.at(-1)-seg[0])/range;
 return clamp(50+slope*50);
}
function accelerationScore(points=[]){
 const y=values(points); if(y.length<6)return 50;
 const range=Math.max(1,Math.max(...y)-Math.min(...y)),n=Math.max(2,Math.floor(y.length/3));
 const a=y.slice(-n*2,-n),b=y.slice(-n);
 const sa=(a.at(-1)-a[0])/range,sb=(b.at(-1)-b[0])/range;
 return clamp(50+(sb-sa)*65);
}
function shapeScore(points=[]){
 const y=values(points); if(y.length<3)return 50;
 const f=waveFeatures(points),range=Math.max(1,f.range||0);
 const finishPos=clamp(((f.finish-(Math.min(...y))) / range)*100);
 const recovery=clamp(((f.fromTrough||0)/range)*100);
 const recent=trendScore(points,.35);
 const accel=accelerationScore(points);
 return clamp(finishPos*.30+recovery*.25+recent*.30+accel*.15);
}
function similarityScore(current=[],history=[]){
 const c=values(current); if(c.length<3||!history.length)return 50;
 const sims=history.map(h=>cosineSimilarity(c,values(h.points||h))).filter(Number.isFinite).map(x=>clamp((x+1)*50));
 if(!sims.length)return 50;
 sims.sort((a,b)=>b-a);
 return weightedAverage(sims.slice(0,3).map((value,i)=>({value,weight:3-i})));
}
function historyScore(history=[],days=7){
 const h=history.slice(-days);
 if(!h.length)return 50;
 return weightedAverage(h.map((d,i)=>({value:shapeScore(d.points||d),weight:i+1})));
}
function hitRushScore(machine){
 if(Number.isFinite(Number(machine.hitRushScore)))return clamp(Number(machine.hitRushScore));
 const s=machine.stats||machine.current?.stats||{};
 const starts=Number(s.totalStart??s.spins),first=Number(s.firstHits),big=Number(s.bigHits??s.rushHits);
 if(!(starts>0)||!Number.isFinite(first)||!Number.isFinite(big))return 50;
 const firstRate=first/starts*1000,bigPerFirst=first>0?big/first:0;
 return clamp(50+(firstRate-4)*6+(bigPerFirst-2)*7);
}
function hallMachineScore(machine,history){
 if(Number.isFinite(Number(machine.hallMachineScore)))return clamp(Number(machine.hallMachineScore));
 const scores=history.slice(-7).map(d=>shapeScore(d.points||d));
 if(scores.length<3)return 50;
 return clamp(75-stddev(scores)*1.1);
}
function percentileScore(value,group=[]){
 if(group.length<=1)return 50;
 const sorted=[...group].sort((a,b)=>a-b);
 let below=0,equal=0;for(const x of sorted){if(x<value)below++;else if(x===value)equal++}
 return clamp(((below+equal*.5)/sorted.length)*100);
}

/**
 * Chart-first ranking.
 * Weighting:
 * - long-term shape 40% = 7-day shape 15 + recent 3-day shape 15 + similar charts 10
 * - today's chart shape 20
 * - recent momentum / acceleration 15
 * - first-hit / RUSH behavior 10
 * - relative position within same model 10
 * - hall / machine-number repeatability 5
 */
export function rankWaves(machines=[]){
 const base=machines.map(m=>{
  const history=(Array.isArray(m.history)?m.history:[]).filter(Boolean).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
  const current=m.points||m.current?.points||[];
  const long7=historyScore(history,7);
  const long3=historyScore(history,3);
  const similar=similarityScore(current,history.slice(-7));
  const today=shapeScore(current);
  const momentum=clamp(trendScore(current,.25)*.6+accelerationScore(current)*.4);
  const hitRush=hitRushScore(m);
  const hallMachine=hallMachineScore(m,history);
  const preRelative=long7*.15+long3*.15+similar*.10+today*.20+momentum*.15+hitRush*.10+hallMachine*.05;
  return {m,history,current,long7,long3,similar,today,momentum,hitRush,hallMachine,preRelative};
 });

 const groups=new Map();
 for(const x of base){const k=String(x.m.model||'');if(!groups.has(k))groups.set(k,[]);groups.get(k).push(x.preRelative)}

 return base.map(x=>{
  const modelRelative=percentileScore(x.preRelative,groups.get(String(x.m.model||''))||[]);
  const score=clamp(
   x.long7*.15+x.long3*.15+x.similar*.10+
   x.today*.20+x.momentum*.15+x.hitRush*.10+
   modelRelative*.10+x.hallMachine*.05
  );
  return {
   machineNo:x.m.machineNo,model:x.m.model,score:Math.round(score*100)/100,
   weights:{longTerm:40,todayShape:20,momentum:15,hitRush:10,modelRelative:10,hallMachine:5},
   breakdown:{
    longTerm:{score:Math.round((x.long7*.375+x.long3*.375+x.similar*.25)*100)/100,sevenDay:x.long7,threeDay:x.long3,similarCharts:x.similar,contribution:Math.round((x.long7*.15+x.long3*.15+x.similar*.10)*100)/100},
    todayShape:{score:x.today,contribution:Math.round(x.today*.20*100)/100},
    momentum:{score:x.momentum,contribution:Math.round(x.momentum*.15*100)/100},
    hitRush:{score:x.hitRush,contribution:Math.round(x.hitRush*.10*100)/100},
    modelRelative:{score:modelRelative,contribution:Math.round(modelRelative*.10*100)/100},
    hallMachine:{score:x.hallMachine,contribution:Math.round(x.hallMachine*.05*100)/100}
   },
   features:waveFeatures(x.current),
   reasons:[
    '長期形状40%（7日15%＋3日15%＋類似チャート10%）',
    '当日グラフ20% / 直近勢い15%',
    '初当り・RUSH10% / 同一機種比較10% / 店・台癖5%'
   ],
   warning:'形状スコアは候補順位用。将来の大当りを保証する確率ではありません'
  };
 }).sort((a,b)=>b.score-a.score);
}
