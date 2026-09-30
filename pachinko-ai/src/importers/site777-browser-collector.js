// Paste into DevTools Console on a logged-in Site777 4-yen model page.
// Collects 4-yen model pages reachable from Site777 links, including Umi/Sea series,
// extracts every machine number + chart URL, then downloads ONE JSON file.
(async()=>{
 const wait=ms=>new Promise(r=>setTimeout(r,ms)), seen=new Set(), models=[], machines=[];
 const seed=new URL('/do/D4300.do',location.origin);[['pmc','27090002'],['mdc','026135'],['bn','1'],['pan','1'],['urt','400'],['dsgk','0'],['dtdd','0']].forEach(([k,v])=>seed.searchParams.set(k,v));
 const q=[seed.href];
 const abs=(s,base=location.href)=>new URL(s,base).href;
 const parse=html=>new DOMParser().parseFromString(html,'text/html');
 const is4=d=>/【\s*4\s*】パチ/.test(d.body?.innerText||'');
 const modelName=d=>(d.querySelector('#machine_name')?.textContent||d.title||'').replace(/【\s*4\s*】パチ/g,'').trim();
 const modelUrl=u=>{try{let x=new URL(u);return x.origin===location.origin&&x.pathname.endsWith('/do/D4300.do')&&x.searchParams.has('mdc')}catch{return false}};
 const discover=(d,base,html)=>{
   const add=u=>{try{u=abs(u,base);if(modelUrl(u)&&!seen.has(u)&&!q.includes(u))q.push(u)}catch{}};
   for(const a of d.querySelectorAll('a[href]'))add(a.getAttribute('href'));
   for(const el of d.querySelectorAll('[onclick]')){
     const s=el.getAttribute('onclick')||'';
     for(const m of s.matchAll(/modelClick\(['"](?:01|1|4)['"]\s*,\s*['"]([0-9A-Za-z_-]+)['"]/gi)){const u=new URL(seed.href);u.searchParams.set('mdc',m[1]);add(u.href)}
     for(const m of s.matchAll(/(?:mdc=)([0-9A-Za-z_-]+)/gi)){const u=new URL(seed.href);u.searchParams.set('mdc',m[1]);add(u.href)}
   }
   for(const m of html.matchAll(/modelClick\(['"](?:01|1|4)['"]\s*,\s*['"]([0-9A-Za-z_-]+)['"]/gi)){const u=new URL(seed.href);u.searchParams.set('mdc',m[1]);add(u.href)}
   for(const m of html.matchAll(/[?&]mdc=([0-9A-Za-z_-]+)/gi)){const u=new URL(seed.href);u.searchParams.set('mdc',m[1]);add(u.href)}
 };
 const extract=(html,d,url)=>{
   const model=modelName(d),mdc=new URL(url).searchParams.get('mdc');
   const re=/tableNumClick\('([^']+)'\)[\s\S]*?台番:([0-9]+)[\s\S]*?<img\s+src="([^"]*RequestPcDedamaTransitionKahenRangeChart\.do\?param=[^"]+)"/gi;
   let m,n=0;while((m=re.exec(html))){machines.push({model,mdc,machineNo:m[2],tableToken:m[1],chartUrl:abs(m[3].replace(/&amp;/g,'&'),url)});n++}
   return {model,mdc,url,machines:n};
 };
 while(q.length&&seen.size<500){
   const url=q.shift(); if(seen.has(url)||!modelUrl(url))continue; seen.add(url);
   try{
     const r=await fetch(url,{credentials:'include',cache:'no-store'}),html=await r.text(),d=parse(html);
     discover(d,url,html);
     if(is4(d)){const x=extract(html,d,url);models.push(x);console.log('4円取得',models.length,x.model,x.machines+'台')}
   }catch(e){console.warn('取得失敗',url,String(e))}
   await wait(400);
 }
 const unique=[...new Map(machines.map(x=>[(x.mdc||x.model)+'|'+x.machineNo,x])).values()];
 const data={source:'site777-browser',capturedAt:new Date().toISOString(),models,machines:unique};
 const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),a=document.createElement('a');
 a.href=URL.createObjectURL(blob);a.download='site777-4yen-all-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json';a.click();
 console.log('完了',models.length+'機種',unique.length+'台');
})();