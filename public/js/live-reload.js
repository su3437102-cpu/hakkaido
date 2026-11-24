(() => {
 const status=document.getElementById('lan-connection-status');
 const setStatus=(text,disconnected=false)=>{if(status){status.textContent=text;status.classList.toggle('disconnected',disconnected);}};
 const key='hk-lan-preview-position-v1';
 let restored=false,reloadTimer;
 function restore(){
  if(restored||!window.HKRouteMap)return;restored=true;
  try{const saved=JSON.parse(sessionStorage.getItem(key));sessionStorage.removeItem(key);if(!saved)return;window.HKRouteMap.selectDay(saved.day,{branch:saved.branch});window.HKRouteMap.setView(saved.view);requestAnimationFrame(()=>window.scrollTo(saved.x||0,saved.y||0));}catch{}
 }
 window.addEventListener('hk-trip-ready',restore);restore();
 if(!('EventSource' in window)){setStatus('手动刷新可查看更新',true);return;}
 const events=new EventSource(new URL('__dev/events',document.baseURI));
 events.addEventListener('connected',()=>setStatus('已连接 · 保存后自动刷新'));
 events.onopen=()=>setStatus('已连接 · 保存后自动刷新');
 events.onerror=()=>setStatus('正在重连更新服务',true);
 events.addEventListener('reload',()=>{
  setStatus('已保存，正在刷新');clearTimeout(reloadTimer);
  reloadTimer=setTimeout(()=>{try{const current=window.HKRouteMap?.getState();if(current)sessionStorage.setItem(key,JSON.stringify({day:current.day,branch:current.branch,view:current.view,x:scrollX,y:scrollY}));}catch{}location.reload();},300);
 });
 window.addEventListener('pagehide',()=>{clearTimeout(reloadTimer);events.close();});
})();
