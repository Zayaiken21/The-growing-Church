export const MOMENT_CATEGORIES={events:'Events & outreach',gatherings:'Church gatherings',members:'Member moments'};
export function mediaUrl(value){if(typeof value!=='string'||!value.trim())return '';if(/^data:(?:image\/(?:png|jpeg|webp)|video\/mp4);base64,[A-Za-z0-9+/=]+$/.test(value))return value;try{const u=new URL(value,'https://zayaiken21.github.io/The-growing-Church/');return ['https:','http:'].includes(u.protocol)?value:'';}catch{return '';}}
export function renderGallery(doc,items=[],filter='all'){
 const root=doc.getElementById('church-moments');if(!root)return;root.replaceChildren();
 const shown=items.filter(x=>filter==='all'||x.category===filter).filter(x=>mediaUrl(x.url));
 const count=doc.getElementById('moment-count');if(count)count.textContent=shown.length+' '+(shown.length===1?'moment':'moments');
 if(!shown.length){const p=doc.createElement('p');p.className='moments-empty';p.textContent='More moments will be shared here as our church family adds photos and videos.';root.append(p);return;}
 for(const item of shown){
  const card=doc.createElement('article');card.className='moment-card'+(item.type==='video'?' moment-film':'');if(/^[a-zA-Z0-9-]+$/.test(item.id||''))card.id=item.id;
  const art=doc.createElement('div');art.className='moment-media';
  if(item.type==='video'){const video=doc.createElement('video');video.controls=true;video.playsInline=true;video.preload='none';if(mediaUrl(item.image))video.poster=item.image;video.setAttribute('aria-label',item.title||'Church video');const source=doc.createElement('source');source.src=item.url;source.type='video/mp4';video.append(source);art.append(video);}
  else{const a=doc.createElement('a');a.href=item.url;a.dataset.momentPhoto='true';a.target='_blank';a.rel='noopener noreferrer';a.setAttribute('aria-label','Enlarge photo: '+(item.title||'Church moment'));const image=doc.createElement('img');image.src=item.url;image.alt=item.alt||item.title||'Greater St. Paul';image.loading='lazy';image.width=1536;image.height=1152;a.append(image);art.append(a);}
  const copy=doc.createElement('div');copy.className='moment-copy';const label=doc.createElement('p');label.className='eyebrow';label.textContent=MOMENT_CATEGORIES[item.category]||'Church life';const title=doc.createElement('h2');title.textContent=item.title;const text=doc.createElement('p');text.textContent=item.text||'';copy.append(label,title,text);
  if(item.date&&/^\d{4}-\d{2}-\d{2}$/.test(item.date)){const date=doc.createElement('time');date.dateTime=item.date;date.textContent=new Date(item.date+'T12:00:00').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});copy.append(date);}
  const link=doc.createElement('a');link.href=item.url;link.target='_blank';link.rel='noopener noreferrer';link.className='moment-open';link.textContent=item.type==='video'?'Open video ↗':'View full photo ↗';if(item.type!=='video')link.dataset.momentPhoto='true';copy.append(link);
  if(item.type==='video'&&item.silent){const note=doc.createElement('p');note.className='moment-note';note.textContent='This video has no audio. '+(item.accessibility||'');copy.append(note);}
  card.append(art,copy);root.append(card);
 }
}
