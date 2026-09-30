// SITE777 collector V5 — 正規に開いた機種ページから台tokenと8日履歴を収集
// reCAPTCHAは回避しない。SITE777で通常操作して開いたLISTページ上で実行する。
(async()=>{
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const parse=s=>new DOMParser().parseFromString(s,'text/html');
 const norm=s=>(s||'').replace(/\\s+/g,' ').trim();
 const form=document.forms.HallDedamaActionForm;
 const q=new URL(location.href).searchParams;
 const hallcode=form?.hallcode?.value||q.get('hallcode')||'';
 const modelcode=form?.modelcode?.value||q.get('modelcode')||'';
 const uritanka=form?.uritanka?.value||q.get('uritanka')||'400';
 const links=[...document.querySelectorAll('a[onclick*="tableNumClick"]')];
 if(!links.length){
   console.log('SITE777 V5: このページは台一覧ではありません。通常操作で4円機種を開いてから再実行してください。');
   return;
 }
 const machines=links.map(a=>{
   const oc=a.getAttribute('onclick')||'';
   const tableToken=oc.match(/tableNumClick\\(['"]([^'"]+)['"]\\)/i)?.[1];
   const machineNo=norm(a.textContent).match(/台番[:：]?\\s*(\\d+)/)?.[1];
   return tableToken&&machineNo?{modelcode,machineNo,tableToken,uritanka}:null;
 }).filter(Boolean);
 const key='SITE777_V5_RESULT';
 let data; try{data=JSON.parse(localStorage.getItem(key)||'null')}catch{}
 if(!data)data={source:'site777-browser-v5',hallcode,capturedAt:new Date().toISOString(),machines:[],history:[]};
 for(const m of machines){
   if(!data.machines.some(x=>x.modelcode===m.modelcode&&x.machineNo===m.machineNo))data.machines.push(m);
   for(let day=0;day<8;day++){
     if(data.history.some(x=>x.modelcode===m.modelcode&&x.machineNo===m.machineNo&&x.day===day))continue;
     const u=new URL('/pc/GraphList.do',location.origin);
     u.searchParams.set('hallcode',hallcode);u.searchParams.set('tablenum',m.tableToken);
     u.searchParams.set('tablelistflag','1');u.searchParams.set('day',String(day));
     u.searchParams.set('currentpageno','1');u.searchParams.set('uritanka',uritanka);
     u.searchParams.set('modelcode',modelcode);
     const r=await fetch(u,{credentials:'include',cache:'no-store'});
     const html=await r.text();
     data.history.push({...m,day,url:r.url,pageText:norm(parse(html).body?.innerText||html)});
     localStorage.setItem(key,JSON.stringify(data));
     await wait(100);
   }
   console.log('台番',m.machineNo,'8日完了');
 }
 data.capturedAt=new Date().toISOString();localStorage.setItem(key,JSON.stringify(data));
 window.SITE777_RESULT=data;
 console.log('★★★★★ V5取得完了 ★★★★★','今回',machines.length+'台','累計',data.machines.length+'台','履歴',data.history.length+'件');
 // 次に処理する4円機種を記録。認証が必要なページ遷移自体は自動化しない。
 try{
   const hall=await fetch('/pc/HallSelectLink.do?hallcode=27090002',{credentials:'include',cache:'no-store'}).then(r=>r.text());
   const d=parse(hall), todo=[];
   for(const el of d.querySelectorAll('[onclick*="listClick"]')){
     const oc=el.getAttribute('onclick')||'';
     const mm=oc.match(/listClick\\(\\s*['"]01['"]\\s*,\\s*['"]([^'"]+)['"]\\s*,\\s*['"]([^'"]+)['"]\\s*,\\s*['"]([^'"]+)['"]\\s*,\\s*['"]([^'"]+)['"]\\s*\\)/i);
     if(mm)todo.push({modelcode:mm[1],edaNo:mm[2],actionType:mm[3],uritanka:mm[4]});
   }
   const done=new Set(data.machines.map(x=>x.modelcode));
   data.todo=[...new Map(todo.map(x=>[x.modelcode,x])).values()].filter(x=>!done.has(x.modelcode));
   localStorage.setItem(key,JSON.stringify(data));
   console.log('未取得機種',data.todo.length,'/','全4円機種',new Set(todo.map(x=>x.modelcode)).size);
 }catch(e){console.warn('未取得機種一覧の更新失敗',e)}
 // 通常のSITE777操作で次の未取得4円機種を開くヘルパー。
 // listClick()をそのまま呼ぶため、SITE777自身のreCAPTCHA/通常遷移を維持する。
 window.SITE777_NEXT=()=>{
   const latest=JSON.parse(localStorage.getItem(key)||'{}');
   const next=latest.todo?.[0];
   if(!next){console.log('★★★★★ 未取得機種なし ★★★★★');return}
   if(typeof window.listClick!=='function'){
     console.log('ホール機種一覧ページへ戻って SITE777_NEXT() を実行してください');
     return;
   }
   console.log('次の未取得機種を通常遷移で開きます:',next.modelcode);
   window.listClick('01',next.modelcode,next.edaNo,next.actionType,next.uritanka);
 };
 window.SITE777_STATUS=()=>{
   const x=JSON.parse(localStorage.getItem(key)||'{}');
   console.log('累計台数',x.machines?.length||0,'履歴',x.history?.length||0,'未取得機種',x.todo?.length??'?');
   return x;
 };
 window.SITE777_EXPORT=()=>{const b=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='site777-v5-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json';a.click()};
})();
