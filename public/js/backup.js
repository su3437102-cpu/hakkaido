(() => {
 const allowed=k=>/^hk-(route-map-|must-pack-|v2-plan$)/.test(k);
 const bar=document.createElement('div');bar.className='lan-preview-banner';
 bar.innerHTML='<b>重装备份与恢复</b><button type="button" id="export-records">备份我的记录</button><button type="button" id="import-records">恢复我的记录</button><input type="file" accept="application/json,.json" hidden><span role="status" aria-live="polite"></span>';
 (document.querySelector('.lan-preview-banner')||document.querySelector('header')).after(bar);
 const status=bar.querySelector('[role=status]'),input=bar.querySelector('input');
 bar.querySelector('#export-records').onclick=()=>{
  try{const records={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(allowed(k))records[k]=localStorage.getItem(k);}
   const blob=new Blob([JSON.stringify({format:'hokkaido-browser-backup',version:1,created:new Date().toISOString(),origin:location.origin,records},null,2)],{type:'application/json'});
   const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='hokkaido-records-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent='已导出 '+Object.keys(records).length+' 项记录，请保存到不会被格式化的位置。';
  }catch{status.textContent='无法读取浏览器记录，请检查浏览器存储设置。';}
 };
 bar.querySelector('#import-records').onclick=()=>input.click();
 input.onchange=async()=>{
  try{const file=input.files[0];if(!file)return;if(file.size>2*1024*1024)throw Error('备份文件过大');
   const data=JSON.parse(await file.text());if(data.format!=='hokkaido-browser-backup'||data.version!==1||!data.records||Array.isArray(data.records)||typeof data.records!=='object')throw Error('不是有效的北海道记录备份');
   const entries=Object.entries(data.records);if(entries.some(([k,v])=>!allowed(k)||typeof v!=='string'))throw Error('备份包含不支持的记录');
   if(!entries.length)throw Error('备份没有记录可恢复');
   if(!confirm('将恢复 '+entries.length+' 项记录，并替换当前网址下的同名记录。继续吗？'))return;
   const old=new Map(entries.map(([k])=>[k,localStorage.getItem(k)]));
   try{for(const [k,v]of entries)localStorage.setItem(k,v);}catch(e){for(const[k,v]of old){if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v);}throw e;}
   location.reload();
  }catch(e){status.textContent='恢复失败：'+e.message;}finally{input.value='';}
 };
})();
