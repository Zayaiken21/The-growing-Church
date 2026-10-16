"""Refresh public organizer calendars and NYC's official free-food directory.
No credentials. Text is normalized, never executed. Each source fails independently.
"""
import concurrent.futures,datetime as dt,hashlib,html,json,re,time,urllib.parse,urllib.request,xml.etree.ElementTree as ET
from pathlib import Path
from zoneinfo import ZoneInfo
import unicodedata
ROOT=Path(__file__).resolve().parents[1]
NY=ZoneInfo('America/New_York');NOW=dt.datetime.now(dt.timezone.utc)
BORO={'BX':'Bronx','BK':'Brooklyn','MN':'Manhattan','NY':'Manhattan','QN':'Queens','SI':'Staten Island','M':'Manhattan','B':'Brooklyn','X':'Bronx','Q':'Queens','R':'Staten Island'}
PARKS='https://www.nycgovparks.org/xml/events_300_rss.xml'
FOOD='https://finder.nyc.gov/foodhelp/'
def text(x):return re.sub(r'\s+',' ',html.unescape(html.unescape(re.sub('<[^>]*>',' ',str(x or ''))))).strip()
def get(url):
 req=urllib.request.Request(url,headers={'User-Agent':'GreaterStPaulCommunityCalendar/1.0 (+https://zayaiken21.github.io/The-growing-Church/)','Accept':'application/json,text/calendar,application/xml,text/xml,*/*'})
 last=None
 for attempt in range(3):
  try:
   with urllib.request.urlopen(req,timeout=35) as r:return r.read()
  except Exception as e:last=e;time.sleep(attempt+1)
 raise last
def jsonget(url):
 d=json.loads(get(url))
 if isinstance(d,dict) and 'error' in d:raise ValueError('Source reported an error')
 return d
def iso(d):return d.astimezone(dt.timezone.utc).isoformat()
def free(textvalue):
 s=text(textvalue).lower()
 return bool(re.search(r'\b(?:free (?:and open|admission|event|class|program|workshop|concert|guided|weekly|5k)|free,? (?:year-round|[0-9]+k)|at no cost|no admission (?:fee|charge)|admission is free)\b',s))
def parks_events():
 source_url='https://data.cityofnewyork.us/City-Government/NYC-Parks-Public-Events-Upcoming-14-Days/w3wp-dpdi'
 try:
  rows=[];offset=0
  while True:
   batch=jsonget('https://data.cityofnewyork.us/resource/w3wp-dpdi.json?'+urllib.parse.urlencode({'$limit':1000,'$offset':offset}))
   rows.extend(batch)
   if len(batch)<1000:break
   offset+=len(batch)
   if offset>20000:raise ValueError('Event pagination incomplete')
  root=ET.Element('rss')
  for row in rows:
   if not row.get('starttime'):continue
   start=dt.datetime.fromisoformat(row['starttime']);end=dt.datetime.fromisoformat(row['endtime']) if row.get('endtime') else start
   values={**{k:row.get(k,'') for k in ['title','guid','description','parkids','location','categories']},'startdate':start.strftime('%Y-%m-%d'),'enddate':end.strftime('%Y-%m-%d'),'starttime':start.strftime('%I:%M %p'),'endtime':end.strftime('%I:%M %p'),'link':row.get('link',{}).get('url',''),'registration_url':row.get('registration_url',{}).get('url','')}
   item=ET.SubElement(root,'item')
   for k,v in values.items():ET.SubElement(item,k).text=str(v or '')
  if not root.findall('.//item'):raise ValueError('No event records')
 except Exception:
  root=ET.fromstring(get(PARKS));source_url=PARKS
 events=[]
 for item in root.findall('.//item'):
  v={c.tag.split('}')[-1]:(c.text or '') for c in item};description=text(v.get('description'))
  if not free(description):continue
  date=v.get('startdate','');t=v.get('starttime','').replace('0:','12:',1)
  try:start=dt.datetime.strptime(date+' '+t,'%Y-%m-%d %I:%M %p').replace(tzinfo=NY)
  except ValueError:continue
  try:end=dt.datetime.strptime(v.get('enddate',date)+' '+v.get('endtime','').replace('0:','12:',1),'%Y-%m-%d %I:%M %p').replace(tzinfo=NY)
  except ValueError:end=None
  if (end or start).astimezone(dt.timezone.utc)<NOW or start>NOW+dt.timedelta(days=90):continue
  online='virtual' in (v.get('categories','')+' '+v.get('location','')).lower() or 'online' in v.get('location','').lower()
  borough=BORO.get(v.get('parkids','')[:1],'Citywide')
  events.append({'id':'parks-'+v['guid'],'title':text(v.get('title')),'start':iso(start),'end':iso(end) if end else None,'allDay':False,'category':'community','mode':'online' if online else 'in-person','borough':'Online' if online else borough,'location':text(v.get('location')),'description':description,'categories':v.get('categories',''),'free':True,'costNote':'Organizer description states this program is free. Registration may be required.','url':v.get('link','').replace('http:','https:'),'registrationUrl':v.get('registration_url',''),'organizer':'NYC Parks / listed organizer','source':'NYC Parks','sourceUrl':source_url,'verifiedAt':iso(NOW)})
 if not events:raise ValueError('No upcoming, explicitly free Parks events found')
 return events

def ical_value(s):return s.replace('\\n','\n').replace('\\N','\n').replace('\\,',',').replace('\\;',';').replace('\\\\','\\')
def ical_date(raw,key):
 if re.fullmatch(r'\d{8}',raw):return dt.datetime.strptime(raw,'%Y%m%d').replace(tzinfo=NY),True
 zone=dt.timezone.utc if raw.endswith('Z') else ZoneInfo(re.search(r'TZID=([^;:]+)',key).group(1)) if 'TZID=' in key else NY
 return dt.datetime.strptime(raw.rstrip('Z'),'%Y%m%dT%H%M%S').replace(tzinfo=zone),False


def pantries():
 config=jsonget('https://finder.nyc.gov/foodhelp/config/runtime-config.json');layers=config['appEnvironments']['finder.nyc.gov'];records={};counts=[]
 for layer in layers:
  offset=0;total=0
  while True:
   params={'where':'1=1','outFields':'*','returnGeometry':'false','f':'json','orderByFields':'FID ASC','resultRecordCount':1000,'resultOffset':offset}
   data=jsonget(layer['loc_layer_url']+'/query?'+urllib.parse.urlencode(params));features=data.get('features',[]);total+=len(features)
   for item in features:
    a=item['attributes'];fp=a.get('type_fp');sk=a.get('type_sk');status=(a.get('status') or '').lower()
    if not (fp or sk) or status in ['closed','inactive']:continue
    name=text(a.get('program'));address=text(a.get('distadd'));key=(name.lower(),address.lower());days=[]
    for i,day in enumerate(['mon','tue','wed','thu','fri','sat','sun']):
     windows=[]
     for n in range(1,4):
      start=a.get(f'fp_{day}_open{n}');end=a.get(f'fp_{day}_close{n}')
      if start and end:windows.append({'start':start,'end':end})
     days.append({'day':i,'status':text(a.get('fp_'+day)),'windows':windows})
    p={'id':'food-'+hashlib.sha256(('|'.join(key)).encode()).hexdigest()[:16],'name':name,'address':address,'borough':BORO.get(a.get('distboro'),'Not listed'),'zip':str(a.get('distzip') or ''),'phone':text(a.get('org_phone')),'pantryType':fp or '', 'mealType':sk or '', 'days':days,'schedule':text(' · '.join(str(x) for x in [a.get('fp_days_orig'),a.get('fp_hours_orig')] if x)),'mealSchedule':text(' · '.join(str(x) for x in [a.get('sk_days_orig'),a.get('sk_hours_orig')] if x)),'notes':text(' · '.join(str(x) for x in [a.get('dist_location_info'),a.get('fp_notes'),a.get('sk_notes')] if x)),'source':'NYC Food Help','sourceUrl':FOOD,'verifiedAt':iso(NOW),'providerUpdatedAt':dt.datetime.fromtimestamp(a['EditDate']/1000,dt.timezone.utc).isoformat() if a.get('EditDate') else None}
    if key not in records:records[key]=p
   if not data.get('exceededTransferLimit'):break
   if not features or offset>20000:raise ValueError('Pantry pagination incomplete')
   offset+=len(features)
  counts.append(total)
 rows=list(records.values())
 if len(rows)<100:raise ValueError('Unexpectedly small food directory')
 # Pantry view excludes meal-only locations by default, but keeps them available.
 if not all(any(r['borough']==b and r['pantryType'] for r in rows) for b in ['Bronx','Brooklyn','Manhattan','Queens','Staten Island']):raise ValueError('Missing a borough')
 return sorted(rows,key=lambda r:(r['borough'],r['name']))

def load_policy():return json.loads((ROOT/'assets/event-policy.json').read_text())
def policy_text(value):return unicodedata.normalize('NFKC',str(value or '')).lower().translate({0x200b:None,0x200c:None,0x200d:None,0xfeff:None}).replace('_',' ').replace('/',' ')
def event_allowed(event,policy):
 value=policy_text(' '.join(str(event.get(k) or '') for k in ['title','description','text','location','categories','url']))
 if any(re.search(p,value,re.I) for p in policy['blockedPatterns']):return False
 if event.get('category')=='church':return event.get('churchId')==policy['churchId']
 if event.get('free') is not True or event.get('source') not in policy['communitySources']:return False
 if event.get('id') in policy['approvedCommunityIds']:return True
 if any(re.search(p,value,re.I) for p in policy['reviewPatterns']):return False
 return any(re.search(p,policy_text(event.get('title')),re.I) for p in policy['routineTitlePatterns'])
def save_feeds(data):
 # Omit closed-day scaffolding and redundant fetch stamps, not service details.
 data['pantries']=[{k:([d for d in v if d.get('windows') or d.get('status','').lower() not in ['', 'closed']] if k=='days' else v) for k,v in row.items() if k!='verifiedAt'} for row in data['pantries']]
 files={'community-feed.json':data,'events-feed.json':{k:v for k,v in data.items() if k!='pantries'},'pantries-feed.json':{'checkedAt':data['checkedAt'],'pantries':data['pantries'],'sources':[s for s in data['sources'] if s['name']=='NYC Food Help']}}
 for name,payload in files.items():
  out=ROOT/'assets'/name;temp=out.with_suffix('.tmp');temp.write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':')));temp.replace(out)
def run():
 out=ROOT/'assets/community-feed.json';policy=load_policy()
 old=json.loads(out.read_text()) if out.exists() else {'events':[],'pantries':[],'sources':[]}
 statuses=[];all_events=[];food=old.get('pantries',[])
 tasks={'NYC Parks':parks_events,'NYC Food Help':pantries}
 with concurrent.futures.ThreadPoolExecutor(max_workers=2) as ex:
  futures={ex.submit(fn):name for name,fn in tasks.items()}
  for future in concurrent.futures.as_completed(futures):
   name=futures[future]
   try:
    rows=future.result()
    if name=='NYC Food Help':food=rows
    else:
     rows=[e for e in rows if event_allowed(e,policy)];all_events.extend(rows)
    statuses.append({'name':name,'ok':True,'checkedAt':iso(NOW),'updatedAt':iso(NOW),'count':len(rows)});print(name,len(rows),'published listings')
   except Exception as e:
    previous=next((s for s in old.get('sources',[]) if s['name']==name),{})
    retained=[e for e in old.get('events',[]) if e.get('source')==name and event_allowed(e,policy)]
    statuses.append({'name':name,'ok':False,'checkedAt':iso(NOW),'updatedAt':previous.get('updatedAt'),'count':len(food) if name=='NYC Food Help' else len(retained),'message':'Source unavailable; retaining policy-screened previous listings.'})
    all_events.extend(retained);print(name,'unavailable:',type(e).__name__)
 # Re-screen retained records too: an outage must never restore withdrawn content.
 events={e['id']:e for e in all_events if event_allowed(e,policy) and dt.datetime.fromisoformat(e['end'] or e['start'])>=NOW}
 if not food:raise RuntimeError('Refusing to replace a valid food directory with an empty one')
 data={'checkedAt':iso(NOW),'timezone':'America/New_York','policyVersion':policy['version'],'pantryCount':sum(bool(p['pantryType']) for p in food),'refreshHours':6,'sources':statuses,'events':sorted(events.values(),key=lambda x:x['start']),'pantries':food}
 save_feeds(data);print('Published:',len(events),'screened free community events;',data['pantryCount'],'pantries')
if __name__=='__main__':run()
