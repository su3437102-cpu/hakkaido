(() => {
 async function start(){
  try{
   const url=new URL('data/itinerary.json',document.baseURI);
   const response=await fetch(url,{cache:'no-cache'});
   if(!response.ok)throw new Error('HTTP '+response.status);
   const data=await response.json();
   if(!data.places||!data.foods||!Array.isArray(data.days)||!data.branches)throw new Error('行程数据缺少必要字段');
   const ids=data.days.map(d=>d.id);if(new Set(ids).size!==ids.length)throw new Error('行程日期ID不能重复');
   window.HKMapData=data;
   const script=document.createElement('script');script.src=new URL('js/map-app.js',document.baseURI).href;
   await new Promise((resolve,reject)=>{script.onload=resolve;script.onerror=()=>reject(new Error('无法读取地图脚本'));document.body.append(script);});
   if(!window.HKRouteMap)throw new Error('地图初始化失败');
   window.dispatchEvent(new Event('hk-trip-ready'));
  }catch(error){const status=document.getElementById('map-status');if(status){status.classList.remove('ready');status.textContent='行程载入失败：'+error.message+'。请检查 public/data/itinerary.json 后刷新。';}console.error(error);}
 }
 start();
})();
