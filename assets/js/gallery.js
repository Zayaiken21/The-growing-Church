import {init} from './core.js';
import {renderGallery} from './gallery-model.js';
const content=await init();const items=content.moments||[];renderGallery(document,items);
const filters=document.querySelector('.moment-filters');filters.addEventListener('click',event=>{const button=event.target.closest('[data-category]');if(!button)return;document.querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));document.querySelectorAll('#church-moments video').forEach(v=>v.pause());renderGallery(document,items,button.dataset.category);const count=items.filter(i=>button.dataset.category==='all'||i.category===button.dataset.category).length;document.getElementById('moment-count').textContent=count+' '+(count===1?'moment':'moments');});
const dialog=document.createElement('dialog');dialog.className='moment-dialog';dialog.setAttribute('aria-label','Church photo viewer');const close=document.createElement('button');close.className='btn';close.textContent='Close photo ✕';close.onclick=()=>dialog.close();const image=document.createElement('img');dialog.append(close,image);document.body.append(dialog);
document.getElementById('church-moments').addEventListener('click',event=>{const link=event.target.closest('[data-moment-photo]');if(!link)return;event.preventDefault();image.src=link.href;image.alt=link.closest('article').querySelector('img')?.alt||'Church photo';dialog.showModal();});
dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
document.addEventListener('play',event=>{if(event.target.tagName==='VIDEO')document.querySelectorAll('video').forEach(v=>{if(v!==event.target)v.pause();});},true);
if(location.hash){const target=document.getElementById(location.hash.slice(1));target?.scrollIntoView({block:'start'});}
