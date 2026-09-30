import {waveFeatures} from './features.js';

/**
 * Evidence-based wave ranking. This is a descriptive prioritization score,
 * not a claim that past graph shape changes the independent probability of a future jackpot.
 */
export function rankWaves(machines=[]){
 return machines.map(m=>{
  const f=waveFeatures(m.points||[]);
  const n=f.n||0;
  const sample=Math.min(35,n/4);
  const activity=Math.min(25,Math.log1p(Math.max(0,f.range||0))/Math.log(10)*6);
  const stability=Math.min(20,Math.log1p(Math.max(0,f.stepVolatility||0))/Math.log(10)*5);
  const structure=Math.min(20,(f.turnRate||0)*30);
  const score=Math.round(Math.min(100,sample+activity+stability+structure));
  return {
   machineNo:m.machineNo,model:m.model,score,features:f,
   reasons:[
    'グラフ点数 '+n,
    '変動幅 '+Math.round(f.range||0),
    '方向転換率 '+((f.turnRate||0)*100).toFixed(1)+'%',
    'ステップ変動 '+Math.round(f.stepVolatility||0)
   ],
   warning:'過去の波形だけで次の大当り確率が上がるとは判定しない'
  };
 }).sort((a,b)=>b.score-a.score);
}
