import {createClient} from 'npm:@supabase/supabase-js@2.49.8';
import {normalizeVideo,sortVideos} from './model.mjs';
const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'apikey, authorization, content-type, x-client-info','Access-Control-Allow-Methods':'GET, OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
const CHANNEL='UCZ8zYO9to_8PzUWwQj6xRBg';
const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='GET')return reply({error:'Method not allowed'},405);
 const key=Deno.env.get('YOUTUBE_API_KEY');
 if(!key)return reply({error:'The church has not connected automatic YouTube updates yet.'},503);
 const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
 let cache:any;let acquired=false;
 try{
  const read=await db.from('church_youtube_cache').select('*').eq('id',1).single();
  if(read.error)throw Error('Cache unavailable');cache=read.data;
  const claim=await db.rpc('claim_youtube_refresh');if(claim.error)throw claim.error;
  if(!claim.data)return cache.data?reply(cache.data):reply({error:'Preparing the church broadcast library. Retry shortly.'},503);
  acquired=true;
  async function api(resource:string,params:Record<string,string>){
   const u=new URL('https://www.googleapis.com/youtube/v3/'+resource);Object.entries({...params,key:key!}).forEach(([k,v])=>u.searchParams.set(k,v));
   const res=await fetch(u,{signal:AbortSignal.timeout(25000)});if(!res.ok)throw Error('YouTube request unavailable');return await res.json();
  }
  const channel=await api('channels',{part:'snippet,contentDetails',id:CHANNEL});
  const uploads=channel.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if(!uploads)throw Error('Channel uploads unavailable');
  const reindex=!cache.data?.archiveScannedAt||Date.now()-Date.parse(cache.data.archiveScannedAt)>86400000;
  let old=cache.data?.videos||[];const previousActive=old.filter((v:any)=>v.status==='live'||v.status==='upcoming');const seenIds=new Set<string>();let token='';let scanned=0;
  // First request indexes every public upload (up to 10,000); subsequent requests
  // scan the newest 50, refreshing known active/upcoming videos as well.
  do{
   const page=await api('playlistItems',{part:'contentDetails',playlistId:uploads,maxResults:'50',...(token?{pageToken:token}:{})});
   for(const item of page.items||[])if(item.contentDetails?.videoId)seenIds.add(item.contentDetails.videoId);
   token=page.nextPageToken||'';scanned++;
  }while(reindex&&token&&scanned<200);
  let archiveComplete=reindex?!token:cache.data?.archiveComplete;
  const archiveScannedAt=reindex?new Date().toISOString():cache.data?.archiveScannedAt;
  if(reindex)old=[];
  // Discover upcoming broadcasts not yet listed in uploads. Two searches every
  // 30 minutes, shared across ALL visitors (96 calls/day before pagination).
  let discoveryAt=cache.discovery_at;let discoveryWarning=false;
  if(!discoveryAt||Date.now()-Date.parse(discoveryAt)>30*60*1000){
   try{
    for(const eventType of ['live','upcoming']){
     const events=await api('search',{part:'snippet',channelId:CHANNEL,type:'video',eventType,maxResults:'50'});
     for(const item of events.items||[])if(item.id?.videoId)seenIds.add(item.id.videoId);
     // More than 50 future broadcasts remains accessible on the channel itself.
     if(events.nextPageToken)discoveryWarning=true;
    }
   }catch{discoveryWarning=true;}
   discoveryAt=new Date().toISOString();
  }
  for(const v of previousActive)seenIds.add(v.id);
  const requested=[...seenIds];const incoming:any[]=[];
  for(let i=0;i<requested.length;i+=50){
   const result=await api('videos',{part:'snippet,liveStreamingDetails,status',id:requested.slice(i,i+50).join(',')});
   for(const v of result.items||[]){if(v.snippet?.channelId===CHANNEL){const n=normalizeVideo(v);if(n.status!=='upload')incoming.push(n);}}
  }
  // Remove videos now private/deleted or no longer classified as broadcasts.
  const incomingIds=new Set(incoming.map(v=>v.id));
  old=old.filter((v:any)=>!seenIds.has(v.id)||incomingIds.has(v.id));
  const data={channelId:CHANNEL,channelName:channel.items[0].snippet.title,channelUrl:'https://www.youtube.com/@GreaterStPaulHDIWC',source:'youtube-data-api',fetchedAt:new Date().toISOString(),archiveComplete,archiveScannedAt,discoveryWarning,videos:sortVideos([...old,...incoming])};
  const saved=await db.from('church_youtube_cache').update({data,refreshed_at:data.fetchedAt,discovery_at:discoveryAt,lease_until:new Date(0).toISOString()}).eq('id',1);if(saved.error)throw saved.error;
  return reply(data);
 }catch{
  if(acquired)await db.from('church_youtube_cache').update({lease_until:new Date(Date.now()+60000).toISOString()}).eq('id',1);
  return cache?.data?reply({...cache.data,warning:'Updates are temporarily unavailable. Showing the last successful check.'}):reply({error:'YouTube updates are temporarily unavailable.'},503);
 }
});
