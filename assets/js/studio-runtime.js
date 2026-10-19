import {applyDesign} from './studio-model.js';
let promise;
export function loadDesign(){return promise ||= fetch('assets/studio/design.json').then(r=>r.ok?r.json():null).catch(()=>null);}
export function mountDesign(design){
 if(!design)return;const path=location.pathname.split('/').pop()||'index.html';
 const apply=()=>applyDesign(document,design,path);apply();let frame;
 const observer=new MutationObserver(()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{observer.disconnect();apply();observe();});});
 const observe=()=>observer.observe(document.body,{childList:true,subtree:true});observe();
 window.addEventListener('pagehide',()=>{observer.disconnect();cancelAnimationFrame(frame);},{once:true});
}
