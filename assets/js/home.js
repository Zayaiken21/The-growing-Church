import {init,$,el,safeUrl,cards} from './core.js';
import {mountYouTube} from './youtube.js';
import {currentEvents,eventDay,eventTime} from './community-model.js';
const c=await init();cards(c.ministries,'#ministries','ministries.html');const announcements=currentEvents(c.events||[]);const slides=c.settings.slideshowMode==='custom'&&c.slides?.length?c.slides:announcements.length?announcements.map(e=>({eyebrow:'GREATER ST. PAUL · CHURCH EVENTS',title:e.title,text:eventDay(e)+' · '+eventTime(e)+(e.end?'–'+new Date(e.end).toLocaleTimeString('en-US',{timeZone:'America/New_York',hour:'numeric',minute:'2-digit'}):'')+' · '+e.location,button:'Event details & calendar',link:'events.html#'+e.id,image:e.image,alt:'Church event flyer: '+e.title,source:e.image,caption:'Open the full event flyer ↗',event:true})): [{eyebrow:'GREATER ST. PAUL · BROOKLYN',title:'Gather with us.',text:'Explore our church announcements and join us for worship at 44 Rockaway Avenue, Brooklyn, NY.',button:'Church events',link:'events.html',image:'assets/photos/church-sanctuary.jpg',alt:'Greater St. Paul sanctuary',source:'events.html',caption:'Explore church announcements ↗'}];let index=0,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,timer;
function render(){const s=slides[index],frame=el('div',undefined,'slide fade'+(s.event?' event-slide':'')),copy=el('div',undefined,'slide-copy');copy.append(el('p',s.eyebrow,'eyebrow'),el('h1',s.title),el('p',s.text));const url=safeUrl(s.link);if(url){const a=el('a',s.button+' ↗','btn light');a.href=url;copy.append(a);}const art=el('figure',undefined,'church-photo');const img=el('img');img.src=safeUrl(s.image)||'assets/sanctuary.svg';img.alt=s.alt||'Greater St. Paul';img.width=480;img.height=360;img.decoding='async';img.onerror=()=>{img.onerror=null;img.src='assets/sanctuary.svg';};const caption=el('figcaption');const source=el('a',s.caption||'From our church’s service broadcast ↗');source.href=safeUrl(s.source)||'sermons.html';source.target='_blank';source.rel='noopener noreferrer';caption.append(source);art.append(img,caption);frame.append(copy,art);$('#slide').replaceChildren(frame);$('#slide').setAttribute('aria-live',paused?'polite':'off');document.querySelectorAll('.dot').forEach((d,i)=>{d.classList.toggle('active',i===index);d.setAttribute('aria-current',i===index?'true':'false');});}
function schedule(){clearInterval(timer);if(slides.length>1&&!paused&&!document.hidden)timer=setInterval(()=>{index=(index+1)%slides.length;render();},Math.max(5,Math.min(30,Number(c.settings.slideSeconds)||7))*1000);}
function move(n){index=(index+n+slides.length)%slides.length;render();schedule();}
slides.forEach((s,i)=>{const dot=el('button',undefined,'dot');dot.setAttribute('aria-label',`Go to slide ${i+1}`);dot.onclick=()=>{index=i;render();schedule();};$('#dots').append(dot);});
$('#previous').onclick=()=>move(-1);$('#next').onclick=()=>move(1);
function syncPause(){$('#pause').textContent=paused?'▶':'Ⅱ';$('#pause').setAttribute('aria-label',paused?'Play automatic slides':'Pause automatic slides');}
$('#pause').onclick=()=>{paused=!paused;syncPause();schedule();};$('.hero').addEventListener('focusin',()=>{paused=true;syncPause();schedule();});document.addEventListener('visibilitychange',schedule);syncPause();render();schedule();



window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});

$('.slider-controls').hidden=slides.length<2;
await mountYouTube('#home-broadcasts',{compact:true});

