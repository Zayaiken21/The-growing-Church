# Community calendar and free-food directory

Events page: https://zayaiken21.github.io/The-growing-Church/events.html

## What is included
- All events, Church gatherings, Free events, Online and Food pantries sections.
- New York / America/New_York month calendar, event day, date and EST/EDT times; date selection, month navigation and calendar downloads.
- Combined event filters: title/keyword, borough, attendance format, date range and explicitly free admission.
- Food-help directory: borough, organization/address/ZIP search, pantry vs. prepared meals, listed service day, halal/kosher/mobile/HIV-client pantry types, source links, phone and directions.
- The homepage has one quiet invitation to Watch. The broadcast library is only on Watch, rather than repeated across multiple pages.

## Sources
- NYC Parks' official rolling 14-day Open Data feed: https://data.cityofnewyork.us/resource/w3wp-dpdi.json
- NYC Parks' official public XML fallback: https://www.nycgovparks.org/xml/events_300_rss.xml
- Riverside Church's public organizer calendar: https://www.trcnyc.org/events/?ical=1&tribe_display=list
- NYC Food Help's official public production map layers, discovered via https://finder.nyc.gov/foodhelp/config/runtime-config.json

Only the public food-program fields needed for the directory are retained; source editor usernames and map/geocoding keys are not stored. Both production map layers are paginated and deduplicated by program/address. Pantry eligibility notes and source record-update dates remain visible. This is an index of currently listed programs in those sources, not a guarantee to include every free food provider or current inventory in NYC.

Public organizer events are independent listings, not Greater St. Paul-hosted or endorsed events. A church event with no listed cost is NOT labeled free. Parks events are included only when their organizer description explicitly states that the event or program is free. This conservative filter may omit free events whose descriptions do not say so.

## Automatic operation
The GitHub Actions workflow `.github/workflows/refresh-community.yml` runs about every six hours and on updates to the importer/workflow. It fetches the public sources without API keys and commits `assets/community-feed.json` to main. It can also be run manually from the repository's Actions tab.

The live Events page initially uses its bundled feed, then checks the same JSON on raw.githubusercontent.com on the main branch, and checks again every five minutes while the page is visible. This is deliberate: commits made with GITHUB_TOKEN do not themselves trigger another Pages build. The fresh data is still available immediately through raw GitHub, subject to caching delays.

Sources refresh independently. If one fails, its last successful data is retained with the actual last-success timestamp and an unavailable warning. If every initial source is unusable, no empty replacement is published. Expired events are removed in both the importer and browser. GitHub schedules can be delayed or disabled according to GitHub's repository policies; the site warns when the last refresh is over 36 hours old. Source data itself may be older than the latest fetch. Current hours, eligibility, appointment rules and food availability must be confirmed with the provider.

## Church-owned events
In the existing pastor dashboard select Events. New structured fields include start/end, location, borough, attendance format, admission, organizer and registration/detail URL. Start/end must include a timezone offset (e.g. `2026-12-06T10:00:00-05:00`). Use `free` for an event explicitly offered free; otherwise use `check`. Undated starter cards are not treated as real calendar events. Church-owned events are merged with public listings after loading the configured Supabase content. Authentication requires the original Supabase setup; the public events and food-help feeds do not.

## Local verification
- `node --test tests/community-model.test.mjs` (Eastern date boundaries, DST, filters, expiry, pantry service types, leap months, calendar export escaping).
- `python scripts/test_community.py` (normalization, explicit free-admission detection and organizer timezone parsing).
- Preview with `python3 -m http.server 8080`.

External event descriptions are rendered as text. No third-party script or ticketing/payment form is embedded in the directory. Follow source links to register or confirm attendance.
