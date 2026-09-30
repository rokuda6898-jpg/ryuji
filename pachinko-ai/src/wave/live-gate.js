const EXPECTED=['10:35','12:36','14:37','16:38','18:39','20:40','22:41'];

export function liveQualityGate({snapshots=[],machines=[],minMachines=10,minTracePoints=80}={}){
  const reasons=[];
  if(machines.length<minMachines) reasons.push('too_few_machines');
  const usable=machines.filter(m=>(m.trace?.points?.length||0)>=minTracePoints);
  if(machines.length&&usable.length/machines.length<0.8) reasons.push('low_trace_coverage');

  const times=new Set(snapshots.map(s=>s.time).filter(Boolean));
  const observedExpected=EXPECTED.filter(t=>times.has(t));
  const missing=EXPECTED.filter(t=>!times.has(t));
  if(!snapshots.length) reasons.push('no_snapshots');
  if(snapshots.length && observedExpected.length===0) reasons.push('unexpected_snapshot_times');

  const machineNos=new Set(machines.map(m=>String(m.machineNo||'')).filter(Boolean));
  if(machineNos.size!==machines.length) reasons.push('duplicate_or_missing_machine_no');

  return {
    publish:reasons.length===0,
    status:reasons.length?'SKIP':'READY',
    reasons:[...new Set(reasons)],
    machineCount:machines.length,
    usableMachines:usable.length,
    traceCoverage:machines.length?usable.length/machines.length:0,
    expectedSnapshots:EXPECTED.length,
    observedSnapshots:times.size,
    observedExpectedSnapshots:observedExpected.length,
    missingSnapshots:missing
  };
}

export function rankingPayload({gate,candidates=[],capturedAt}={}){
  if(!gate?.publish)return {capturedAt,status:'SKIP',gate,candidates:[]};
  const clean=candidates.filter(c=>Number.isFinite(Number(c.score))&&c.machineNo!=null);
  return {capturedAt,status:'READY',gate,candidates:clean.sort((a,b)=>Number(b.score)-Number(a.score)).slice(0,10)};
}
