import unittest
from refresh_community import text,free,ical_date
class CommunityParsingTests(unittest.TestCase):
 def test_free_admission_requires_explicit_statement(self):
  self.assertTrue(free('Join our free, year-round fitness program.'))
  self.assertTrue(free('Free admission to this event.'))
  self.assertFalse(free('Parking is free. Tickets cost $20.'))
  self.assertFalse(free('Costs not listed.'))
 def test_ical_timezone(self):
  value,all_day=ical_date('20261206T100000','DTSTART;TZID=America/New_York')
  self.assertEqual(value.utcoffset().total_seconds(),-18000)
  self.assertFalse(all_day)
 def test_plain_text(self):
  self.assertEqual(text('<p>Family &amp; neighbors</p>'),'Family & neighbors')

class EditorialPolicyTests(unittest.TestCase):
 def test_withdrawn_events_cannot_be_retained(self):
  from refresh_community import event_allowed,load_policy
  p=load_policy();base={'category':'community','source':'NYC Parks','title':'Forest Fitness','free':True}
  self.assertTrue(event_allowed(base,p))
  for title in ['Halloween Hike','Movie Under the Stars','Tarot Workshop']:
   self.assertFalse(event_allowed({**base,'title':title},p))
 def test_other_church_rejected(self):
  from refresh_community import event_allowed,load_policy
  self.assertFalse(event_allowed({'category':'church','churchId':'other','title':'Worship'},load_policy()))

if __name__=='__main__':unittest.main()
