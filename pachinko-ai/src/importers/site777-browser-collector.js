// SITE777 browser-session collector: discovers models from modelClick/modelcode and machines from tableNumClick.
(async()=>{
 const wait=ms=>new Promise(r=>setTimeout(r,ms)),seed=new URL(location.href),seen=new Set(),q=[],models=[],machines=[],history=[];
 const addModel=(code,name='')=>{if(!code)return;const u=new URL('/do/D4300.do',location.origin);for(const k of ['pmc','bn','pan','urt','dsgk','dtdd','bmdn','bmmdc','bmbn','bmurt','bmurtHji','bmgk','bmclc','bmsk'])if(seed.searchParams.has(k))u.searchParams.set(k,seed.searchParams.get(k));u.searchParams.set('mdc',code);const s=u.href;if(!seen.has(s)&&!q.includes(s))q.push(s)};
 const discover=html=>{
  let m;
  for(const re of [/modelClick\(['"]01['"]\s*,\s*['"]([^'"]+)['"]\)[\s\S]{0,300}?>([^<]+)<\/a>/gi,/(?:modelcode|mdc)=([0-9A-Za-z_-]+)[^"'<>]*[\s\S]{0,250}?>([^<]+)<\/a>/gi])while((m=re.exec(html)))addModel(m[1],m[2]);
 };
 const extract=(html,url)=>{
  const d=new DOMParser().parseFromString(html,'text/html'),head=d.querySelector('#machine_name')?.textContent||'',is4=/【\s*4\s*】パチ/.test(head)||/【\s*4\s*】パチ/.test(d.body?.innerText||'');
  if(!is4)return;
  const model=head.replace(/【\s*4\s*】パチ/g,'').trim()||d.title,mdc=new URL(url).searchParams.get('mdc');let m,n=0;
  const re=/tableNumClick\('([^']+)'\)[\s\S]*?台番:([0-9]+)[\s\S]*?<img\s+src="([^"]*RequestPcDedamaTransitionKahenRangeChart\.do\?param=[^"]+)"/gi;
  while((m=re.exec(html))){machines.push({model,mdc,machineNo:m[2],tableToken:m[1],chartUrl:new URL(m[3].replace(/&amp;/g,'&'),url).href});n++}
  models.push({model,mdc,url,machines:n});console.log('4円取得',models.length,model,n+'台');
 };
 const first=await fetch(location.href,{credentials:'include',cache:'no-store'}).then(r=>r.text());discover(first);addModel(seed.searchParams.get('mdc'));console.log('機種候補',q.length);
 while(q.length&&seen.size<500){const url=q.shift();if(seen.has(url))continue;seen.add(url);try{const html=await fetch(url,{credentials:'include',cache:'no-store'}).then(r=>r.text());discover(html);extract(html,url)}catch(e){console.warn('失敗',url,e)}await wait(400)}
 const unique=[...new Map(machines.map(x=>[(x.mdc||x.model)+'|'+x.machineNo,x])).values()];
 // Logged-in d-deltanet detail pages: collect current day through 7 days ago.
 // TableSelect.do returns all eight rows in one response, so one POST per machine is enough.
 const form=document.HallDedamaActionForm||document.querySelector('form[action*="TableSelect.do"]');
 if(form&&unique.length){
  const base={};for(const e of [...form.elements])if(e.name)base[e.name]=e.value;
  for(const x of unique){
   try{
    const p=new URLSearchParams(base);
    p.set('tablenum',x.tableToken);
    if(x.mdc)p.set('modelcode',x.mdc);
    if(!p.has('tablelistflag'))p.set('tablelistflag','1');
    const action=new URL(form.action||'/pc/TableSelect.do',location.href);
    const r=await fetch(action,{method:'POST',credentials:'include',cache:'no-store',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:p});
    const html=await r.text(),d=new DOMParser().parseFromString(html,'text/html');
    const rows=[...d.querySelectorAll('tr')].map(tr=>[...tr.querySelectorAll('th,td')].map(td=>td.innerText.replace(/\s+/g,' ').trim())).filter(a=>/^(当日|前日|[2-7]前)$/.test(a[0]||''));
    for(const a of rows)history.push({model:x.model,mdc:x.mdc,machineNo:x.machineNo,day:a[0],totalStart:a[1]||'',bigHits:a[2]||'',firstHits:a[3]||'',bigHitRate:a[4]||'',firstHitRate:a[5]||'',kakuhenBigHitRate:a[6]||'',currentStart:a[7]||''});
    console.log('8日履歴',x.machineNo,rows.length+'件');
   }catch(e){console.warn('履歴失敗',x.machineNo,e)}
   await wait(300);
  }
 }
 const data={source:'site777-browser',capturedAt:new Date().toISOString(),models,machines:unique,history};
 const a=document.createElement('a'),blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});a.href=URL.createObjectURL(blob);a.download='site777-4yen-all-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json';a.click();console.log('完了',models.length+'機種',unique.length+'台');
})();