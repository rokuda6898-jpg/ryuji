import fs from 'node:fs';import path from 'node:path';import {parseSite777GraphList} from './site777-html.js';
const inputs=process.argv.slice(2);if(!inputs.length)throw new Error('usage: node src/importers/collect-all-4yen.js <saved-html...>');
const rows=[];for(const file of inputs){const p=parseSite777GraphList(fs.readFileSync(file,'utf8'));if(p.rate!==4)continue;for(const m of p.machines)rows.push({model:p.model,day:p.day,machineNo:m.machineNo,tableToken:m.tableToken,chartUrl:m.chartUrl,source:path.basename(file)})}
const key=x=>[x.model,x.day,x.machineNo].join('|');const unique=[...new Map(rows.map(x=>[key(x),x])).values()];
fs.mkdirSync('data/manifest',{recursive:true});fs.writeFileSync('data/manifest/4yen-machines.json',JSON.stringify(unique,null,2));
const models=new Set(unique.map(x=>x.model)),days=new Set(unique.map(x=>x.day));
console.log(JSON.stringify({machines:unique.length,models:models.size,days:[...days].sort(),duplicates:rows.length-unique.length},null,2));
