// Independent JavaScript verifier: uniqueness plus both branches of EVERY
// bivalue at the basic fixed point. Does not import the C++ implementation.
import fs from 'node:fs';
import {peers} from '../core.mjs';
const units=[];for(let r=0;r<9;r++)units.push(Array.from({length:9},(_,c)=>r*9+c));for(let c=0;c<9;c++)units.push(Array.from({length:9},(_,r)=>r*9+c));for(let b=0;b<9;b++)units.push(Array.from({length:9},(_,j)=>(Math.floor(b/3)*3+Math.floor(j/3))*9+b%3*3+j%3));
const bits=new Uint8Array(1024);for(let i=1;i<1024;i++)bits[i]=bits[i>>1]+(i&1);
export function solutions(puzzle,limit=2){const v=Uint8Array.from(puzzle,Number),row=new Uint16Array(9),col=new Uint16Array(9),box=new Uint16Array(9);const bx=i=>Math.floor(i/27)*3+Math.floor(i%9/3);
 for(let i=0;i<81;i++)if(v[i]){const bit=1<<v[i];if((row[Math.floor(i/9)]|col[i%9]|box[bx(i)])&bit)return 0;row[Math.floor(i/9)]|=bit;col[i%9]|=bit;box[bx(i)]|=bit;}
 function dfs(){let at=-1,mask=0,best=10;for(let i=0;i<81;i++)if(!v[i]){const m=1022&~(row[Math.floor(i/9)]|col[i%9]|box[bx(i)]),size=bits[m];if(!size)return 0;if(size<best){at=i;mask=m;best=size;if(size===1)break;}}if(at<0)return 1;let total=0;const r=Math.floor(at/9),c=at%9,b=bx(at);while(mask){const m=mask&-mask;mask^=m;v[at]=31-Math.clz32(m);row[r]|=m;col[c]|=m;box[b]|=m;total+=dfs();row[r]^=m;col[c]^=m;box[b]^=m;if(total>=limit)break;}v[at]=0;return Math.min(total,limit);}return dfs();}
export function state(puzzle){const v=Uint8Array.from(puzzle,Number),m=new Uint16Array(81);for(let i=0;i<81;i++)if(!v[i]){m[i]=1022;for(const j of peers[i])m[i]&=~(1<<v[j]);}return {v,m};}
function put(s,i,d){s.v[i]=d;s.m[i]=0;for(const j of peers[i])s.m[j]&=~(1<<d);}
export function propagate(s){const {v,m}=s;for(;;){let progressed=false;
 for(let i=0;i<81;i++)if(!v[i]){if(!m[i])return -1;if(bits[m[i]]===1){put(s,i,31-Math.clz32(m[i]));progressed=true;}}
 if(progressed)continue;
 for(const u of units){let occupied=0;for(const i of u)if(v[i]){if(occupied&(1<<v[i]))return -1;occupied|=1<<v[i];}
 for(let d=1;d<=9;d++)if(!(occupied&(1<<d))){let n=0,at=-1;for(const i of u)if(m[i]&(1<<d)){n++;at=i;}if(!n)return -1;if(n===1){put(s,at,d);progressed=true;break;}}if(progressed)break;}
 if(progressed)continue;
 if(v.every(Boolean))return 1;
 // Apply one pair elimination then revisit singles to keep this implementation
 // independent from the production step selector's operation order.
 for(const u of units){const pairs=new Map();for(const i of u)if(bits[m[i]]===2){if(!pairs.has(m[i]))pairs.set(m[i],[]);pairs.get(m[i]).push(i);}for(const [mask,cells] of pairs)if(cells.length===2){for(const i of u)if(!cells.includes(i)){const next=m[i]&~mask;if(next!==m[i]){m[i]=next;progressed=true;}}if(progressed)break;}if(progressed)break;
 for(let a=1;a<=9&&!progressed;a++)for(let b=a+1;b<=9&&!progressed;b++){const mask=(1<<a)|(1<<b),cs=u.filter(i=>m[i]&mask);if(cs.length===2&&cs.some(i=>m[i]&(1<<a))&&cs.some(i=>m[i]&(1<<b)))for(const i of cs){const next=m[i]&mask;if(next!==m[i]){m[i]=next;progressed=true;}}}if(progressed)break;}
 if(progressed)continue;
 for(const u of units){for(let d=1;d<=9;d++){const cs=u.filter(i=>m[i]&(1<<d));if(cs.length<2)continue;const targets=peers[cs[0]].filter(i=>!u.includes(i)&&cs.every(c=>peers[c].includes(i)));for(const i of targets)if(m[i]&(1<<d)){m[i]&=~(1<<d);progressed=true;}if(progressed)break;}if(progressed)break;}
 if(!progressed)return 0;
 }}
export function hasOneBranchShortcut(puzzle){const base=state(puzzle),status=propagate(base);if(status===1)return true;if(status<0)throw Error('Invalid basic state');for(let i=0;i<81;i++)if(bits[base.m[i]]===2){for(let d=1;d<=9;d++)if(base.m[i]&(1<<d)){const next={v:base.v.slice(),m:base.m.slice()};put(next,i,d);if(propagate(next)===1)return true;}}return false;}
if(process.argv[1]?.endsWith('verify-corpus.mjs')){
 const file=process.argv[2]||'puzzles.json',shard=Number(process.argv[3]||0),shards=Number(process.argv[4]||1),corpus=JSON.parse(fs.readFileSync(file));let checked=0,high=0;
 for(let d=0;d<5;d++)for(let i=shard;i<corpus[d].length;i+=shards){const p=corpus[d][i];if(solutions(p)!==1)throw Error(`Nonunique ${d}:${i}`);if(d>=3){if(hasOneBranchShortcut(p))throw Error(`One-branch shortcut ${d}:${i} ${p}`);high++;}checked++;if(checked%1000===0)console.log(JSON.stringify({shard,checked,high}));}
 console.log(JSON.stringify({shard,checked,high,status:'passed'}));
}
