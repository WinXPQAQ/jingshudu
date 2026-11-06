export const LEVELS=['难','很难','非常难','超级难','无敌难'];
export const peers=Array.from({length:81},(_,i)=>Array.from({length:81},(_,j)=>j).filter(j=>i!==j&&(Math.floor(i/9)===Math.floor(j/9)||i%9===j%9||(Math.floor(i/27)===Math.floor(j/27)&&Math.floor(i%9/3)===Math.floor(j%9/3)))));
export function createGame(puzzle,level){return {version:1,level,givens:[...puzzle].map(Number),values:[...puzzle].map(Number),notes:Array(81).fill(0),history:[]};}
export function conflicts(g){return new Set(g.values.flatMap((v,i)=>v&&peers[i].some(j=>g.values[j]===v)?[i]:[]));}
export function finishedDigits(g){const bad=conflicts(g);return Array.from({length:9},(_,i)=>i+1).filter(n=>g.values.filter(v=>v===n).length===9&&!g.values.some((v,i)=>v===n&&bad.has(i)));}
export function complete(g){return g.values.every(Boolean)&&conflicts(g).size===0;}
export function edit(g,i,n,note=false){
 if(!Number.isInteger(i)||i<0||i>80||!Number.isInteger(n)||n<0||n>9||g.givens[i]||complete(g))return false;
 if(note&&n&&g.values[i])return false;
 if(n===0&&!g.values[i]&&!g.notes[i])return false;
 if(!note&&n&&g.values[i]===n)return false;
 g.history.push({values:[...g.values],notes:[...g.notes]});if(g.history.length>300)g.history.shift();
 if(note&&n)g.notes[i]^=1<<n;
 else{g.values[i]=n;g.notes[i]=0;if(n)for(const j of peers[i])g.notes[j]&=~(1<<n);}
 return true;
}
export function undo(g){const s=g.history.pop();if(!s)return false;g.values=s.values;g.notes=s.notes;return true;}
export function influence(g,selected,enhanced){if(selected<0||selected>80)return new Set();const n=g.values[selected];const sources=enhanced&&n?g.values.flatMap((v,i)=>v===n?[i]:[]):[selected];return new Set(sources.flatMap(i=>[i,...peers[i]]));}
export function validateSave(data){
 if(!data||data.version!==1||!Number.isInteger(data.level)||data.level<0||data.level>4)throw Error('存档版本或难度不正确');
 const array=(a,max)=>Array.isArray(a)&&a.length===81&&a.every(n=>Number.isInteger(n)&&n>=0&&n<=max);
 if(!array(data.givens,9)||data.givens.filter(Boolean).length<17||conflicts({values:data.givens}).size)throw Error('题目数据不正确');
 const validState=s=>s&&array(s.values,9)&&array(s.notes,1022)&&s.notes.every((n,i)=>(n&1)===0&&(!s.values[i]||n===0))&&data.givens.every((n,i)=>!n||s.values[i]===n);
 if(!validState(data)||!Array.isArray(data.history)||data.history.length>300||!data.history.every(validState))throw Error('游戏进度数据不正确');
 return {version:1,level:data.level,givens:[...data.givens],values:[...data.values],notes:[...data.notes],history:data.history.map(s=>({values:[...s.values],notes:[...s.notes]}))};
}
// Stable 64-bit identifier, with collisions checked for every bundled puzzle.
export function puzzleId(puzzle){let a=2166136261,b=2246822507;for(let i=0;i<puzzle.length;i++){const c=puzzle.charCodeAt(i);a=Math.imul(a^c,16777619);b=Math.imul(b^c,3266489909);}return (a>>>0).toString(16).padStart(8,'0')+(b>>>0).toString(16).padStart(8,'0');}
export function validateSeen(ids){if(!Array.isArray(ids)||ids.length>100000||!ids.every(id=>typeof id==='string'&&/^[0-9a-f]{16}$/.test(id)))throw Error('已玩题目记录格式不正确');return new Set(ids);}
export function choosePuzzle(corpus,level,current,seen=new Set()){
 const pool=corpus[level].filter(p=>p!==current&&!seen.has(puzzleId(p)));
 return pool.length?pool[Math.floor(Math.random()*pool.length)]:null;
}
