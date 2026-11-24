(() => {
'use strict';
const {places:P,foods:F,days,branches} = window.HKMapData;
const $ = s => document.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const valid = p => p && Number.isFinite(p.lat) && Number.isFinite(p.lng);
const ll = p => [p.lat,p.lng];
const search = p => 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(p.query||p.name);
const modeNames = {walk:'步行 / 地下通道',rail:'JR / 高铁',metro:'地铁',urban:'市内交通 · 待核',bus:'巴士',pending:'交通待确认',stay:'馆内 / 原地'};
const colors = {walk:'#187c63',rail:'#2475b5',metro:'#8b5bb0',urban:'#8b5bb0',bus:'#b36a24',pending:'#8a9aa5',stay:'#187c63'};
let saved = {};
try {saved=JSON.parse(localStorage.getItem('hk-route-map-v1'))||{};} catch {}
if (!saved.done||typeof saved.done!=='object') saved.done={};
if (!saved.meals||typeof saved.meals!=='object') saved.meals={};
let current='d2', branch='lake', view='geo', selected=-1;
let route=[], day=null, currentFood=[], map=null, routeLayer=null, foodLayer=null, arrowLayer=null, stopMarkers=new Map(), tileLayer=null, tileSucceeded=false;
let storageWarning=false;
const persist=()=>{try{localStorage.setItem('hk-route-map-v1',JSON.stringify(saved));}catch{storageWarning=true;}};
const byId = id => days.find(d=>d.id===id);
const branchKey = () => current==='d4'?branch:current==='eve'?branch:'main';
const doneKey = i => current+'|'+branchKey()+'|'+i;
const isDone = i => saved.done[doneKey(i)]===true;
const mealKey = (s,i) => current+'|'+branchKey()+'|'+s.meal+'|'+i;
const link = (url,label,cls='') => `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;
function navURL(a,b,mode='walk') {
 const params=new URLSearchParams({api:'1',destination:b.query||b.name,travelmode:mode==='walk'?'walking':'transit'});
 if(a) params.set('origin',a.query||a.name);
 return 'https://www.google.com/maps/dir/?'+params;
}
function resolveRoute() {
 day=byId(current);
 if(!day){route=[];currentFood=Object.keys(F);return;}
 let base=current==='d4'?branches[branch]:day.stops;
 if(current==='eve') base=base.map((s,i)=>i===1?{...s,place:branch}:s);
 route=base.map((s,i)=>{
  if(!s.choices) return {...s,point:P[s.place]};
  const stored=saved.meals[mealKey(s,i)];
  const chosen=s.choices.includes(stored)?stored:s.choices[0];
  return {...s,chosen,point:F[chosen],title:s.meal+' · '+F[chosen].name};
 });
 currentFood=day.foods.slice();
 if(current==='d4'&&branch==='city') currentFood=['kitakaro','matsuo','samamaruyama'];
}
function initMap() {
 if(map) return true;
 if(!window.L) return false;
 try {
  map=L.map('trip-map',{scrollWheelZoom:false,attributionControl:true,minZoom:7,maxZoom:17,maxBoundsViscosity:.7}).setView([43.065,141.35],13);
  routeLayer=L.featureGroup().addTo(map); foodLayer=L.featureGroup().addTo(map); arrowLayer=L.layerGroup().addTo(map);
  map.on('zoomend moveend',()=>{renderArrows();updateStatus();});
  return true;
 } catch(e) {map=null;return false;}
}
function ensureTiles() {
 if(!map||tileLayer) return;
 if(!window.HKOfflineBasemap){updateStatus('内置地理底图未能初始化，可切换“离线顺序图”。');return;}
 tileLayer=window.HKOfflineBasemap.create().addTo(map);
 L.control.scale({imperial:false,maxWidth:100}).addTo(map);
 tileSucceeded=true;
 updateStatus();
}
function updateStatus(message) {
 const el=$('#map-status'); el.classList.toggle('ready',view==='order'||tileSucceeded);
 let status='正在初始化内置地理底图。';
 if(view==='order')status='离线顺序图 · 按计划排列，间距不代表实际距离；点击节点查看位置。';
 else if(tileSucceeded){
  const covered=map&&window.HKOfflineBasemap.coverage(map.getCenter());
  status=current==='eve'?'离线区域概览 · 广州—香港段内置海陆轮廓与行程点，未包含街道详图。':map&&map.getZoom()>=13&&!covered.length?'离线区域概览 · 此位置超出街道详图范围；点“城市 / 徒步段”回到行程区域。':'离线地理底图 · 道路、水域、铁路与地名已内置；拖动、缩放、看餐厅均无需联网。';
 }
 el.textContent=message||status;
}
function popup(s,i) {
 const p=s.point;
 return `<div class="trip-popup"><span class="popup-time">${esc((i+1)+' · '+s.time)}</span><strong>${esc(s.title)}</strong><p>${esc(s.note||p.note||p.name)}</p>${link(search(p),'地点 / 入口 ↗')}${i>0?link(navURL(route[i-1].point,p,s.mode),'从上一站导航 ↗'):''}</div>`;
}
function icon(label,kind='',active=false,offset=0) {
 return L.divIcon({className:'trip-point',html:`<span class="trip-pin ${kind} ${active?'active':''}">${esc(label)}</span>`,iconSize:[28,28],iconAnchor:[14-offset,14],popupAnchor:[offset,-18]});
}
function renderGeo() {
 if(!initMap()) {setView('order');updateStatus('地图组件未能初始化，已显示无需联网的行程顺序图。');return;}
 const bounds=L.latLngBounds(current==='eve'?[[21.7,112.6],[23.6,114.6]]:[[42.25,140.5],[43.6,142.2]]);
 if(map.options.maxBounds)map.options.maxBounds=bounds;else map.setMaxBounds(bounds);
 map.setMinZoom(current==='eve'?7:8);
 routeLayer.clearLayers();foodLayer.clearLayers();arrowLayer.clearLayers();stopMarkers.clear();
 if(current==='overview'){renderOverviewGeo();return;}
 // Straight, color-coded segments preserve order. Never bridge an unspecified destination.
 for(let i=1;i<route.length;i++) {
  const a=route[i-1].point,b=route[i].point;
  if(!valid(a)||!valid(b)||route[i].mode==='pending'||route[i].mode==='stay') continue;
  L.polyline([ll(a),ll(b)],{color:colors[route[i].mode],weight:4,opacity:.8,dashArray:route[i].mode==='walk'?null:'7 7',interactive:false}).addTo(routeLayer);
 }
 const groups=new Map();
 route.forEach((s,i)=>{if(valid(s.point)){const key=s.point.lat+','+s.point.lng;const g=groups.get(key)||[];g.push(i);groups.set(key,g);}});
 groups.forEach(indices=>{
  const i=indices.includes(selected)?selected:indices[0],s=route[i],label=indices.length>1?indices.map(n=>n+1).join('·'):i+1;
  const marker=L.marker(ll(s.point),{icon:icon(label,['hotel','takimoto'].includes(s.place)?'hotel':'',indices.includes(selected)),title:indices.map(n=>`${n+1}. ${route[n].title}`).join('；'),keyboard:true}).addTo(routeLayer);
  marker.bindPopup(popup(s,i),{maxWidth:285});
  marker.bindTooltip(indices.map(n=>`${n+1} · ${route[n].title}`).join('<br>'),{className:'trip-tooltip',direction:'top'});
  marker.on('click',()=>selectStop(i,false));
  indices.forEach(n=>stopMarkers.set(n,marker));
 });
 renderFoodMarkers();renderArrows();
}
function renderFoodMarkers() {
 if(!map) return; foodLayer.clearLayers();
 if(!$('#map-show-food').checked)return;
 const seen=new Map();
 currentFood.forEach(id=>{
  const f=F[id];if(!valid(f))return;
  const key=Math.round(f.lat*1000)+','+Math.round(f.lng*1000),n=seen.get(key)||0;seen.set(key,n+1);
  const chosen=route.some(s=>s.chosen===id), nearStop=route.some(s=>valid(s.point)&&Math.abs(s.point.lat-f.lat)<.0003&&Math.abs(s.point.lng-f.lng)<.0004);
  L.marker(ll(f),{icon:icon('餐','food',false,nearStop?30+n*30:n*25),title:f.name+(chosen?'（已选入路线）':''),keyboard:true,zIndexOffset:250})
   .bindPopup(`<div class="trip-popup"><strong>${esc(f.name)}</strong><p>${esc(f.note)}</p><p>${chosen?'已选入当天路线':'餐厅候选；不必全部前往'}</p>${link(search(f),'查看店铺 / 导航 ↗')}${link(f.source,'店铺来源 ↗')}</div>`).addTo(foodLayer);
 });
}
function overviewStops() {
 return ['cts','sapporo','otaru','chitose','lake','noboribetsu','takimoto'].map((place,i)=>({place,point:P[place],title:P[place].name,time:['D1 / D8','札幌住宿基地','D3 日归','D4 换乘点','D4 已选','D5 / D6','D5 住一晚'][i]}));
}
function renderOverviewGeo() {
 const segments=[['cts','sapporo','rail'],['sapporo','otaru','rail'],['sapporo','chitose','rail'],['chitose','lake','bus'],['sapporo','noboribetsu','rail'],['noboribetsu','takimoto','bus']];
 segments.forEach(([a,b,m])=>L.polyline([ll(P[a]),ll(P[b])],{color:colors[m],weight:4,dashArray:'7 7',opacity:.75,interactive:false}).addTo(routeLayer));
 overviewStops().forEach((s,i)=>L.marker(ll(s.point),{icon:icon(i+1,s.place==='sapporo'?'hotel':''),title:s.title}).bindPopup(`<div class="trip-popup"><strong>${esc(s.title)}</strong><p>${esc(s.time)}</p>${link(search(s.point),'在地图查看 ↗')}</div>`).bindTooltip(esc(s.title),{className:'trip-tooltip'}).addTo(routeLayer));
 renderFoodMarkers();
}
function renderArrows() {
 if(!map||!arrowLayer)return;arrowLayer.clearLayers();
 if(current==='overview')return;
 route.forEach((s,i)=>{
  if(i===0||!valid(s.point)||!valid(route[i-1].point)||['pending','stay'].includes(s.mode))return;
  const a=map.latLngToLayerPoint(ll(route[i-1].point)),b=map.latLngToLayerPoint(ll(s.point));
  if(a.distanceTo(b)<55)return;
  const pos=map.layerPointToLatLng(a.add(b).divideBy(2)),angle=Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI;
  L.marker(pos,{icon:L.divIcon({className:'trip-arrow',iconSize:[18,18],iconAnchor:[9,9],html:`<span style="color:${colors[s.mode]};transform:rotate(${angle}deg)">➤</span>`}),interactive:false,keyboard:false}).addTo(arrowLayer);
 });
}
function fitRoute(local=false) {
 if(!map||view!=='geo')return;
 let points=current==='overview'?overviewStops().map(s=>s.point):route.map(s=>s.point).filter(valid);
 if(local&&current!=='overview'){
  // Keep the destination city readable on intercity days. Never imply a road route.
  if(current==='d3')points=route.map(s=>s.point).filter(p=>valid(p)&&p.lng<141.1);
  else if(['d5','d6'].includes(current))points=route.map(s=>s.point).filter(p=>valid(p)&&p.lat<42.51&&p.lat>42.48);
  else if(current==='d4'&&branch==='lake')points=[P.lake];
  else if(current==='d1')points=[P.hotel,P.sapporo,...currentFood.map(id=>F[id])];
  else if(current==='d8')points=[P.cts,P.ctsintl];
  else if(current==='eve')points=[P.kowloon,P.tungchung,P.hkg];
 }
 if(!local&&$('#map-show-food').checked)points.push(...currentFood.map(id=>F[id]).filter(valid));
 points=points.filter(valid);if(!points.length)return;
 map.invalidateSize();
 if(points.length===1)map.setView(ll(points[0]),14,{animate:false});
 else map.fitBounds(L.latLngBounds(points.map(ll)),{padding:[43,43],maxZoom:15,animate:false});
}
function svgText(s,n=25) {
 const a=Array.from(s);return a.length>n?a.slice(0,n-1).join('')+'…':s;
}
function renderOrder() {
 const items=current==='overview'?overviewStops():route;
 const height=Math.max(420,items.length*95+40),w=560;
 let svg=`<svg viewBox="0 0 ${w} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(current==='overview'?'全程目的地概览':day.title+'顺序图')}"><text x="18" y="22" fill="#5d7b8c" font-size="12">${current==='overview'?'目的地区域概览 · 请选日期查看当天顺序':'↓ 按原计划顺序 · 不代表实际距离'}</text>`;
 items.forEach((s,i)=>{
  const y=45+i*95,c=current==='overview'?'#2475b5':colors[s.mode];
  if(i<items.length-1)svg+=`<path d="M37 ${y+27}v65" fill="none" stroke="${current==='overview'?'#8bb3c6':colors[items[i+1].mode]}" stroke-width="3" stroke-dasharray="${items[i+1].mode==='walk'?'0':'5 5'}"/><text x="29" y="${y+82}" fill="#7b9bab" font-size="15">▼</text>`;
  svg+=`<g class="order-node" data-order-index="${i}" tabindex="0" role="button" aria-label="${esc(s.title)}"><circle cx="37" cy="${y+17}" r="15" fill="${current!=='overview'&&isDone(i)?'#187c63':'#173b53'}"/><text x="37" y="${y+21}" text-anchor="middle" font-size="12" fill="white" font-weight="700">${i+1}</text><rect x="65" y="${y-5}" width="475" height="77" rx="11" fill="${selected===i?'#fff4e7':'white'}" stroke="${selected===i?'#efab71':'#caddE8'}"/><text x="80" y="${y+14}" fill="#277b9f" font-size="12" font-weight="700">${esc(s.time)}</text><text x="80" y="${y+36}" fill="#173b53" font-size="14" font-weight="700">${esc(svgText(s.title,28))}</text><text x="80" y="${y+56}" fill="${c}" font-size="11">${esc(current==='overview'?s.point.name:i===0?'出发':modeNames[s.mode])}${!valid(s.point)?' · 位置待确认':''}</text></g>`;
 });
 $('#map-order').innerHTML=svg+'</svg>';
 $('#map-order').querySelectorAll('[data-order-index]').forEach(el=>{
  const choose=()=>{const i=+el.dataset.orderIndex;if(current==='overview'){window.open(search(items[i].point),'_blank','noopener,noreferrer');}else selectStop(i);};
  el.addEventListener('click',choose);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose();}});
 });
}
function renderStops() {
 $('#map-reset').hidden=current==='overview';
 if(current==='overview'){
  $('#map-list-title').textContent='8天行程 · 点日期展开';$('#map-progress').textContent='';
  $('#map-stops').innerHTML='<p class="map-overview-desc">以札幌为基地：小樽当天往返，登别住一晚，2月1日去支笏湖，最后回新千岁机场。</p>'+days.filter(d=>d.id!=='eve').map(d=>`<div class="map-stop-row"><div class="map-stop-main"><button type="button" data-open-day="${d.id}"><time>${d.label} · ${d.date}</time><span>${esc(d.title)}</span></button></div></div>`).join('');
  $('#map-stops').querySelectorAll('[data-open-day]').forEach(b=>b.onclick=()=>selectDay(b.dataset.openDay));return;
 }
 const first=route.findIndex((_,i)=>!isDone(i)),done=route.filter((_,i)=>isDone(i)).length;
 $('#map-list-title').textContent='当天执行顺序';$('#map-progress').textContent=done+' / '+route.length+' 已完成'+(storageWarning?' · 无法保存到设备':'');
 $('#map-stops').innerHTML=route.map((s,i)=>`<div class="map-stop-row ${isDone(i)?'done':''} ${first===i?'current':''} ${selected===i?'selected':''}" data-stop-row="${i}"><div class="map-stop-main"><input type="checkbox" ${isDone(i)?'checked':''} data-check-stop="${i}" aria-label="标记第${i+1}站${esc(s.title)}已完成"><button type="button" data-focus-stop="${i}"><time>${esc(s.time)}</time><span>${i+1}. ${esc(s.title)}</span></button></div><div class="map-stop-sub"><span class="map-mode">${i===0?'出发':esc(modeNames[s.mode])}${!valid(s.point)?' · 位置待确认':''}</span>${link(i?navURL(route[i-1].point,s.point,s.mode):search(s.point),i?'分段导航 ↗':'查看地点 ↗')}</div><p class="map-stop-detail" ${selected===i?'':'hidden'}>${esc(s.note||s.point.note||s.point.name)}</p></div>`).join('');
 $('#map-stops').querySelectorAll('[data-focus-stop]').forEach(b=>b.onclick=()=>selectStop(+b.dataset.focusStop));
 $('#map-stops').querySelectorAll('[data-check-stop]').forEach(c=>c.onchange=()=>{saved.done[doneKey(+c.dataset.checkStop)]=c.checked;persist();renderStops();renderOrder();});
}
function selectStop(i,pan=true) {
 if(!route[i])return;
 selected=i;renderStops();renderOrder();
 if(map&&valid(route[i].point)&&view==='geo'){
  const groups=new Map();
  stopMarkers.forEach((m,n)=>{const indices=groups.get(m)||[];indices.push(n);groups.set(m,indices);});
  groups.forEach((indices,m)=>m.setIcon(icon(indices.map(n=>n+1).join('·'),indices.some(n=>['hotel','takimoto'].includes(route[n].place))?'hotel':'',indices.includes(i))));
  if(pan)map.setView(ll(route[i].point),Math.max(map.getZoom(),14),{animate:false});
  const marker=stopMarkers.get(i);if(marker){marker.setPopupContent(popup(route[i],i));marker.openPopup();}
 }else if(!valid(route[i].point))updateStatus('该站地点尚未确定：'+(route[i].note||route[i].point.name));
}
function renderFoodCards() {
 $('#map-food-heading').textContent=current==='overview'?'原计划餐厅 · 按天查看更清楚':'今天吃什么 · 顺路选一家';
 if(!currentFood.length){$('#map-food-cards').innerHTML='<div class="map-no-food">前夜按实际酒店就近用餐，原计划没有指定餐厅。</div>';return;}
 $('#map-food-cards').innerHTML=currentFood.map(id=>{
  const f=F[id],index=route.findIndex(s=>s.choices?.includes(id)),s=route[index],chosen=s?.chosen===id;
  const label=s?`${s.meal} · ${chosen?'已选入路线':s.choices.indexOf(id)===0?'原主选':'备选'}`:valid(f)?'餐厅 / 咖啡候选':'分店待确认 · 暂不落点';
  return `<article class="map-food-card ${chosen?'chosen':''}"><span class="map-food-label">${esc(label)}</span><h5>${esc(f.name)}</h5><p>${esc(f.note)}</p><div class="map-food-actions">${s?`<button type="button" class="food-choose" aria-pressed="${chosen}" data-choose-food="${id}" data-meal-stop="${index}">${chosen?'✓ 已选作'+esc(s.meal):'选作'+esc(s.meal)}</button>`:''}${valid(f)?`<button type="button" data-food-locate="${id}">地图定位</button>`:''}${link(search(f),'店名导航 ↗')}${link(f.source,'店铺来源 ↗')}</div></article>`;
 }).join('');
 $('#map-food-cards').querySelectorAll('[data-choose-food]').forEach(b=>b.onclick=()=>{
  const i=+b.dataset.mealStop;saved.meals[mealKey(route[i],i)]=b.dataset.chooseFood;persist();resolveRoute();selected=i;renderStops();renderFoodCards();renderOrder();renderGeo();fitRoute();
 });
 $('#map-food-cards').querySelectorAll('[data-food-locate]').forEach(b=>b.onclick=()=>{
  $('#map-show-food').checked=true;setView('geo');renderFoodMarkers();const f=F[b.dataset.foodLocate];if(map){map.setView(ll(f),16,{animate:false});foodLayer.eachLayer(m=>{if(m.options.title.startsWith(f.name))m.openPopup();});}$('#trip-map').scrollIntoView({block:'center',behavior:'smooth'});
 });
}
function renderHeading() {
 $('#map-days').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.day===current));
 $('#map-day-title').textContent=day?`${day.label} · ${day.date} · ${day.title}`:'全程概览 · 1/29–2/5';
 $('#map-day-summary').textContent=day?day.summary:'机场、札幌、小樽、支笏湖与登别之间怎样移动，一张图先看清。全程图不包含航线与前夜跨境段。';
 $('#map-plan-note').textContent=day?day.note:'2月1日已选择支笏湖。先看当天路线，再查每段导航；没有指定地点的备选不画成已确定行程。';
 if(current==='d4'&&branch==='lake'){
  const extra=document.createElement('p');extra.style.margin='8px 0 0';
  extra.innerHTML='会期已公布：2027/1/30–2/23；10:00–20:00开放，16:30起亮灯。若等亮灯，需重新核对返程与18:30回酒店目标。<br>'+link('https://www.welcome-to-chitose.jp/archives/16708.html','千岁市官方公告 / 预约接驳入口 ↗')+' · '+link('https://transfer.navitime.biz/chuo-bus/pc/transfer/TransferSearch?defaultCondition=0&dnvName=%E6%94%AF%E7%AC%8F%E6%B9%96&goal=00300925&orvName=%E5%8D%83%E6%AD%B3%E9%A7%85%E5%89%8D&start=00301084','中央巴士：千岁站前 → 支笏湖 ↗');
  $('#map-plan-note').append(extra);
 }
 $('#map-to-plan').href=day?'#trip-plan-'+current:'#route';$('#map-to-plan').textContent=day?'查看当天原计划 ↓':'查看8天总览 ↑';
 const bs=$('#map-branches');bs.hidden=!day?.branches;
 bs.innerHTML=day?.branches?Object.entries(day.branches).map(([key,label])=>`<button type="button" data-branch="${key}" aria-pressed="${branch===key}">${esc(label)}</button>`).join(''):'';
 bs.querySelectorAll('button').forEach(b=>b.onclick=()=>{branch=b.dataset.branch;selected=-1;renderAll();syncOriginalChoice();});
 $('#map-local').disabled=current==='overview';
}
function renderAll() {resolveRoute();renderHeading();renderStops();renderFoodCards();renderOrder();renderGeo();if(view==='geo'){ensureTiles();fitRoute();}updateStatus();}
function selectDay(id,{scroll=false,branch:requestedBranch}={}) {
 if(id!=='overview'&&!byId(id))return;
 current=id;selected=-1;const d=byId(id);
 branch=requestedBranch||(d?.defaultBranch||'lake');
 if(d?.branches&&!Object.hasOwn(d.branches,branch))branch=d.defaultBranch;
 renderAll();syncOriginalChoice();
 if(scroll)$('#route-map').scrollIntoView({behavior:'smooth',block:'start'});
}
function setView(next) {
 view=next;$('#trip-map').hidden=view!=='geo';$('#map-order').hidden=view!=='order';
 document.querySelectorAll('[data-map-view]').forEach(b=>{const a=b.dataset.mapView===view;b.classList.toggle('active',a);b.setAttribute('aria-pressed',a);});
 if(view==='geo'&&initMap()){ensureTiles();map.invalidateSize();fitRoute();}updateStatus();
}
function syncOriginalChoice() {
 if(current!=='d4')return;
 document.querySelectorAll('[data-pick]').forEach(b=>b.classList.toggle('active',b.dataset.pick===branch));
 document.querySelectorAll('#choices [data-choice]').forEach(c=>c.classList.toggle('selected',c.dataset.choice===branch));
}
function wireOriginal() {
 document.querySelectorAll('.video-load').forEach(button=>{button.onclick=()=>{const frame=document.createElement('iframe');frame.className='video';frame.src=button.dataset.videoSrc;frame.title='登别温泉一泊二食体验视频';frame.allowFullscreen=true;button.replaceWith(frame);};});
 document.querySelectorAll('#daily > .day-plan').forEach((details,i)=>{
  const d=days[i];if(!d)return;details.id='trip-plan-'+d.id;
  const btn=document.createElement('button');btn.type='button';btn.className='plan-map-link';btn.textContent='↗ 在地图查看 '+d.label+' 路线与餐厅';
  btn.onclick=()=>selectDay(d.id,{scroll:true});details.querySelector('.plan-body').prepend(btn);
  details.querySelector('summary').addEventListener('click',()=>{if(!details.open)selectDay(d.id);});
  details.querySelectorAll('.plan-stop').forEach((node,j)=>{
   const b=document.createElement('button');b.type='button';b.className='map-step-link';b.textContent='地图定位 ↗';
   b.onclick=()=>{let br=d.defaultBranch;if(d.id==='d4'&&j===4)br='city';selectDay(d.id,{scroll:true,branch:br});const n=d.id==='d4'?[0,1,2,4,1,route.length-1][j]:(d.planMap[j]??0);selectStop(Math.min(n,route.length-1));};
   node.querySelector('.plan-content').append(b);
  });
 });
 document.querySelectorAll('[data-pick]').forEach(b=>b.addEventListener('click',()=>selectDay('d4',{branch:b.dataset.pick,scroll:true})));
 const foodDays=['d1','d2','d3','d4','d5','d6','d4','d7','d8'];
 document.querySelectorAll('#food .food-day').forEach((node,i)=>{
  const b=document.createElement('button');b.type='button';b.className='map-step-link';b.style.marginTop='10px';b.textContent='在当天路线图查看餐厅 ↗';
  b.onclick=()=>selectDay(foodDays[i],{scroll:true,branch:i===3?'city':undefined});node.append(b);
 });
 const nav=document.querySelector('.top nav');const a=document.createElement('a');a.href='#route-map';a.textContent='路线地图';nav.insertBefore(a,nav.children[1]);
}
$('#map-days').innerHTML=[{id:'overview',label:'全程',date:'总览'},...days].map(d=>`<button type="button" data-day="${d.id}" aria-pressed="${current===d.id}">${d.label}<small>${d.date}</small></button>`).join('');
$('#map-days').querySelectorAll('button').forEach(b=>b.onclick=()=>selectDay(b.dataset.day));
document.querySelectorAll('[data-map-view]').forEach(b=>b.onclick=()=>setView(b.dataset.mapView));
$('#map-show-food').onchange=()=>{renderFoodMarkers();};
$('#map-fit').onclick=()=>{selected=-1;renderStops();renderGeo();if(view==='geo')fitRoute();else $('#map-order').scrollTop=0;};
$('#map-local').onclick=()=>{setView('geo');fitRoute(true);};
$('#map-to-plan').onclick=()=>{if(day)document.getElementById('trip-plan-'+current).open=true;};
$('#map-reset').onclick=()=>{route.forEach((_,i)=>delete saved.done[doneKey(i)]);persist();renderStops();renderOrder();};
addEventListener('offline',()=>{updateStatus();});
addEventListener('online',()=>{if(view==='geo')ensureTiles();updateStatus();});
addEventListener('resize',()=>{if(map&&view==='geo')map.invalidateSize();});
wireOriginal();renderAll();setView(view);
// Small public API for embedding and structural regression checks.
window.HKRouteMap={selectDay,setView,getState:()=>({day:current,branch,view,stops:route.map(s=>({...s})),foods:currentFood.slice(),selected}),map:()=>map};
})();
