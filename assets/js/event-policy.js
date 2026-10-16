// Apply the same policy to bundled, remote, cached and pastor-created events.
export function normalizePolicyText(value){return String(value||'').normalize('NFKC').toLowerCase().replace(/[\u200B-\u200D\uFEFF]/g,'').replace(/[_/]+/g,' ');}
export function eventAllowed(event,policy){
 if(!policy||!event||!event.title)return false;
 const text=normalizePolicyText([event.title,event.description,event.text,event.location,event.categories,event.url].join(' '));
 try{
  if(policy.blockedPatterns.some(p=>new RegExp(p,'iu').test(text)))return false;
  if(event.category==='church')return event.churchId===policy.churchId;
  if(event.free!==true||!policy.communitySources.includes(event.source))return false;
  if(policy.approvedCommunityIds.includes(event.id))return true;
  if(policy.reviewPatterns.some(p=>new RegExp(p,'iu').test(text)))return false;
  const title=normalizePolicyText(event.title);
  return policy.routineTitlePatterns.some(p=>new RegExp(p,'iu').test(title));
 }catch{return false;}
}
