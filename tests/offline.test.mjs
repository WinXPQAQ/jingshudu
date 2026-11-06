import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
test('service worker precaches app, removes old app cache, and serves cached pages without network',async()=>{
 const handlers={},resources=new Map(),deleted=[];let network=0,claimed=false;
 const cache={addAll:async assets=>{for(const p of assets)resources.set(new URL(p,'https://sudoku.test/').pathname,p);},match:async req=>resources.get(new URL(req.url).pathname)};
 const context={URL,Set,Promise,self:{location:{origin:'https://sudoku.test'},registration:{scope:'https://sudoku.test/'},addEventListener:(n,f)=>handlers[n]=f,clients:{claim:async()=>{claimed=true;}}},caches:{open:async()=>cache,keys:async()=>['jingsudoku-web-old','another-app'],delete:async k=>deleted.push(k)},fetch:async()=>{network++;throw Error('offline');}};
 vm.runInNewContext(fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8'),context);
 let pending;handlers.install({waitUntil:p=>pending=p});await pending;assert(resources.has('/puzzles.json'));
 handlers.activate({waitUntil:p=>pending=p});await pending;assert.deepEqual(deleted,['jingsudoku-web-old']);assert(claimed);
 for(const path of ['/','/index.html','/app.mjs','/puzzles.json']){handlers.fetch({request:{method:'GET',url:'https://sudoku.test'+path},respondWith:p=>pending=p});assert(await pending);}assert.equal(network,0);
 let intercepted=false;handlers.fetch({request:{method:'POST',url:'https://sudoku.test/'},respondWith:()=>intercepted=true});assert(!intercepted);
});
