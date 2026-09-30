export function splitWalkForward(days,minTrain=7){
 const sorted=[...days].filter(x=>x?.date).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
 const folds=[];
 for(let i=minTrain;i<sorted.length;i++)folds.push({train:sorted.slice(0,i),test:sorted[i]});
 return folds;
}
export function summarizeFold(rows,k=10){
 const eligible=rows.filter(x=>Number.isFinite(Number(x.score))&&x.outcome&&Number.isFinite(Number(x.outcome.fromSnapshotToClose)));
 const top=eligible.slice().sort((a,b)=>Number(b.score)-Number(a.score)).slice(0,k);
 const wins=top.filter(x=>x.outcome.positiveClose===true).length;
 const avg=top.length?top.reduce((s,x)=>s+Number(x.outcome.fromSnapshotToClose),0)/top.length:null;
 return{k,n:top.length,precision:top.length?wins/top.length:null,avgCloseMove:avg,coverage:rows.length?eligible.length/rows.length:0};
}
export function summarizeWalkForward(folds=[]){
 const valid=folds.filter(f=>f?.summary?.precision!=null);
 const weightedN=valid.reduce((s,f)=>s+(f.summary.n||0),0);
 return{
  folds:folds.length,
  evaluatedFolds:valid.length,
  evaluatedCandidates:weightedN,
  weightedPrecision:weightedN?valid.reduce((s,f)=>s+(f.summary.precision||0)*(f.summary.n||0),0)/weightedN:null,
  weightedAvgCloseMove:weightedN?valid.reduce((s,f)=>s+(f.summary.avgCloseMove||0)*(f.summary.n||0),0)/weightedN:null
 };
}
