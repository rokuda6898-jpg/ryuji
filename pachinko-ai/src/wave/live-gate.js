const EXPECTED=['10:35','12:36','14:37','16:38','18:39','20:40','22:41'];

export function liveQualityGate({snapshots=[],machines=[],minMachines=10,minTracePoints=80}={}){
  const reasons=[];
  if(machines.length<minMachines) reasons.push('too_few_machines');
  const usable=machines.filter(m=>(m.trace?.points?.length||0)>=minTracePoints);
  if(machines.length&&usable.length/machines.length<0.8) reasons.push('low_trace_coverage');
  const times=new Set(snapshots.map(s=>s.time));
  const missing=EXPECTED.filter(t=>!times.has(t));
  return {
    publish:reasons.length===0,
    status:reasons.length?'SKIP':'READY',
    reasons,
    machineCount:machines.length,
    usableMachines:usable.length,
    expectedSnapshots:EXPECTED.length,
    observedSnapshots:times.size,
    missingSnapshots:missing
  };
}

export function rankingPayload({gate,candidates=[],capturedAt}={}){
  if(!gate?.publish)return {capturedAt,status:'SKIP',gate,candidates:[]};
  return {capturedAt,status:'READY',gate,candidates:candidates.slice(0,10)};
}
