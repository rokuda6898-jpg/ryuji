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
 // SITE777は画面/機種によってtableNumClickが<a>以外にも付くため、全要素から拾う。
 const links=[...document.querySelectorAll('[onclick]')].filter(el=>
   /tableNumClick\\s*\\(/i.test(el.getAttribute('onclick')||'')
 );
 const machines=[];
 for(const el of links){
   const oc=el.getAttribute('onclick')||'';
   const tableToken=oc.match(/tableNumClick\\s*\\(\\s*['"]([^'"]+)['"]\\s*\\)/i)?.[1];
   const scopes=[el,el.closest('tr'),el.closest('li'),el.parentElement].filter(Boolean);
   let machineNo=null;
   for(const s of scopes){
     const t=norm(s.textContent);
     machineNo=t.match(/台番[:：]?\\s*(\\d+)/)?.[1]||t.match(/^\\s*(\\d{1,4})\\s*$/)?.[1]||null;
     if(machineNo)break;
   }
   if(tableToken&&machineNo)machines.push({modelcode,machineNo,tableToken,uritanka});
 }
 // 同じ台が複数要素に現れても1台に統合。
 const machineMap=new Map(machines.map(x=>[x.machineNo,x]));
 machines.length=0; machines.push(...machineMap.values());
 if(!machines.length){
   const onclicks=[...document.querySelectorAll('[onclick]')].map(x=>x.getAttribute('onclick')).filter(Boolean);
   console.error('台一覧は表示されていますが台tokenを検出できません。診断onclick=',onclicks);
   window.SITE777_ONCLICK_DIAG=onclicks;
   return;
 }
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
   sessionStorage.setItem('SITE777_V5_AUTORUN','1');
   window.listClick('01',next.modelcode,next.edaNo,next.actionType,next.uritanka);
 };
 // コンソール貼り付けを毎機種繰り返さないためのブックマークレット用入口。
 // このスクリプトを各ページで再注入できる環境では AUTORUN フラグを見て自動収集する。
 window.SITE777_AUTORUN=()=>{
   sessionStorage.setItem('SITE777_V5_AUTORUN','1');
   if(links.length) console.log('AUTORUN開始: 現在機種の取得後、一覧でSITE777_NEXT()を実行できます');
   else if(typeof window.SITE777_NEXT==='function') window.SITE777_NEXT();
 };
 // ホール一覧へ戻るURL。次機種は一覧上でSITE777_NEXT()を呼ぶ。
 window.SITE777_BACK_TO_HALL=()=>{
   sessionStorage.setItem('SITE777_V5_AUTORUN','1');
   location.href='/pc/HallSelectLink.do?hallcode=27090002';
 };
 window.SITE777_CONTINUE=()=>{
   const x=JSON.parse(localStorage.getItem(key)||'{}');
   if(!(x.todo?.length)){console.log('★★★★★ 全機種処理済み ★★★★★');return}
   if(typeof window.listClick==='function') return window.SITE777_NEXT();
   return window.SITE777_BACK_TO_HALL();
 };
 window.SITE777_STATUS=()=>{
   const x=JSON.parse(localStorage.getItem(key)||'{}');
   console.log('累計台数',x.machines?.length||0,'履歴',x.history?.length||0,'未取得機種',x.todo?.length??'?');
   return x;
 };
 window.SITE777_RESET=()=>{
   localStorage.removeItem(key);
   sessionStorage.removeItem('SITE777_V5_AUTORUN');
   console.log('SITE777 V5 保存データをリセットしました');
 };
 window.SITE777_EXPORT=()=>{
   const latest=JSON.parse(localStorage.getItem(key)||JSON.stringify(data));
   const expected=(latest.machines?.length||0)*8;
   const actual=latest.history?.length||0;
   const missing=[];
   for(const m of latest.machines||[])for(let day=0;day<8;day++)
     if(!(latest.history||[]).some(h=>h.modelcode===m.modelcode&&h.machineNo===m.machineNo&&h.day===day))
       missing.push({modelcode:m.modelcode,machineNo:m.machineNo,day});
   latest.validation={expectedHistory:expected,actualHistory:actual,missingHistory:missing.length,remainingModels:latest.todo?.length??null,ok:missing.length===0&&(latest.todo?.length??1)===0};
   localStorage.setItem(key,JSON.stringify(latest));
   console.log('★★★★★ 最終検証 ★★★★★',latest.validation);
   if(missing.length)console.table(missing);
   const b=new Blob([JSON.stringify(latest,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='site777-v5-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json';a.click()
 };
 if(sessionStorage.getItem('SITE777_V5_AUTORUN')==='1'){
   console.log('SITE777 V5 AUTORUN 有効');
   // 現在ページの収集は上で完了済み。次の操作を1関数に統一。
   console.log('続行は SITE777_CONTINUE()');
 }
})();
