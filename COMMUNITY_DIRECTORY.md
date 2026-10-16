# Community calendar and free-food directory

Events page: https://zayaiken21.github.io/The-growing-Church/events.html

## What is included
- Our church, Free community, All approved events, Online and Food pantries sections.
- New York / America/New_York month calendar, event day, date and EST/EDT times; date selection, month navigation and calendar downloads.
- Combined event filters: title/keyword, borough, attendance format, date range and explicitly free admission.
- Food-help directory: borough, organization/address/ZIP search, pantry vs. prepared meals, listed service day, halal/kosher/mobile/HIV-client pantry types, source links, phone and directions.
- The homepage has one quiet invitation to Watch. The broadcast library is only on Watch, rather than repeated across multiple pages.

## Sources
- NYC Parks' official rolling 14-day Open Data feed: https://data.cityofnewyork.us/resource/w3wp-dpdi.json
- NYC Parks' official public XML fallback: https://www.nycgovparks.org/xml/events_300_rss.xml
- NYC Food Help's official public production map layers, discovered via https://finder.nyc.gov/foodhelp/config/runtime-config.json

Only the public food-program fields needed for the directory are retained; source editor usernames and map/geocoding keys are not stored. Both production map layers are paginated and deduplicated by program/address. Pantry eligibility notes and source record-update dates remain visible. This is an index of currently listed programs in those sources, not a guarantee to include every free food provider or current inventory in NYC.

Public organizer events are independent listings, not Greater St. Paul-hosted or endorsed events. A church event with no listed cost is NOT labeled free. Parks events are included only when their organizer description explicitly states that the event or program is free. This conservative filter may omit free events whose descriptions do not say so.

## Automatic operation
The GitHub Actions workflow `.github/workflows/refresh-community.yml` runs about every six hours and on updates to the importer/workflow. It fetches the public sources without API keys and commits the screened combined, event-only and pantry-only feeds to main. It can also be run manually from the repository's Actions tab.

The live Events page initially uses its bundled feed, then checks the same JSON on raw.githubusercontent.com on the main branch, and checks again every five minutes while the page is visible. This is deliberate: commits made with GITHUB_TOKEN do not themselves trigger another Pages build. The fresh data is still available immediately through raw GitHub, subject to caching delays.

Sources refresh independently. If one fails, its last successful data is retained with the actual last-success timestamp and an unavailable warning. If every initial source is unusable, no empty replacement is published. Expired events are removed in both the importer and browser. GitHub schedules can be delayed or disabled according to GitHub's repository policies; the site warns when the last refresh is over 36 hours old. Source data itself may be older than the latest fetch. Current hours, eligibility, appointment rules and food availability must be confirmed with the provider.

## Church-owned events
In the existing pastor dashboard select Events. New structured fields include start/end, location, borough, attendance format, admission, organizer and registration/detail URL. Start/end must include a timezone offset (e.g. `2026-12-06T10:00:00-05:00`). Use `free` for an event explicitly offered free; otherwise use `check`. Undated starter cards are not treated as real calendar events. Church-owned events are merged with public listings after loading the configured Supabase content. Authentication requires the original Supabase setup; the public events and food-help feeds do not.

## Local verification
- `node --test tests/community-model.test.mjs` (Eastern date boundaries, DST, filters, expiry, pantry service types, leap months, calendar export escaping).
- `python scripts/test_community.py` (normalization, explicit free-admission detection and organizer timezone parsing).
- Preview with `python3 -m http.server 8080`.

External event descriptions are rendered as text. No third-party script or ticketing/payment form is embedded in the directory. Follow source links to register or confirm attendance.

## Church-only scope and event screening
The church section accepts only Greater St. Paul announcements entered by its authorized pastor. Other churches’ calendar imports are removed. Undated example cards are not converted into invented service dates.

`assets/event-policy.json` is applied by both Python imports and the browser. Explicitly excluded themes are blocked in titles, descriptions, categories, locations and event URLs; positive routine categories are required for automatic community publication. Movies, festivals, spiritual activities and other ambiguous entertainment are withheld unless reviewed and explicitly added to the approval list. Excluded themes stay blocked even if their IDs are on the approval list. Editing the policy is an editorial decision for the church’s owner/pastor, not a promise that keywords can decide every theological question. No listing is presented as the pastor’s personal theological endorsement.

Retained fallback data is screened again on every refresh. Missing or invalid policy means no public events are shown, while food help remains available. Pantry listings are not filtered by the provider’s religion or borough. The default calendar is Our church; free community activities have a separate tab.

`events-feed.json` is small and loads first. `pantries-feed.json` is loaded only when the food-help tab is opened. The combined file remains policy-screened for older visitors. The scheduled workflow commits all three files.

The View details button opens an accessible on-site dialog with the imported event details, so reading the event does not depend on an external site. Official source and registration links are clearly labeled; remote availability remains under the organizer’s control.


## October 16 update
Helping Hands (`helping-hands.html`) hosts the pantry and community-kitchen directory independently of Events. Home restores a Services section without inventing service times. Policy v2 allows neutral free arts, music, festivals and other supported activities after explicit-theme screening; ambiguous film and spiritual listings remain review-gated. Food assistance is independent of event screening.
