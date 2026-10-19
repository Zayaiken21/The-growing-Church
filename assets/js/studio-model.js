export const DESIGN_PATH='assets/studio/design.json';
export const LABELS_PATH='assets/studio/revision-names.json';
export const REPO='Zayaiken21/The-growing-Church';
export const BASE='https://zayaiken21.github.io/The-growing-Church/';
export const PAGE_NAMES={'index.html':'Home','about.html':'About','ministries.html':'Ministries','sermons.html':'Watch','events.html':'Events','helping-hands.html':'Helping Hands','visit.html':'Plan a visit','give.html':'Give','privacy.html':'Privacy'};
export const clone=x=>JSON.parse(JSON.stringify(x));
export const id=()=> 'b-'+crypto.randomUUID();
export function safeLink(value,{image=false}={}){
 if(typeof value!=='string'||!value.trim())return '';
 const s=value.trim();
 if(image && /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(s))return s;
 if(/^[\s\S]*[\u0000-\u001f]/.test(s))return '';
 try{const u=new URL(s,BASE);if(!['https:','http:',...(image?[]:['mailto:','tel:'])].includes(u.protocol))return '';return s;}catch{return '';}
}
export const STYLE_KEYS=['color','backgroundColor','fontSize','fontFamily','fontWeight','textAlign','padding','margin','borderRadius','maxWidth','minHeight','gap','lineHeight','backgroundImage','backgroundPosition','backgroundSize','backgroundBlendMode','opacity'];
export function validStyle(key,value){
 const v=String(value??'');if(!STYLE_KEYS.includes(key))return '';
 if(key==='backgroundImage'){const match=v.match(/^url\("([^"]*)"\)$/);return match&&safeLink(match[1],{image:true})?v:'';}
 if(/[{};<>]|expression|javascript|@import/i.test(v))return '';
 return v;
}
export function validateDesign(d){
 if(!d||d.version!==1||!d.pages||!d.theme||!Array.isArray(d.navigation)||!Array.isArray(d.content?.ministries)||!Array.isArray(d.content?.events)||!Array.isArray(d.content?.slides)||typeof d.content?.settings?.name!=='string')throw Error('This is not a Church Studio backup.');
 if(JSON.stringify(d).length>12000000)throw Error('This draft is too large. Use smaller photos.');
 for(const [p,page] of Object.entries(d.pages)){
  if(!/^[a-z0-9][a-z0-9-]*\.html$/.test(p)||p==='admin.html')throw Error('Invalid page name.');
  if(!Array.isArray(page.blocks)||!page.edits)throw Error('Invalid page layout.');
  for(const b of page.blocks){if(!/^[a-z0-9-]+$/.test(b.id)||!BLOCKS[b.type])throw Error('Unknown block.');}
 }
 return d;
}
export function makePage(label,custom=false){return {label,custom,edits:{},blocks:[],order:[],seo:{}};}
export const BLOCKS={
 welcome:{label:'Welcome banner',hint:'A heading, photo and invitation',fields:{eyebrow:'WELCOME',title:'A place to belong.',text:'Add your welcome message here.',image:'assets/photos/sanctuary-ministries.jpeg',button:'Plan a visit',link:'visit.html'}},
 text:{label:'Words & heading',hint:'Share a message in your own words',fields:{title:'Your heading',text:'Write your message here.'}},
 image:{label:'Photo',hint:'Upload a church photo and caption',fields:{image:'assets/photos/sanctuary-about.jpeg',alt:'Inside Greater St. Paul',caption:'Add a caption'}},
 columns:{label:'Three cards',hint:'Ministries, next steps or announcements',fields:{title:'Find your next step',title1:'Connect',text1:'Add your words here.',title2:'Grow',text2:'Add your words here.',title3:'Serve',text3:'Add your words here.'}},
 quote:{label:'Scripture or quotation',hint:'A verse and its reference',fields:{text:'Let all that you do be done in love.',caption:'1 Corinthians 16:14'}},
 cta:{label:'Invitation & button',hint:'Help visitors take the next step',fields:{title:'We would love to meet you.',text:'Add a short invitation.',button:'Plan a visit',link:'visit.html'}},
 faq:{label:'Questions & answers',hint:'Three expandable answers',fields:{title:'A few things you might wonder',question1:'What should I wear?',answer1:'Come as you are.',question2:'Where are you located?',answer2:'44 Rockaway Avenue, Brooklyn, NY.',question3:'When is worship?',answer3:'Sundays, 12:30–2:30 PM Eastern Time.'}},
 video:{label:'YouTube video',hint:'Paste a YouTube watch link',fields:{title:'Watch with us',url:'https://www.youtube.com/watch?v=vN-0LPKgAAk'}},
 contact:{label:'Address & directions',hint:'Use your church’s current details',fields:{title:'Come gather with us'}},
 spacer:{label:'Breathing room',hint:'Add adjustable space',fields:{height:'48'}}
};
export function newBlock(type){return {id:id(),type,fields:clone(BLOCKS[type].fields),style:{}};}
export function youtubeId(value){try{const u=new URL(value);let v;if(u.hostname==='youtu.be')v=u.pathname.slice(1);else if(['www.youtube.com','youtube.com','m.youtube.com'].includes(u.hostname))v=u.searchParams.get('v')||u.pathname.split('/')[2];return /^[\w-]{11}$/.test(v||'')?v:'';}catch{return '';}}
export function setText(n,value){if(n.textContent!==String(value))n.textContent=String(value);}
export function setAttr(n,key,value){if(n.getAttribute(key)!==value)n.setAttribute(key,value);}
export function renderBlock(block,doc,settings={}){
 const section=doc.createElement('section');section.className='studio-block studio-'+block.type;section.dataset.studioBlock=block.id;section.dataset.siteId=block.id;
 const f=block.fields||{};
 function el(tag,text,cls,parent=section){const n=doc.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;parent.append(n);return n;}
 function photo(parent=section){const url=safeLink(f.image,{image:true});if(url){const n=el('img',undefined,'',parent);n.src=url;n.alt=f.alt||'';n.loading='lazy';}}
 function button(){const url=safeLink(f.link);if(url){const a=el('a',f.button||'Learn more','btn');a.href=url;}}
 if(block.type==='welcome'){const copy=el('div');el('p',f.eyebrow,'eyebrow',copy);el('h2',f.title,'',copy);el('p',f.text,'',copy);const a=el('a',f.button||'Learn more','btn',copy);a.href=safeLink(f.link)||'#';photo();}
 if(block.type==='text'||block.type==='cta'){el('h2',f.title);el('p',f.text);if(block.type==='cta')button();}
 if(block.type==='image'){const figure=el('figure');photo(figure);el('figcaption',f.caption,'',figure);}
 if(block.type==='quote'){el('blockquote',f.text);el('p',f.caption,'eyebrow');}
 if(block.type==='columns'){el('h2',f.title);const grid=el('div',undefined,'grid');for(let i=1;i<=3;i++){const c=el('article',undefined,'card',grid);el('h3',f['title'+i],'',c);el('p',f['text'+i],'',c);}}
 if(block.type==='faq'){el('h2',f.title);for(let i=1;i<=3;i++){const d=el('details');el('summary',f['question'+i],'',d);el('p',f['answer'+i],'',d);}}
 if(block.type==='video'){el('h2',f.title);const vid=youtubeId(f.url);if(vid){const frame=el('iframe');frame.src='https://www.youtube-nocookie.com/embed/'+vid;frame.title=f.title||'Church video';frame.loading='lazy';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';}}
 if(block.type==='contact'){el('h2',f.title);el('p',settings.service||'');const a=el('a',settings.address||'Get directions','btn');a.href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(settings.address||'');a.target='_blank';a.rel='noopener noreferrer';}
 if(block.type==='spacer')section.style.minHeight=Math.max(8,Math.min(240,Number(f.height)||48))+'px';
 for(const [k,v]of Object.entries(block.style||{})){const value=validStyle(k,v);if(value)section.style[k]=value;}
 return section;
}
export function themeCSS(t={}){
 const color=(v,f)=>/^#[a-f\d]{6}$/i.test(v||'')?v:f;
 const font=['Georgia, serif','Arial, sans-serif','system-ui, sans-serif'].includes(t.font)?t.font:"'Playfair Display', Georgia, serif";
 const size=Math.max(16,Math.min(24,Number(t.size)||16));const radius=Math.max(0,Math.min(40,Number(t.radius)||8));
 return `:root{--green:${color(t.primary,'#4b226b')};--gold:${color(t.gold,'#c49a41')};--paper:${color(t.paper,'#fbf8f1')};--ink:${color(t.ink,'#30213f')};--muted:${color(t.muted,'#73677c')};--serif:${font}}body{font-size:${size}px}footer{background:${color(t.footer,'#301143')}}${t.radius!==undefined?'.card,.panel,.btn,.cta,.hero{border-radius:'+radius+'px}':''}.about-welcome,.visit-welcome,.ministries-welcome{${t.heroTint?'background-color:'+color(t.primary,'#4b226b')+';background-blend-mode:multiply;':''}}`;
}
export function applyDesign(doc,design,path){
 const page=design.pages?.[path];if(!page)return;
 let style=doc.getElementById('studio-theme');if(!style){style=doc.createElement('style');style.id='studio-theme';doc.head.append(style);}setText(style,themeCSS(design.theme));
 for(const [key,edit]of Object.entries(page.edits||{})){
  const n=Array.from(doc.querySelectorAll('[data-site-id]')).find(n=>n.dataset.siteId===key);if(!n)continue;
  if(edit.text!==undefined && !n.querySelector('[data-site-id]'))setText(n,edit.text);
  for(const [k,v]of Object.entries(edit.style||{})){const value=validStyle(k,v);if(value && n.style[k]!==value)n.style[k]=value;}
  for(const [k,v]of Object.entries(edit.attrs||{})){
   if(['href','src'].includes(k)){const u=safeLink(v,{image:k==='src'});if(u)setAttr(n,k,u);}
   if(['alt','title','aria-label'].includes(k))setAttr(n,k,String(v));
  }
  if(edit.hidden)n.style.setProperty('display','none','important');
 }
 const main=doc.querySelector('main');if(!main)return;
 for(const block of page.blocks||[]){if(!doc.querySelector(`[data-studio-block="${block.id}"]`))main.append(renderBlock(block,doc,design.content.settings));}
 // Order only top-level page sections. Existing child structures and script hooks stay intact.
 const area=main.querySelector(':scope > .container')||main;
 const ids=page.order||[];const nodes=ids.map(key=>Array.from(doc.querySelectorAll('[data-site-id]')).find(n=>n.dataset.siteId===key)).filter(Boolean);
 for(let i=0;i<nodes.length;i++){const n=nodes[i];if(n.parentElement!==area && !n.dataset.studioBlock)continue;const next=nodes[i+1];if(next && next.parentElement===area){if(n.nextElementSibling!==next)area.insertBefore(n,next);}else if(n.parentElement!==area||n!==area.lastElementChild)area.append(n);}
 if(page.seo?.title)doc.title=page.seo.title;
 if(page.seo?.description){let m=doc.querySelector('meta[name=description]');if(!m){m=doc.createElement('meta');m.name='description';doc.head.append(m);}setAttr(m,'content',page.seo.description);}
 if(Array.isArray(design.navigation)){
  const nav=doc.getElementById('navigation');if(nav && nav.dataset.studioNav!==JSON.stringify(design.navigation)){
   nav.replaceChildren(...design.navigation.filter(a=>safeLink(a.url)).map(item=>{const a=doc.createElement('a');a.textContent=item.label;a.href=safeLink(item.url);if(item.button)a.className='btn';if(item.url===path)a.setAttribute('aria-current','page');return a;}));nav.dataset.studioNav=JSON.stringify(design.navigation);
  }
 }
}
// Convert a New York wall-clock input without depending on the editor's device timezone.
export function easternISO(local){
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local))throw Error('Choose a valid date and time.');
 const target=Date.parse(local+':00Z');
 const format=d=>{const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(d);const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;};
 for(const hours of [4,5]){const d=new Date(target+hours*3600000);if(format(d)===local)return local+':00-0'+hours+':00';}
 throw Error('That time does not exist in New York because the clocks change. Choose another time.');
}
export function easternLocal(value){if(!value||!Number.isFinite(Date.parse(value)))return '';const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(value));const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;}
export function compilePage(raw,design,path,Parser=DOMParser){
 const doc=new Parser().parseFromString(raw,'text/html');
 doc.querySelectorAll('[data-setting]').forEach(n=>n.textContent=design.content.settings[n.dataset.setting]||'');
 doc.querySelectorAll('[data-directions]').forEach(n=>n.href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(design.content.settings.address||''));
 const cards=doc.getElementById('ministries');if(cards){cards.replaceChildren();for(const item of design.content.ministries||[]){const a=doc.createElement('article');a.className='card';for(const [tag,text,cls]of [['h3',item.title,''],['p',item.text,''],['div',item.detail,'detail']]){const n=doc.createElement(tag);n.textContent=text||'';n.className=cls;a.append(n);}cards.append(a);}}
 applyDesign(doc,design,path);
 return '<!doctype html>\n'+doc.documentElement.outerHTML;
}
