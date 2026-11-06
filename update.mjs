// This route deliberately stays outside the offline shell cache, so older
// service workers can reach it even while other tabs keep them active.
export async function upgrade(serviceWorker){
 const registration=await serviceWorker.register('./sw.js',{updateViaCache:'none'});
 await registration.update();
 const worker=registration.installing||registration.waiting||registration.active;
 if(!worker)throw Error('没有可用的新版本');
 await new Promise((resolve,reject)=>{
  let timer;
  const finish=error=>{clearTimeout(timer);worker.removeEventListener('statechange',changed);error?reject(error):resolve();};
  const changed=()=>{if(worker.state==='activated')finish();else if(worker.state==='redundant')finish(Error('新版下载失败'));else if(worker.state==='installed')worker.postMessage({type:'ACTIVATE_UPDATE'});};
  timer=setTimeout(()=>finish(Error('下载超时，请联网后重试')),90000);
  worker.addEventListener('statechange',changed);changed();
 });
}
if(typeof document!=='undefined'&&document.getElementById('retry')){
 const status=document.getElementById('status'),retry=document.getElementById('retry');
 const run=async()=>{retry.hidden=true;status.textContent='正在下载新版，完成后自动返回游戏…';try{if(!('serviceWorker' in navigator))throw Error('此浏览器不支持离线更新，请返回游戏并刷新页面');await upgrade(navigator.serviceWorker);status.textContent='更新完成，正在返回游戏…';location.replace('./');}catch{status.textContent='更新未完成，当前存档保持不变。请检查网络后重试。';retry.hidden=false;}};
 retry.onclick=run;run();
}
