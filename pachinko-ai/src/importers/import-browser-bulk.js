import fs from 'node:fs';import path from 'node:path';
const file=process.argv[2];if(!file)throw new Error('usage: node src/importers/import-browser-bulk.js <site777-export.json>');
const src=JSON.parse(fs.readFileSync(file,'utf8'));
const capturedAt=src.updatedAt||src.capturedAt||new Date().toISOString(),stamp=capturedAt.replace(/[:.]/g,'-');
let machines=[],history=[];
if(src.schemaVersion===3&&src.source===undefined&&src.machines&&!Array.isArray(src.machines)){
  machines=Object.values(src.machines).map(x=>({rate:4,model:x.modelName||'',modelCode:x.modelcode||'',machineNo:String(x.machineNo||''),tableToken:x.tableToken||'',capturedAt})).filter(x=>x.machineNo);
  history=Object.values(src.history||{}).map(x=>({rate:4,model:x.modelName||src.machines?.[(x.modelcode||'')+'|'+x.machineNo]?.modelName||'',modelCode:x.modelcode||'',machineNo:String(x.machineNo||''),day:Number.isInteger(x.day)?(x.day===0?'当日':x.day===1?'前日':x.day+'日前'):x.day,totalStart:Number(x.stats?.totalStart)||0,bigHits:Number(x.stats?.bigHits)||0,firstHits:Number(x.stats?.firstHits)||0,currentStart:Number(x.stats?.currentStart)||0,capturedAt})).filter(x=>x.machineNo&&x.day!==undefined);
  if(src.validation&&!src.validation.ok)throw new Error('SITE777 V7 export is incomplete');
}else{
  if(src.source!=='site777-browser'||!Array.isArray(src.machines))throw new Error('invalid Site777 browser export');
  machines=src.machines.map(x=>({rate:4,model:x.model||x.modelName||'',modelCode:x.mdc||x.modelcode||'',machineNo:String(x.machineNo||''),tableToken:x.tableToken||'',chartUrl:x.chartUrl||'',capturedAt})).filter(x=>x.machineNo);
  history=(Array.isArray(src.history)?src.history:[]).map(x=>({rate:4,model:x.model||x.modelName||'',modelCode:x.mdc||x.modelcode||'',machineNo:String(x.machineNo||''),day:x.day??'',totalStart:Number(x.totalStart??x.stats?.totalStart)||0,bigHits:Number(x.bigHits??x.stats?.bigHits)||0,firstHits:Number(x.firstHits??x.stats?.firstHits)||0,bigHitRate:x.bigHitRate||'',firstHitRate:x.firstHitRate||'',kakuhenBigHitRate:x.kakuhenBigHitRate||'',currentStart:Number(x.currentStart??x.stats?.currentStart)||0,capturedAt})).filter(x=>x.machineNo&&x.day!=='');
}
machines=[...new Map(machines.map(x=>[x.modelCode+'|'+x.machineNo,x])).values()];
history=[...new Map(history.map(x=>[x.modelCode+'|'+x.machineNo+'|'+x.day,x])).values()];
const expected=machines.length*8;if(history.length!==expected)throw new Error('history completeness error: '+history.length+'/'+expected);
fs.mkdirSync('data/browser-history',{recursive:true});fs.mkdirSync('data/manifest',{recursive:true});
const snap=path.join('data/browser-history',stamp+'.json');fs.writeFileSync(snap,JSON.stringify({capturedAt,machines,history},null,2));
const latest='data/manifest/site777-4yen-latest.json';fs.writeFileSync(latest,JSON.stringify({capturedAt,count:machines.length,models:new Set(machines.map(x=>x.modelCode||x.model)).size,historyCount:history.length,machines,history},null,2));
console.log(JSON.stringify({ok:true,capturedAt,machines:machines.length,models:new Set(machines.map(x=>x.modelCode||x.model)).size,history:history.length,snapshot:snap,latest},null,2));