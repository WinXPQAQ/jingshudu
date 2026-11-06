import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {puzzleId} from '../core.mjs';
import {JSDOM} from 'jsdom';
const corpus=JSON.parse(fs.readFileSync(new URL('../puzzles.json',import.meta.url)));
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('actual app interactions: immediate render, matching notes, dialog cancel, all levels and reload',async()=>{
 const dom=new JSDOM(html,{url:'https://sudoku.test/'});
 for(const key of ['window','document','localStorage','navigator'])Object.defineProperty(globalThis,key,{value:dom.window[key],configurable:true});
 globalThis.fetch=async()=>({ok:true,json:async()=>corpus});
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};dom.window.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
 await import('../app.mjs');await new Promise(r=>setTimeout(r,20));
 const $=id=>document.getElementById(id),saved=()=>JSON.parse(localStorage.getItem('jingsudoku-web-v1')),cell=i=>document.querySelector(`[data-index="${i}"]`),key=n=>document.querySelector(`[aria-label="输入 ${n}"]`);
 assert.equal(document.querySelectorAll('.cell').length,81);
 let g=saved(),a=g.givens.indexOf(0),b=g.givens.findIndex((n,i)=>!n&&i!==a),fixed=g.givens.findIndex(Boolean),n=g.givens[fixed],other=n%9+1;
 cell(a).click();key(n).click();assert.equal(cell(a).textContent,String(n));assert.equal(saved().values[a],n);$('undo').click();assert.equal(saved().values[a],0);
 $('notes').click();key(n).click();key(other).click();cell(b).click();key(n).click();cell(fixed).click();
 assert.equal(cell(a).querySelector('.emphasis').textContent,String(n));assert.equal(cell(b).querySelector('.emphasis').textContent,String(n));assert.equal(cell(a).querySelectorAll('.emphasis').length,1);
 $('enhance').click();assert.equal($('enhance').getAttribute('aria-pressed'),'true');cell(a).click();assert.equal(cell(a).querySelectorAll('.emphasis').length,0);
 const before=localStorage.getItem('jingsudoku-web-v1');$('new-game').click();assert($('difficulty-dialog').open);$('difficulty-dialog').querySelector('.cancel').click();assert.equal(localStorage.getItem('jingsudoku-web-v1'),before);
 for(let d=0;d<5;d++){$('new-game').click();document.querySelector(`[data-level="${d}"]`).click();assert(!$('difficulty-dialog').open);assert.equal(saved().level,d);assert.equal(saved().history.length,0);}
 g=saved();a=g.givens.indexOf(0);cell(a).click();key(4).click();const after=saved();const seenBefore=localStorage.getItem('jingsudoku-web-seen-v1');assert(JSON.parse(seenBefore).includes(puzzleId(after.givens.join(''))));assert(JSON.parse(seenBefore).length>=6);
 dom.window.close();const reloaded=new JSDOM(html,{url:'https://sudoku.test/'});
 for(const name of ['window','document','localStorage','navigator'])Object.defineProperty(globalThis,name,{value:reloaded.window[name],configurable:true});
 localStorage.setItem('jingsudoku-web-v1',JSON.stringify(after));localStorage.setItem('jingsudoku-web-seen-v1',seenBefore);
 await import('../app.mjs?reload');await new Promise(r=>setTimeout(r,20));assert.deepEqual(saved(),after);assert.equal(document.querySelectorAll('.cell').length,81);assert.equal(cell(a).textContent,'4');assert.equal(localStorage.getItem('jingsudoku-web-seen-v1'),seenBefore);
 reloaded.window.close();
});
