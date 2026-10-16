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
if __name__=='__main__':unittest.main()
