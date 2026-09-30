import {waveFeatures} from './features.js';
function hashSeed(values=[]){let h=2166136261>>>0;for(const v of values){const s=String(v);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}}return h>>>0}
function rng(seed){let x=seed||1;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296}}
function shuffle(a,random){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
export function permutationTest(points=[],runs=1000){
 const y=points.map(p=>Number(p?.value??p?.diffBalls??p)).filter(Number.isFinite);
 if(y.length<8)return null;
 runs=Math.max(100,Math.min(10000,Math.trunc(Number(runs)||1000)));
 const steps=y.slice(1).map((v,i)=>v-y[i]),obs=waveFeatures(y.map(value=>({value}))).turnRate;
 const random=rng(hashSeed(y));
 let extreme=0;
 for(let r=0;r<runs;r++){let v=y[0],series=[{value:v}];for(const s of shuffle(steps,random)){v+=s;series.push({value:v})}if(waveFeatures(series).turnRate>=obs)extreme++}
 const pValue=(extreme+1)/(runs+1);
 return{observedTurnRate:obs,pValue,runs,significant:pValue<0.05,n:y.length,note:'descriptive structure test; not evidence of future jackpot probability'};
}
