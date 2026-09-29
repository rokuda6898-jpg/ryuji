import {spawnSync} from 'node:child_process';
const dir=process.argv[2]||'data/inbox';
const steps=[
 ['import saved Site777 pages',['src/importers/import-saved-pages.js',dir]],
 ['report coverage',['src/importers/coverage.js','data/manifest/imported-4yen-non-sea.json']]
];
for(const [name,args] of steps){
 console.log('\n== '+name+' ==');
 const r=spawnSync(process.execPath,args,{stdio:'inherit'});
 if(r.status!==0){console.error('PIPELINE_STOP:',name);process.exit(r.status||1)}
}
console.log('\nPIPELINE_OK: 4-yen non-Sea input validated and manifest is ready for chart/wave analysis.');
