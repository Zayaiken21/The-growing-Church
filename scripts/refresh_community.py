"""Refresh public organizer calendars and NYC's official free-food directory.
No credentials. Text is normalized, never executed. Each source fails independently.
"""
import concurrent.futures,datetime as dt,hashlib,html,json,re,time,urllib.parse,urllib.request,xml.etree.ElementTree as ET
from pathlib import Path
from zoneinfo import ZoneInfo
ROOT=Path(__file__).resolve().parents[1]
NY=ZoneInfo('America/New_York');NOW=dt.datetime.now(dt.timezone.utc)
BORO={'BX':'Bronx','BK':'Brooklyn','MN':'Manhattan','NY':'Manhattan','QN':'Queens','SI':'Staten Island','M':'Manhattan','B':'Brooklyn','X':'Bronx','Q':'Queens','R':'Staten Island'}
PARKS='https://www.nycgovparks.org/xml/events_300_rss.xml'
RIVERSIDE='https://www.trcnyc.org/events/?ical=1&tribe_display=list'
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
   values={**{k:row.get(k,'') for k in ['title','guid','description','parkids','location','categories']},'startdate':start.strftime('%Y-%m-%d'),'enddate':end.strftime('%Y-%m-%d'),'starttime':start.strftime('%I:%M %p'),'endtime':end.strftime('%I:%M %p'),'link':row.get('link',{}).get('url','')}
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
  events.append({'id':'parks-'+v['guid'],'title':text(v.get('title')),'start':iso(start),'end':iso(end) if end else None,'allDay':False,'category':'community','mode':'online' if online else 'in-person','borough':'Online' if online else borough,'location':text(v.get('location')),'description':description[:1000],'free':True,'costNote':'Organizer description states this program is free. Registration may be required.','url':v.get('link','').replace('http:','https:'),'organizer':'NYC Parks / listed organizer','source':'NYC Parks','sourceUrl':source_url,'verifiedAt':iso(NOW)})
 if not events:raise ValueError('No upcoming, explicitly free Parks events found')
 return events

def ical_value(s):return s.replace('\\n','\n').replace('\\N','\n').replace('\\,',',').replace('\\;',';').replace('\\\\','\\')
def ical_date(raw,key):
 if re.fullmatch(r'\d{8}',raw):return dt.datetime.strptime(raw,'%Y%m%d').replace(tzinfo=NY),True
 zone=dt.timezone.utc if raw.endswith('Z') else ZoneInfo(re.search(r'TZID=([^;:]+)',key).group(1)) if 'TZID=' in key else NY
 return dt.datetime.strptime(raw.rstrip('Z'),'%Y%m%dT%H%M%S').replace(tzinfo=zone),False

def church_events():
 s=get(RIVERSIDE).decode('utf-8-sig');s=re.sub(r'\r?\n[ \t]','',s);events=[]
 for block in s.split('BEGIN:VEVENT')[1:]:
  fields={};keys={}
  for line in block.split('END:VEVENT')[0].splitlines():
   if ':' not in line:continue
   k,v=line.split(':',1);name=k.split(';')[0];fields[name]=v;keys[name]=k
  if 'DTSTART' not in fields or 'RRULE' in fields:continue # Never invent recurring occurrences.
  try:start,all_day=ical_date(fields['DTSTART'],keys['DTSTART']);end=ical_date(fields['DTEND'],keys.get('DTEND',''))[0] if 'DTEND' in fields else None
  except (ValueError,KeyError):continue
  if (end or start).astimezone(dt.timezone.utc)<NOW or start>NOW+dt.timedelta(days=90):continue
  title=text(ical_value(fields.get('SUMMARY','Church event')));description=text(ical_value(fields.get('DESCRIPTION','')));location=text(ical_value(fields.get('LOCATION','')));categories=fields.get('CATEGORIES','').lower()
  online='*online' in categories or 'zoom' in location.lower() or location.lower()=='online';onsite='*onsite' in categories or (location and location.lower() not in ['online','n/a'] and 'zoom' not in location.lower())
  mode='hybrid' if online and onsite else 'online' if online else 'in-person' if onsite else 'not-listed'
  events.append({'id':'riverside-'+hashlib.sha256(fields.get('UID',fields.get('URL',title+iso(start))).encode()).hexdigest()[:16],'title':title,'start':iso(start),'end':iso(end) if end else None,'allDay':all_day,'category':'church','mode':mode,'borough':'Online' if mode=='online' else 'Manhattan' if onsite else 'Not listed','location':location or 'See organizer for location','description':description[:1000],'free':True if free(description) else None,'costNote':'Free, according to the organizer.' if free(description) else 'Admission cost not listed in the calendar. Check with the organizer.','url':fields.get('URL','https://www.trcnyc.org/events/'),'organizer':'The Riverside Church','source':'The Riverside Church','sourceUrl':RIVERSIDE,'verifiedAt':iso(NOW)})
 if not events:raise ValueError('No upcoming church events found')
 return events

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

def run():
 out=ROOT/'assets/community-feed.json'
 old=json.loads(out.read_text()) if out.exists() else {'events':[],'pantries':[],'sources':[]}
 statuses=[];all_events=[];food=old.get('pantries',[])
 tasks={'NYC Parks':parks_events,'The Riverside Church':church_events,'NYC Food Help':pantries}
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as ex:
  futures={ex.submit(fn):name for name,fn in tasks.items()}
  for future in concurrent.futures.as_completed(futures):
   name=futures[future]
   try:
    rows=future.result()
    if name=='NYC Food Help':food=rows
    else:all_events.extend(rows)
    statuses.append({'name':name,'ok':True,'checkedAt':iso(NOW),'updatedAt':iso(NOW),'count':len(rows)});print(name,len(rows),'records')
   except Exception as e:
    previous=next((s for s in old.get('sources',[]) if s['name']==name),{})
    statuses.append({'name':name,'ok':False,'checkedAt':iso(NOW),'updatedAt':previous.get('updatedAt'),'count':previous.get('count',0),'message':'Source unavailable; retaining previous listings.'})
    if name!='NYC Food Help':all_events.extend(e for e in old.get('events',[]) if e.get('source')==name)
    print(name,'unavailable:',type(e).__name__,str(e)[:120])
 events={e['id']:e for e in all_events if dt.datetime.fromisoformat(e['end'] or e['start'])>=NOW}
 if not food or not events:raise RuntimeError('Refusing to publish an empty initial directory')
 data={'checkedAt':iso(NOW),'timezone':'America/New_York','refreshHours':6,'sources':statuses,'events':sorted(events.values(),key=lambda x:x['start']),'pantries':food}
 tmp=out.with_suffix('.tmp');tmp.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')));tmp.replace(out)
 print('Published feed:',len(events),'events;',len(food),'food programs')
if __name__=='__main__':run()
