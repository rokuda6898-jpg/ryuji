import fs from 'node:fs';
import {liveQualityGate,rankingPayload} from './live-gate.js';

export function buildLiveReport({capturedAt,snapshots=[],machines=[],candidates=[]}={}){
  const gate=liveQualityGate({snapshots,machines});
  const ranking=rankingPayload({gate,candidates,capturedAt});
  return {
    capturedAt,
    scope:'ARROW Tenri / 4-yen / non-Sea',
    status:ranking.status,
    coverage:{
      machines:gate.machineCount,
      usableMachines:gate.usableMachines,
      observedSnapshots:gate.observedSnapshots,
      expectedSnapshots:gate.expectedSnapshots,
      missingSnapshots:gate.missingSnapshots
    },
    reasons:gate.reasons,
    top10:ranking.candidates.map((x,i)=>({
      rank:i+1,
      machineNo:x.machineNo,
      model:x.model,
      score:x.score,
      evidence:x.evidence||[],
      confidence:x.confidence??null,
      previousRank:x.previousRank??null,
      rankChange:Number.isFinite(x.previousRank)?x.previousRank-(i+1):null
    }))
  };
}

if(process.argv[1]?.endsWith('live-report.js')&&process.argv[2]){
  const input=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
  const report=buildLiveReport(input);
  fs.mkdirSync('data/live',{recursive:true});
  fs.writeFileSync('data/live/latest.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
}
