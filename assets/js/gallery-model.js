export const MOMENT_CATEGORIES={events:'Events & outreach',gatherings:'Church gatherings',members:'Member moments'};
export function mediaUrl(value){if(typeof value!=='string'||!value.trim())return '';if(/^data:(?:image\/(?:png|jpeg|webp)|video\/mp4);base64,[A-Za-z0-9+/=]+$/.test(value))return value;try{const u=new URL(value,'https://zayaiken21.github.io/The-growing-Church/');return ['https:','http:'].includes(u.protocol)?value:'';}catch{return '';}}
export function renderGallery(doc,items=[],filter='all'){
 const root=doc.getElementById('church-moments');if(!root)return;root.replaceChildren();
 const shown=items.filter(x=>filter==='all'||(filter==='photos'&&x.type==='photo')||(filter==='videos'&&x.type!=='photo')||x.category===filter).filter(x=>mediaUrl(x.url));
 const count=doc.getElementById('moment-count');if(count)count.textContent=shown.length+' '+(shown.length===1?'moment':'moments');
 if(!shown.length){const p=doc.createElement('p');p.className='moments-empty';p.textContent='No moments match this selection. Choose All moments to see the album.';root.append(p);return;}
 const groups=new Map();
 for(const item of shown){const key=item.album||item.albumId||'daily';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(item);}
 const ordered=[...groups.entries()].sort((a,b)=>(a[0]==='daily')-(b[0]==='daily'));
 for(const [key,moments] of ordered){
 const section=doc.createElement('section');section.className=key==='daily'?'life-collection daily-collection':'life-collection event-collection';
 if(key==='daily')section.id='everyday-life';else section.id='album-'+key.replace(/[^a-zA-Z0-9-]/g,'-');
 const header=doc.createElement('header');header.className='collection-heading';
 const eyebrow=doc.createElement('p');eyebrow.className='eyebrow';eyebrow.textContent=key==='daily'?'THE LIFE WE SHARE':'EVENT ALBUM';
 const heading=doc.createElement('h2');heading.textContent=key==='daily'?'Together in Faith':moments[0].album||'Church events';
 const description=doc.createElement('p');description.textContent=key==='daily'?'Our place of worship. Our time together. A glimpse of the church we call home.':'Photos and film from our celebration on Rockaway Avenue.';
 const meta=doc.createElement('p');meta.className='collection-meta';meta.textContent=moments.filter(x=>x.type==='photo').length+' photos · '+moments.filter(x=>x.type!=='photo').length+' videos';
 if(key!=='daily'&&moments[0].date){const date=doc.createElement('time');date.dateTime=moments[0].date;date.textContent=new Date(moments[0].date+'T12:00:00').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});header.append(date);}
 header.append(eyebrow,heading,meta);section.append(header);
 const grid=doc.createElement('div');grid.className='collection-grid';section.append(grid);root.append(section);
 for(const item of moments){
  const card=doc.createElement('article');card.className='moment-card'+(item.type==='video'?' moment-film':'');if(/^[a-zA-Z0-9-]+$/.test(item.id||''))card.id=item.id;
  const art=doc.createElement('div');art.className='moment-media';
  if(item.type==='youtube'){const a=doc.createElement('a');a.href=item.url;a.target='_blank';a.rel='noopener noreferrer';a.className='worship-video-link';const img=doc.createElement('img');img.src=mediaUrl(item.image);img.alt=item.alt||item.title;img.loading='lazy';const play=doc.createElement('span');play.textContent='▶ Watch the service';a.append(img,play);art.append(a);}
  else if(item.type==='video'){const video=doc.createElement('video');video.controls=true;video.playsInline=true;video.preload='none';if(mediaUrl(item.image))video.poster=item.image;video.setAttribute('aria-label',item.title||'Church video');const source=doc.createElement('source');source.src=item.url;source.type='video/mp4';video.append(source);art.append(video);}
  else{const a=doc.createElement('a');a.href=item.url;a.dataset.momentPhoto='true';a.target='_blank';a.rel='noopener noreferrer';a.setAttribute('aria-label','Enlarge photo: '+(item.title||'Church moment'));const image=doc.createElement('img');image.src=item.url;image.alt=item.alt||item.title||'Greater St. Paul';image.loading='lazy';image.width=448;image.height=item.orientation==='portrait'?600:334;if(item.orientation==='portrait')image.className='moment-portrait';a.append(image);art.append(a);}
  const copy=doc.createElement('div');copy.className='moment-copy';const label=doc.createElement('p');label.className='eyebrow';label.textContent=item.type==='video'?'THE HIGHLIGHT FILM':MOMENT_CATEGORIES[item.category]||'Church life';const title=doc.createElement('h3');title.textContent=item.title;const text=doc.createElement('p');text.textContent=item.text||'';if(item.type!=='photo'){title.textContent=item.type==='youtube'?'Sunday Worship':'The Celebration Film';copy.append(title);}
  if(item.type!=='photo'&&item.date&&/^\d{4}-\d{2}-\d{2}$/.test(item.date)){const date=doc.createElement('time');date.dateTime=item.date;date.textContent=new Date(item.date+'T12:00:00').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});copy.append(date);}
  if(item.type==='video'&&mediaUrl(item.flyer)){const a=doc.createElement('a');a.className='festival-flyer';a.href=item.flyer;a.target='_blank';a.rel='noopener noreferrer';const img=doc.createElement('img');img.src=item.flyer;img.alt='Community Outreach Fall Festival flyer — October 24, 2026, 12 PM to 3 PM';img.loading='lazy';const span=doc.createElement('span');span.textContent='View the event flyer ↗';a.append(img,span);copy.append(a);}
  const link=doc.createElement('a');link.href=item.url;link.target='_blank';link.rel='noopener noreferrer';link.className='moment-open';link.textContent=item.type==='youtube'?'Watch on YouTube ↗':item.type==='video'?'Open the film ↗':'View photo ↗';if(item.type==='photo')link.dataset.momentPhoto='true';copy.append(link);
  if(item.type==='video'&&item.silent){const note=doc.createElement('p');note.className='moment-note';note.textContent='Silent highlight film';copy.append(note);if(item.accessibility){const desc=doc.createElement('p');desc.className='moment-accessible';desc.textContent=item.accessibility;copy.append(desc);}}
  card.append(art);if(item.type!=='photo')card.append(copy);else card.classList.add('photo-only');grid.append(card);
 }
 }
}
