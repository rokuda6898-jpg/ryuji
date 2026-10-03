import fs from 'node:fs';
import {rankWaves} from './rank.js';
import {islandSync} from './island-sync.js';
import {permutationTest} from './null-test.js';

const rows=JSON.parse(fs.readFileSync(process.argv[2]||'data/waves.normalized.json','utf8'));
const by=new Map();
for(const r of rows){
 const key=String(r.model||'')+'|'+String(r.machineNo||'');
 if(!by.has(key))by.set(key,[]);
 by.get(key).push(r);
}
const machines=[];
for(const group of by.values()){
 group.sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
 const current=group.at(-1),history=group.slice(0,-1);
 machines.push({
  machineNo:current.machineNo,
  model:current.model,
  island:current.island,
  position:current.position,
  points:current.points,
  stats:current.stats,
  history
 });
}
const ranking=rankWaves(machines).map(x=>{
 const m=machines.find(r=>r.machineNo===x.machineNo&&r.model===x.model);
 return {...x,nullTest:permutationTest(m?.points||[],500)};
});
console.log(JSON.stringify({ranking,synchronization:islandSync(rows)},null,2));
