import {LEVELS,createGame,conflicts,finishedDigits,complete,edit,undo,influence,validateSave,choosePuzzle} from './core.mjs';
const $=id=>document.getElementById(id),SAVE='jingsudoku-web-v1',PREF='jingsudoku-web-preferences';
let game,corpus,selected=-1,noteMode=false,enhanced=false,pendingImport=null,saveFailed=false;
const cells=[],keys=[];
function notice(s){$('notice').textContent=s;}
function persist(){try{localStorage.setItem(SAVE,JSON.stringify(game));saveFailed=false;$('save-status').textContent='进度已保存在这台设备';}catch{saveFailed=true;$('save-status').textContent='无法自动保存，请导出备份';notice('浏览器无法保存进度，请在「存档与备份」中导出。');}}
function render(){
 if(!game)return;
 const bad=conflicts(game),range=influence(game,selected,enhanced),n=game.values[selected]||0,done=complete(game),finished=finishedDigits(game);
 cells.forEach((cell,i)=>{
  const value=game.values[i];
  cell.className=['cell',game.givens[i]?'given':'',range.has(i)?'affected':'',n&&value===n?'match':'',bad.has(i)?'conflict':'',selected===i?'selected':''].filter(Boolean).join(' ');
  cell.setAttribute('aria-pressed',String(selected===i));cell.tabIndex=selected===i||(selected<0&&i===0)?0:-1;
  const notes=Array.from({length:9},(_,j)=>j+1).filter(d=>game.notes[i]&(1<<d));
  cell.setAttribute('aria-label',`第${Math.floor(i/9)+1}行第${i%9+1}列，${value||'空格'}${game.givens[i]?'，固定数字':''}${bad.has(i)?'，重复冲突':''}${notes.length?'，笔记 '+notes.join('、'):''}`);
  if(value){cell.textContent=value;}
  else{cell.replaceChildren();const grid=document.createElement('span');grid.className='candidate-grid';grid.setAttribute('aria-hidden','true');for(let d=1;d<=9;d++){const c=document.createElement('span');c.className='candidate'+(d===n?' emphasis':'');c.textContent=notes.includes(d)?d:'';grid.append(c);}cell.append(grid);}
 });
 keys.forEach((key,i)=>{key.classList.toggle('finished',finished.includes(i+1));key.disabled=done;key.setAttribute('aria-hidden',String(finished.includes(i+1)));key.tabIndex=finished.includes(i+1)?-1:0;});
 $('undo').disabled=!game.history.length;$('erase').disabled=selected<0||!!game.givens[selected]||done||(!game.values[selected]&&!game.notes[selected]);$('notes').disabled=done;
 $('notes').setAttribute('aria-pressed',String(noteMode));$('enhance').setAttribute('aria-pressed',String(enhanced));
 $('level').textContent=done?'完成了，漂亮！':`当前 · ${LEVELS[game.level]}`;
 $('progress').replaceChildren(document.createTextNode(`${game.values.filter(Boolean).length} `));const suffix=document.createElement('span');suffix.textContent='/ 81';$('progress').append(suffix);
 $('hint').textContent=done?'这一局完成了。休息一下，或开始新的挑战。':noteMode?'笔记模式 · 点击数字，添加或移除候选数':selected>=0&&game.givens[selected]?'这是题目给定数字，可以查看相同数字与笔记。':'选择空格，再点击数字填写。';
}
function enter(n){
 if(!game)return;
 if(selected<0){notice('先在棋盘上选择一个空格。');return;}
 if(game.givens[selected]){notice('题目给定数字不可修改，请选择空格。');return;}
 if(edit(game,selected,n,noteMode&&n!==0)){notice('');persist();render();if(complete(game))notice('九宫归位，这一局完成了！');}
}
function undoMove(){if(game&&undo(game)){notice('');persist();render();}}
function open(id){$(id).showModal();}
for(let i=0;i<81;i++){
 const cell=document.createElement('button');cell.type='button';cell.className='cell';cell.dataset.index=i;
 cell.addEventListener('click',()=>{selected=i;if(!saveFailed)notice('');render();});$('board').append(cell);cells.push(cell);
}
for(let n=1;n<=9;n++){const key=document.createElement('button');key.className='number-key';key.textContent=n;key.setAttribute('aria-label',`输入 ${n}`);key.onclick=()=>enter(n);$('keypad').append(key);keys.push(key);}
LEVELS.forEach((label,d)=>{const b=document.createElement('button');b.className='difficulty-option';b.dataset.level=d;const text=document.createElement('span');text.textContent=label;const dots=document.createElement('small');dots.textContent='●'.repeat(d+1)+'○'.repeat(4-d);dots.setAttribute('aria-hidden','true');b.append(text,dots);b.onclick=()=>{if(!corpus){notice('题库尚未加载，请联网后重试。');return;}game=createGame(choosePuzzle(corpus,d,game?.givens.join('')),d);selected=-1;noteMode=false;notice('');persist();render();$('difficulty-dialog').close();};$('difficulty-options').append(b);});
$('new-game').onclick=()=>open('difficulty-dialog');$('undo').onclick=undoMove;$('erase').onclick=()=>enter(0);
$('notes').onclick=()=>{noteMode=!noteMode;render();};
$('enhance').onclick=()=>{enhanced=!enhanced;try{localStorage.setItem(PREF,JSON.stringify({enhanced}));}catch{notice('此浏览器无法记住辅助增强设置。');}render();};
$('help').onclick=$('install-info').onclick=()=>open('help-dialog');
$('backup').onclick=()=>{pendingImport=null;$('import').value='';$('import-status').textContent='';$('confirm-import').hidden=true;open('backup-dialog');};
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
$('export').onclick=()=>{if(!game)return;const blob=new Blob([JSON.stringify(game,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`静数独-${new Date().toISOString().slice(0,10)}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);$('import-status').textContent='已准备下载，请将文件保存到“文件”或下载目录。';};
$('import').onchange=async()=>{pendingImport=null;$('confirm-import').hidden=true;const f=$('import').files[0];if(!f)return;try{if(f.size>1500000)throw Error('文件过大');pendingImport=validateSave(JSON.parse(await f.text()));$('import-status').textContent=`已读取：${LEVELS[pendingImport.level]}，填写 ${pendingImport.values.filter(Boolean).length}/81 格。确认后替换当前进度。`;$('confirm-import').hidden=false;}catch{$('import-status').textContent='无法读取该存档。请选择本网页版导出的有效 JSON 文件，当前进度未改变。';}};
$('confirm-import').onclick=()=>{if(!pendingImport)return;game=pendingImport;pendingImport=null;selected=-1;noteMode=false;notice('存档已导入。');persist();render();$('backup-dialog').close();};
document.addEventListener('keydown',e=>{
 if(document.querySelector('dialog[open]')||!game||e.altKey)return;
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();undoMove();return;}
 if(e.ctrlKey||e.metaKey)return;
 if(/^[1-9]$/.test(e.key)){e.preventDefault();enter(Number(e.key));}
 else if(e.key==='Backspace'||e.key==='Delete'){e.preventDefault();enter(0);}
 else if(e.key.toLowerCase()==='n'&&!complete(game)){noteMode=!noteMode;render();}
 else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
  e.preventDefault();const i=selected<0?0:selected,r=Math.floor(i/9),c=i%9;
  selected=e.key==='ArrowLeft'?r*9+Math.max(0,c-1):e.key==='ArrowRight'?r*9+Math.min(8,c+1):e.key==='ArrowUp'?Math.max(0,r-1)*9+c:Math.min(8,r+1)*9+c;render();cells[selected].focus();
 }
});
window.addEventListener('storage',e=>{if(e.key===SAVE&&e.newValue){try{game=validateSave(JSON.parse(e.newValue));selected=-1;render();notice('已同步此浏览器另一个标签页的进度。');}catch{}}});
async function init(){
 $('new-game').disabled=true;
 try{enhanced=JSON.parse(localStorage.getItem(PREF)||'{}').enhanced===true;const raw=localStorage.getItem(SAVE);if(raw)game=validateSave(JSON.parse(raw));}catch{notice('旧存档无法读取或存储不可用，可以重新开局或导入备份。');}
 if(game)render();
 try{const response=await fetch('./puzzles.json');if(!response.ok)throw Error('题库加载失败');corpus=await response.json();if(!Array.isArray(corpus)||corpus.length!==5||!corpus.every(a=>Array.isArray(a)&&a.length&&a.every(p=>/^[0-9]{81}$/.test(p))))throw Error('题库格式错误');if(!game){game=createGame(choosePuzzle(corpus,0),0);persist();}$('new-game').disabled=false;render();}
 catch{notice('题库未能加载。请联网后刷新；已有存档仍可继续。');if(!game){$('board').setAttribute('aria-label','题库加载失败');$('undo').disabled=$('erase').disabled=$('notes').disabled=true;keys.forEach(k=>k.disabled=true);}}
 $('export').disabled=!game;
 if('serviceWorker' in navigator){
  try{await navigator.serviceWorker.register('./sw.js');const registration=await navigator.serviceWorker.ready;
   if(registration.active)$('offline-status').textContent='已可离线使用 · 下次打开继续';
   navigator.serviceWorker.addEventListener('controllerchange',()=>{$('offline-status').textContent='已可离线使用 · 下次打开继续';});
  }catch{$('offline-status').textContent='离线缓存未完成，请保持联网';}
 }else{$('offline-status').textContent='此浏览器暂不支持离线缓存';}
}
init();
