import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,copyFile,writeFile,rm} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const fixture=await mkdtemp(path.join(os.tmpdir(),'hokkaido-lan-test-'));
await mkdir(path.join(fixture,'public','data'),{recursive:true});
await copyFile(path.join(project,'server.mjs'),path.join(fixture,'server.mjs'));
await writeFile(path.join(fixture,'public','index.html'),'<h1>行程预览</h1>');
await writeFile(path.join(fixture,'public','data','plan.json'),'{}');
await writeFile(path.join(fixture,'secret.txt'),'outside public');
const children=[];
async function launch(port=0){
 const child=spawn(process.execPath,[path.join(fixture,'server.mjs'),'--host=127.0.0.1','--port='+port],{stdio:['ignore','pipe','pipe']});children.push(child);
 let output='';
 const actual=await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(new Error('Server startup timed out: '+output)),10000);
  child.stdout.on('data',chunk=>{output+=chunk;const match=output.match(/http:\/\/localhost:(\d+)\//);if(match){clearTimeout(timer);resolve(Number(match[1]));}});
  child.stderr.on('data',chunk=>{output+=chunk;});child.once('error',error=>{clearTimeout(timer);reject(error);});
 });
 return {child,port:actual,url:'http://127.0.0.1:'+actual};
}
let server;
test.before(async()=>{server=await launch();});
test.after(async()=>{for(const child of children)child.kill('SIGTERM');await Promise.all(children.map(child=>new Promise(resolve=>{if(child.exitCode!==null)resolve();else{child.once('exit',resolve);setTimeout(resolve,2000).unref();}})));await rm(fixture,{recursive:true,force:true});});

test('serves the page and JSON with correct encoding and cache validation',async()=>{
 const page=await fetch(server.url+'/');assert.equal(page.status,200);assert.match(page.headers.get('content-type'),/text\/html.*utf-8/);assert.equal(await page.text(),'<h1>行程预览</h1>');
 const json=await fetch(server.url+'/data/plan.json');assert.equal(json.status,200);assert.deepEqual(await json.json(),{});
 const head=await fetch(server.url+'/',{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');
 const cached=await fetch(server.url+'/',{headers:{'If-None-Match':page.headers.get('etag')}});assert.equal(cached.status,304);
});
test('keeps server code and parent directories outside the published site',async()=>{
 assert.equal((await fetch(server.url+'/server.mjs')).status,404);
 assert.equal((await fetch(server.url+'/%2e%2e%2fsecret.txt')).status,403);
 assert.equal((await fetch(server.url+'/.hidden')).status,403);
 assert.equal((await fetch(server.url+'/%00')).status,400);
 assert.equal((await fetch(server.url+'/',{method:'POST',body:'change'})).status,405);
});
test('selects another port when the requested port is occupied',async()=>{
 const second=await launch(server.port);assert(second.port>server.port&&second.port<server.port+10);assert.equal((await fetch(second.url+'/')).status,200);second.child.kill('SIGTERM');
});
test('a saved public file produces a browser reload notification',async()=>{
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),6000);
 try{
  const response=await fetch(server.url+'/__dev/events',{signal:controller.signal});assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/text\/event-stream/);
  const reader=response.body.getReader(),decoder=new TextDecoder();let messages='';
  while(!messages.includes('event: connected')){const {value}=await reader.read();messages+=decoder.decode(value);}
  await writeFile(path.join(fixture,'public','updated.txt'),'new content');
  while(!messages.includes('event: reload')){const {value}=await reader.read();messages+=decoder.decode(value);}
  assert.match(messages,/updated\.txt/);assert.equal(await(await fetch(server.url+'/updated.txt')).text(),'new content');
 }finally{clearTimeout(timeout);controller.abort();}
});
