/* Offline cartography: GSI vector tile experiment, clipped and restyled.
   Source: https://github.com/gsi-cyberjapan/gsimaps-vector-experiment
   Terms: https://www.gsi.go.jp/kikakuchousei/kikakuchousei40182.html
   Regional land outlines: Natural Earth, public domain.
   All geographic data is embedded. This renderer makes no network requests. */
(() => {
'use strict';
const data=window.HKOfflineMapData;
if(!data||!window.L)return;
const land=data.land.map(poly=>{
 const rings=poly.map(r=>r.map(([lng,lat])=>[(lng+180)/360,(1-Math.asinh(Math.tan(lat*Math.PI/180))/Math.PI)/2]));
 const ps=rings.flat();return {rings,bbox:[Math.min(...ps.map(p=>p[0])),Math.min(...ps.map(p=>p[1])),Math.max(...ps.map(p=>p[0])),Math.max(...ps.map(p=>p[1]))]};
});
const majorLabels=[['札幌',43.065,141.35],['小樽',43.197,141.00],['千岁',42.828,141.65],['新千岁机场',42.786,141.681],['支笏湖',42.752,141.327],['登别',42.452,141.180],['登别温泉',42.495,141.145],['广州',23.14,113.28],['香港',22.30,114.13]];
const path=(ctx,parts,scale,ox,oy,closed=false)=>{
 ctx.beginPath();
 for(const part of parts){if(part.length<2)continue;ctx.moveTo(part[0][0]*scale+ox,part[0][1]*scale+oy);for(let i=1;i<part.length;i++)ctx.lineTo(part[i][0]*scale+ox,part[i][1]*scale+oy);if(closed)ctx.closePath();}
};
function drawLand(ctx,c){
 const size=256,n=2**c.z,ax=c.x/n,ay=c.y/n,bx=(c.x+1)/n,by=(c.y+1)/n;
 ctx.fillStyle='#d8edf3';ctx.fillRect(0,0,size,size);ctx.fillStyle='#f7f5ed';
 for(const poly of land){const b=poly.bbox;if(b[0]>bx||b[2]<ax||b[1]>by||b[3]<ay)continue;ctx.beginPath();
  for(const ring of poly.rings){for(let i=0;i<ring.length;i++){const x=(ring[i][0]*n-c.x)*size,y=(ring[i][1]*n-c.y)*size;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.closePath();}
  ctx.fill('evenodd');
 }
}
function drawSources(ctx,c,z,detail=false){
 const factor=2**(c.z-z),left=c.x/factor,top=c.y/factor,right=(c.x+1)/factor,bottom=(c.y+1)/factor;
 for(let x=Math.floor(left);x<=Math.floor(right-1e-10);x++)for(let y=Math.floor(top);y<=Math.floor(bottom-1e-10);y++){
  const t=data.tiles[z+'/'+x+'/'+y];if(!t)continue;
  const sourceSize=256*factor,ox=(x*factor-c.x)*256,oy=(y*factor-c.y)*256,scale=sourceSize/t.e;
  ctx.save();ctx.beginPath();ctx.rect(ox,oy,sourceSize,sourceSize);ctx.clip();
  ctx.fillStyle='#f7f5ed';ctx.fillRect(ox,oy,sourceSize,sourceSize);
  ctx.fillStyle='#e9eedf';for(const g of t.h){path(ctx,g,scale,ox,oy,true);ctx.fill('evenodd');}
  ctx.fillStyle='#d8edf3';for(const g of t.w){path(ctx,g,scale,ox,oy,true);ctx.fill('evenodd');}
  if(detail&&c.z>=15){ctx.fillStyle='#e3e2dc';ctx.strokeStyle='#d5d6d0';ctx.lineWidth=.45;for(const g of t.b){path(ctx,g,scale,ox,oy,true);ctx.fill('evenodd');ctx.stroke();}}
  ctx.strokeStyle='#a4cddf';ctx.lineWidth=detail?1.05:1.5;for(const g of t.n){path(ctx,g,scale,ox,oy);ctx.stroke();}
  const roadSize=detail?(c.z>=16?3.3:c.z>=15?2.6:1.8):1.4;
  ctx.lineCap='round';ctx.lineJoin='round';
  for(const isMajor of [false,true]){
   for(const pass of ['outline','fill']){
    for(const [cat,width,motor,g] of t.r){
     const major=cat===0||cat===1;if(major!==isMajor)continue;
     if(!detail&&c.z<10&&cat>=2)continue;
     const roadW=roadSize*(major?1.55:1)*(width===0?1.25:1);
     ctx.lineWidth=pass==='outline'?roadW+1.2:roadW;
     ctx.strokeStyle=pass==='outline'?(major?'#d4c7a8':'#d6d7d3'):(motor===1?'#c9dfbe':major?'#fff0c5':'#ffffff');
     path(ctx,g,scale,ox,oy);ctx.stroke();
    }
   }
  }
  for(const [state,g] of t.q){
   path(ctx,g,scale,ox,oy);ctx.strokeStyle='#8c979d';ctx.lineWidth=detail?2.1:1.8;ctx.stroke();
   ctx.setLineDash([4,4]);ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.stroke();ctx.setLineDash([]);
  }
  ctx.restore();
 }
}
function drawLabels(ctx,c,z,occupied){
 if(z===9&&c.z<=11)return;
 const factor=2**(c.z-z),left=c.x/factor,top=c.y/factor,right=(c.x+1)/factor,bottom=(c.y+1)/factor;
 for(let x=Math.floor(left);x<=Math.floor(right-1e-10);x++)for(let y=Math.floor(top);y<=Math.floor(bottom-1e-10);y++){
  const t=data.tiles[z+'/'+x+'/'+y];if(!t)continue;
  const scale=256*factor/t.e,ox=(x*factor-c.x)*256,oy=(y*factor-c.y)*256;
  const labels=[...t.l].sort((a,b)=>(a[3]===422?-1:b[3]===422?1:0));
  for(const [px,py,text,cat] of labels){
   if(z===9&&c.z>=13)continue;
   if(cat===210&&c.z<15)continue;
   if(z===14&&c.z<14&&cat!==422)continue;
   const x=px*scale+ox,y=py*scale+oy;if(x<8||x>248||y<8||y>248)continue;
   const size=cat===422?11.5:cat===210?10:11;
   drawLabel(ctx,x,y,text,size,cat===422?'#546e85':'#7a807c',occupied);
  }
 }
}
function drawLabel(ctx,x,y,text,size,color,occupied){
 if(text.length>19)return;
 ctx.font=`${size}px "Microsoft YaHei UI","PingFang SC","Noto Sans CJK SC",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
 const w=ctx.measureText(text).width+8,h=size+7,box=[x-w/2,y-h/2,x+w/2,y+h/2];
 if(box[0]<3||box[1]<3||box[2]>253||box[3]>253)return;
 if(occupied.some(b=>b[0]<box[2]&&b[2]>box[0]&&b[1]<box[3]&&b[3]>box[1]))return;
 occupied.push(box);ctx.lineJoin='round';ctx.strokeStyle='#fafbf8';ctx.lineWidth=3;ctx.strokeText(text,x,y);ctx.fillStyle=color;ctx.fillText(text,x,y);
}
function drawRegionalLabels(ctx,c,occupied){
 if(c.z>12)return;const n=2**c.z;
 for(const [text,lat,lng] of majorLabels){const x=((lng+180)/360*n-c.x)*256,y=((1-Math.asinh(Math.tan(lat*Math.PI/180))/Math.PI)/2*n-c.y)*256;if(x>15&&x<241&&y>12&&y<244)drawLabel(ctx,x,y,text,12.5,'#526f78',occupied);}
}
const OfflineLayer=L.GridLayer.extend({
 options:{tileSize:256,minZoom:5,maxZoom:17,keepBuffer:1,pane:'tilePane',attribution:'<a href="https://github.com/gsi-cyberjapan/gsimaps-vector-experiment" target="_blank" rel="noopener noreferrer">GSI</a> 数据经裁剪与重绘 · <a href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noopener noreferrer">Natural Earth</a> · 离线内置'},
 createTile(coords){
  const el=document.createElement('canvas'),ratio=Math.min(window.devicePixelRatio||1,2);el.width=el.height=256*ratio;el.style.width=el.style.height='256px';el.setAttribute('aria-hidden','true');
  const ctx=el.getContext('2d');if(!ctx)return el;
  ctx.scale(ratio,ratio);drawLand(ctx,coords);drawSources(ctx,coords,9,false);if(coords.z>=13)drawSources(ctx,coords,14,true);
  const occupied=[];drawRegionalLabels(ctx,coords,occupied);drawLabels(ctx,coords,9,occupied);if(coords.z>=13)drawLabels(ctx,coords,14,occupied);
  el.dataset.offlineTile=`${coords.z}/${coords.x}/${coords.y}`;
  return el;
 }
});
function coverage(latlng){
 return Object.entries(data.regions).filter(([id,r])=>id!=='hokkaido'&&latlng.lng>=r.bbox[0]&&latlng.lng<=r.bbox[2]&&latlng.lat>=r.bbox[1]&&latlng.lat<=r.bbox[3]).map(([,r])=>r.label);
}
window.HKOfflineBasemap={create:()=>new OfflineLayer(),coverage,source:data.source,tileCount:Object.keys(data.tiles).length};
})();

