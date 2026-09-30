export function futureOutcome(current,final){
 const a=current?.trace?.points||[],b=final?.trace?.points||[];
 if(a.length<2||b.length<=a.length)return null;
 const now=Number(a.at(-1)),future=b.slice(a.length).map(Number).filter(Number.isFinite);
 if(!Number.isFinite(now)||!future.length)return null;
 const end=future.at(-1);
 return{fromSnapshotToClose:end-now,maxUpside:Math.max(...future)-now,maxDownside:Math.min(...future)-now,positiveClose:end>now,futurePoints:future.length};
}
export function evaluateCandidates(candidates,finalByMachine){
 const rows=[];for(const c of candidates){const final=finalByMachine[c.machineNo];const outcome=futureOutcome(c.snapshot,final);if(outcome)rows.push({...c,outcome})}return rows;
}
export function precisionAtK(rows,k=10){
 const ranked=rows.slice().sort((a,b)=>(b.score??-Infinity)-(a.score??-Infinity)).slice(0,k);
 if(!ranked.length)return null;
 return ranked.filter(r=>r.outcome?.positiveClose).length/ranked.length;
}
export function evaluationSummary(rows,k=10){
 const ranked=rows.slice().sort((a,b)=>(b.score??-Infinity)-(a.score??-Infinity)).slice(0,k);
 if(!ranked.length)return{n:0,precision:null,avgCloseMove:null};
 return{n:ranked.length,precision:ranked.filter(r=>r.outcome?.positiveClose).length/ranked.length,avgCloseMove:ranked.reduce((s,r)=>s+(Number(r.outcome?.fromSnapshotToClose)||0),0)/ranked.length};
}
