"""Refresh the church's public broadcast listing without visitor credentials."""
import datetime as dt
import json,re,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
CHANNEL='UCZ8zYO9to_8PzUWwQj6xRBg'
URL='https://www.youtube.com/@GreaterStPaulHDIWC/streams'
def walk(value):
 if isinstance(value,dict):
  yield value
  for child in value.values():yield from walk(child)
 elif isinstance(value,list):
  for child in value:yield from walk(child)
def parse(page):
 marker='var ytInitialData = '
 if marker not in page or CHANNEL not in page:raise ValueError('Unexpected channel response')
 data,_=json.JSONDecoder().raw_decode(page.split(marker,1)[1])
 found={}
 for node in walk(data):
  v=node.get('lockupViewModel')
  if not v:continue
  vid=v.get('contentId','')
  if not re.fullmatch(r'[A-Za-z0-9_-]{11}',vid):continue
  meta=v.get('metadata',{}).get('lockupMetadataViewModel',{})
  title=meta.get('title',{}).get('content','')
  if not title:continue
  badges=[n.get('thumbnailBadgeViewModel',{}) for n in walk(v.get('contentImage',{}))]
  styles=' '.join(str(b.get('badgeStyle',''))+' '+str(b.get('text','')) for b in badges)
  detail=' '.join(n['content'] for n in walk(meta.get('metadata',{})) if isinstance(n.get('content'),str))
  state='live' if re.search(r'BADGE_STYLE_LIVE|^LIVE$',styles) else 'upcoming' if re.search(r'UPCOMING|PREMIERE|Scheduled',styles+' '+detail,re.I) else 'completed' if re.search(r'Streamed',detail,re.I) else 'unknown'
  found[vid]={'id':vid,'title':title,'status':state,'publishedAt':None,'scheduledStart':None,'actualStart':None,'actualEnd':None,'embeddable':True,'listingDetail':detail}
 if not found:raise ValueError('No public broadcasts found; retaining previous feed')
 return list(found.values())
def main():
 request=urllib.request.Request(URL,headers={'User-Agent':'Mozilla/5.0','Accept-Language':'en-US,en;q=0.9'})
 page=urllib.request.urlopen(request,timeout=30).read().decode()
 rows=parse(page);path=ROOT/'assets/youtube-feed.json'
 old=json.loads(path.read_text())
 ids={v['id'] for v in rows}
 for v in old.get('videos',[]):
  if v['id'] not in ids:
   if v.get('status') in ['live','upcoming']:v={**v,'status':'unknown'}
   rows.append(v)
 old.update(videos=rows,fetchedAt=dt.datetime.now(dt.timezone.utc).isoformat(),source='public-channel-refresh',archiveComplete=False)
 path.write_text(json.dumps(old,indent=2)+'\n')
 print('Refreshed',len(rows),'church broadcasts')
if __name__=='__main__':main()
