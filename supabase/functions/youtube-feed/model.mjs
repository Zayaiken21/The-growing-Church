export const VIDEO_ID=/^[A-Za-z0-9_-]{11}$/;
export function videoState(v){
 const live=v.liveStreamingDetails||{};
 if(live.actualEndTime)return 'completed';
 if(live.actualStartTime)return 'live';
 if(v.snippet?.liveBroadcastContent==='live')return 'live';
 if(v.snippet?.liveBroadcastContent==='upcoming'||live.scheduledStartTime)return 'upcoming';
 return 'upload';
}
export function normalizeVideo(v){return {id:v.id,title:v.snippet?.title||'Church service',status:videoState(v),publishedAt:v.snippet?.publishedAt||null,scheduledStart:v.liveStreamingDetails?.scheduledStartTime||null,actualStart:v.liveStreamingDetails?.actualStartTime||null,actualEnd:v.liveStreamingDetails?.actualEndTime||null,embeddable:v.status?.embeddable!==false};}
export function sortVideos(videos){const rank={live:0,upcoming:1,completed:2,unknown:3};return [...new Map(videos.filter(v=>VIDEO_ID.test(v.id)).map(v=>[v.id,v])).values()].sort((a,b)=>{const r=(rank[a.status]??4)-(rank[b.status]??4);if(r)return r;const da=Date.parse(a.scheduledStart||a.actualStart||a.publishedAt||'')||0,db=Date.parse(b.scheduledStart||b.actualStart||b.publishedAt||'')||0;return a.status==='upcoming'?da-db:db-da;});}
export function isFresh(feed,now=Date.now()){return feed.source==='youtube-data-api'&&Number.isFinite(Date.parse(feed.fetchedAt))&&now-Date.parse(feed.fetchedAt)<300000;}
export function badge(v,fresh){if(!fresh&&v.status==='live')return 'Previously live · status unverified';if(!fresh&&v.status==='upcoming')return 'Scheduled · check YouTube';return {live:'Live now',upcoming:'Upcoming',completed:'Watch replay',unknown:'Church broadcast'}[v.status]||'Watch video';}
