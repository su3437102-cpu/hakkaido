import http from 'node:http';
import {createReadStream, watch} from 'node:fs';
import {stat, realpath, readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import os from 'node:os';
import {spawn} from 'node:child_process';

const project=path.dirname(fileURLToPath(import.meta.url));
const publicRoot=await realpath(path.join(project,'public'));
const args=process.argv.slice(2);
const option=name=>args.find(a=>a.startsWith('--'+name+'='))?.slice(name.length+3);
const startPort=Number(option('port')??process.env.PORT??4312);
const host=option('host')||'0.0.0.0';
if(!Number.isInteger(startPort)||startPort<0||startPort>65535){console.error('端口必须是0–65535之间的整数。');process.exit(1);}
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8','.zip':'application/zip','.woff2':'font/woff2'};
const clients=new Set();
const watchers=new Map();
let reloadTimer,heartbeat,closed=false;
const inside=file=>file===publicRoot||file.startsWith(publicRoot+path.sep);
function text(res,status,message,headers={}){
 res.writeHead(status,{'Content-Type':'text/plain; charset=utf-8','X-Content-Type-Options':'nosniff',...headers});res.end(message);
}
const server=http.createServer(async(req,res)=>{
 try{
  if(!['GET','HEAD'].includes(req.method)){text(res,405,'此网站只接受读取请求。',{Allow:'GET, HEAD'});return;}
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/__dev/events'){
   res.writeHead(200,{'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-cache, no-transform','Connection':'keep-alive','X-Content-Type-Options':'nosniff'});
   if(req.method==='HEAD'){res.end();return;}
   res.write('retry: 1500\nevent: connected\ndata: {}\n\n');clients.add(res);req.on('close',()=>clients.delete(res));return;
  }
  let pathname;try{pathname=decodeURIComponent(url.pathname);}catch{text(res,400,'网址编码无效。');return;}
  if(pathname.includes('\0')){text(res,400,'无效文件名。');return;}
  if(pathname.split(/[\\/]/).some(p=>p.startsWith('.'))){text(res,403,'不能访问隐藏文件或上层目录。');return;}
  let file=path.resolve(publicRoot,'.'+pathname);
  if(!inside(file)){text(res,403,'不能访问网站目录外的文件。');return;}
  let info;
  try{info=await stat(file);if(info.isDirectory()){file=path.join(file,'index.html');info=await stat(file);}file=await realpath(file);}catch{text(res,404,'未找到这个页面或文件。');return;}
  if(!inside(file)||!info.isFile()){text(res,403,'不能访问这个文件。');return;}
  const etag='"'+info.size.toString(16)+'-'+Math.trunc(info.mtimeMs).toString(16)+'"';
  const headers={'Content-Type':types[path.extname(file).toLowerCase()]||'application/octet-stream','Content-Length':info.size,'Cache-Control':'no-cache','ETag':etag,'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'};
  if(req.headers['if-none-match']===etag){res.writeHead(304,{'ETag':etag,'Cache-Control':'no-cache'});res.end();return;}
  res.writeHead(200,headers);if(req.method==='HEAD'){res.end();return;}
  const stream=createReadStream(file);stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
 }catch(error){if(!res.headersSent)text(res,500,'网站暂时无法读取此文件。');else res.destroy();console.error(error.message);}
});
server.requestTimeout=30000;
server.headersTimeout=15000;
function notify(filename){
 clearTimeout(reloadTimer);reloadTimer=setTimeout(()=>{
  const event='event: reload\ndata: '+JSON.stringify({file:filename,at:Date.now()})+'\n\n';
  for(const client of clients)client.write(event);
  refreshWatchers().catch(()=>{});
 },250);
}
async function refreshWatchers(directory=publicRoot){
 if(closed)return;
 if(!watchers.has(directory)){
  try{const watcher=watch(directory,(event,name)=>{if(name&&!String(name).startsWith('.'))notify(path.relative(publicRoot,path.join(directory,String(name))));});watcher.on('error',()=>{watcher.close();watchers.delete(directory);});watchers.set(directory,watcher);}catch{}
 }
 for(const entry of await readdir(directory,{withFileTypes:true}))if(entry.isDirectory()&&!entry.name.startsWith('.'))await refreshWatchers(path.join(directory,entry.name));
}
await refreshWatchers();
heartbeat=setInterval(()=>{for(const client of clients)client.write(': keep-alive\n\n');},20000);heartbeat.unref();
function listen(port){return new Promise((resolve,reject)=>{const failed=e=>{server.off('listening',ready);reject(e);};const ready=()=>{server.off('error',failed);resolve(server.address().port);};server.once('error',failed);server.once('listening',ready);server.listen(port,host);});}
let actualPort;
for(let offset=0;offset<10;offset++){
 try{actualPort=await listen(startPort===0?0:startPort+offset);break;}catch(error){if(error.code!=='EADDRINUSE'||offset===9||startPort+offset>=65535){console.error('网站启动失败：'+error.message);process.exit(1);}}
}
const localURL='http://localhost:'+actualPort+'/';
console.log('\n北海道行程 · 局域网预览已启动\n');
console.log('本机打开：'+localURL);
if(host==='0.0.0.0')for(const [name,network] of Object.entries(os.networkInterfaces()))for(const address of network||[])if((address.family==='IPv4'||address.family===4)&&!address.internal)console.log('同一网络（'+name+'）： http://'+address.address+':'+actualPort+'/');
if(actualPort!==startPort&&startPort!==0)console.log('原端口已被占用，本次自动使用 '+actualPort+'。');
console.log('\n修改 public 内的文件并保存，网页会自动刷新。');
console.log('保持此窗口开启；按 Ctrl+C 停止网站。\n');
if(args.includes('--open')){
 const command=process.platform==='win32'?['cmd',['/c','start','',localURL]]:process.platform==='darwin'?['open',[localURL]]:['xdg-open',[localURL]];
 const child=spawn(command[0],command[1],{stdio:'ignore',detached:true,windowsHide:true});child.on('error',()=>{});child.unref();
}
function shutdown(){if(closed)return;closed=true;clearTimeout(reloadTimer);clearInterval(heartbeat);for(const watcher of watchers.values())watcher.close();for(const client of clients)client.end();server.close(()=>process.exit(0));setTimeout(()=>process.exit(0),1500).unref();}
process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
