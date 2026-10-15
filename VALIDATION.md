# Validation status — October 15, 2026

Completed:
- Retrieved the provided video's public oEmbed metadata and identified Greater St. Paul / @GreaterStPaulHDIWC.
- Read all three public Streams listing pages and bundled 73 real broadcast IDs and titles.
- Parsed all nine HTML pages; verified local links/assets, unique IDs and form labels.
- Syntax-checked all frontend JavaScript modules.
- Seven model tests: status classification, scheduled-time handling, replay priority, upload exclusion, sorting/deduplication, stale-state handling and embed restrictions.
- DOM interaction tests: archive rendering, next/previous, filters, title search, load-more, modal open/close, movement paused during playback, safe text, non-embeddable fallback, live-to-replay refresh, timer cleanup.
- Four Edge Function tests with mocked YouTube and Supabase responses: indexing/classification, cache lease, API outage fallback and missing-key/method handling. The deployed SQL and real API integration were not tested by these mocks.
- Real Chromium: all nine pages at 375px, 768px and 1440px (27 page/viewport checks), with no horizontal overflow or JavaScript page errors. Checked slideshow controls, filters, search, pagination, player modal, mobile navigation and reduced-motion behavior.
- Inspected the rendered mobile broadcast layout. External fonts/thumbnails were blocked during deterministic browser checks; local image fallbacks were exercised.

Still requires the church's deployment:
- Real YouTube playback, embed availability, audio and fullscreen behavior. The browser test used an external-player fixture, not a playing YouTube video.
- Installation of youtube-migration.sql, real Supabase cache leases/RLS and deployed Edge Function.
- A real YouTube API key; automatic channel discovery, live transitions and quotas against that project.
- Existing login/PIN recovery still needs the real project's original installation checks.

Run local model/backend/DOM tests with Node 24:

    npm install
    npm test

Read LIVESTREAM_SETUP.md for activation and post-deployment checks. Automatic status tracking is implemented but is not active merely by uploading static HTML without the backend setup.

Purple/gold brand revision: Chromium checks repeated successfully across all 27 page/viewport combinations; church name, favicon, theme color and local artwork updated.
