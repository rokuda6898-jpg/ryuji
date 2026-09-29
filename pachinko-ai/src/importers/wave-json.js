import fs from 'node:fs'; import {normalizeWave} from './wave-normalize.js';
const input=process.argv[2]||'data/waves.json'; const output=process.argv[3]||'data/waves.normalized.json';
const raw=JSON.parse(fs.readFileSync(input,'utf8')); const rows=normalizeWave(raw); fs.mkdirSync('data',{recursive:true}); fs.writeFileSync(output,JSON.stringify(rows,null,2)); console.log('4-yen wave rows:',rows.length);
