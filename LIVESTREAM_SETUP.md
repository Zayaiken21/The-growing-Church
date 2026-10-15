# Greater St. Paul — automatic livestreams

The supplied video belongs to **Greater St. Paul**, @GreaterStPaulHDIWC.
Verified channel ID: UCZ8zYO9to_8PzUWwQj6xRBg.

The updated website includes 73 publicly listed broadcasts collected from all three pages of the channel’s Streams tab on October 15, 2026. These are real video IDs and titles, not demonstration services. This is the channel's currently visible public archive, not private/unlisted/deleted broadcasts. The bundled archive works immediately without a YouTube API key. It is explicitly labeled as a saved library; it does not claim to know whether the church is currently live.

## Turn on automatic updates (required once)

1. Keep your existing Supabase configuration. In Supabase SQL Editor, run **supabase/youtube-migration.sql** once. Do NOT rerun the original schema.sql on an existing installation.
2. In a Google Cloud project, enable **YouTube Data API v3**, create an API key, and restrict its API permissions to YouTube Data API v3. This is a backend key: do not use HTTP-referrer restrictions, put it in GitHub files, or paste it in the website editor.
3. Set the key as a Supabase Edge Function secret and deploy the new function:

       supabase secrets set YOUTUBE_API_KEY=YOUR_REAL_KEY
       supabase functions deploy youtube-feed --no-verify-jwt

   Run these from the church-website folder after logging in/linking your Supabase project as described in README.md. Alternatively add YOUTUBE_API_KEY under your Supabase Edge Function secrets and deploy the supplied youtube-feed folder using your normal Supabase deployment workflow.

4. Ensure **assets/js/config.js** contains your existing Supabase project URL and public publishable/anon key. Upload the updated front-end files to GitHub, preserving folders. Do not overwrite a configured config.js with the empty example in this package. The function URL is derived automatically from the project URL.
5. Open sermons.html. The notice should change from “Saved broadcast library” to “Checked [time]”. That confirms it fetched the backend feed. A fresh page may initially show the bundled snapshot while the first API archive scan prepares; retry after one minute.

There is no API key entry field on the public website. The function has one fixed channel and accepts no arbitrary channel or video queries.

## What updates automatically

- Each open, visible page checks the backend once per minute.
- The server shares one 60-second cache across all visitors and uses a database lease to prevent simultaneous refreshes. Closing every page stops demand-driven checks; opening a page resumes them. No always-on browser is required.
- Each refresh reads the newest channel uploads and rechecks previously known live/upcoming videos. Live and upcoming items are sorted ahead of replays. Date/time displays in each visitor’s local timezone.
- A new-channel discovery runs two YouTube searches at most once every 30 minutes to find live and scheduled events not yet exposed in uploads. Newly scheduled events can therefore take up to about 30 minutes plus YouTube indexing delay to appear. Most already listed upcoming/live transitions are detected on the next one-minute check, subject to YouTube metadata delays. This is polling, not an instant notification guarantee.
- Every 24 hours on the next request, the server reindexes the public uploads library (up to 10,000 uploads), filtering broadcasts by YouTube liveStreamingDetails. More than 50 simultaneous live/upcoming search results are flagged as limited. There is no promise to expose private, deleted, unlisted, restricted or not-yet-announced services.
- Upcoming dates alone never turn a video into “Live now”. YouTube must report actual live status. A saved or more-than-five-minute-old feed shows unverified status instead of claiming it is current.
- On errors, the last working feed remains visible; if none exists, the bundled real archive appears. A direct YouTube channel link always remains available.

## Watching and sliding

Home and Sermons include an automatic broadcast slideshow (8 seconds per item), previous/next, play/pause, and Live now / Upcoming / Replays filters. Sermons also has title search and “Show more broadcasts” for the complete loaded archive. Home offers six cards plus a full-library link.

Automatic movement is disabled initially for reduced-motion visitors and pauses when the featured section receives keyboard focus. A service plays in a modal, never automatically as the carousel moves. Slide movement stops while the player is open. The player includes fullscreen/mobile playback permissions and a direct YouTube fallback; YouTube can still restrict embeds or require playback on its own site. The code respects videos marked non-embeddable by linking to YouTube instead.

## Quotas and deployment checks

Check your Google Cloud project's current quotas. The design makes at most 96 scheduled search calls per continuously active day, plus low-cost channel/upload/video checks. Actual quotas and indexing behavior are controlled by YouTube. Cache refreshes are public but cannot change the channel or supply an arbitrary query. If your project reaches quota, the site keeps the previous library and warns that updates are unavailable.

After deployment:
- Confirm the homepage and Sermons list the October 11 service and older services.
- Test next/previous, filters, search, load more, and video modal on phone and desktop.
- Confirm the feed timestamp is fresh after connecting the function.
- For a real scheduled PUBLIC service, confirm it appears after a discovery cycle and transitions according to YouTube’s reported state; its time alone must not trigger Live now.
- Check the Supabase function logs for errors without exposing API keys.
- Test one replay that permits embedding. If YouTube blocks it, use Watch on YouTube.

## Current validation limits

Real public channel metadata and all three Streams listing pages were retrieved successfully; 73 real broadcasts were bundled. Local automated model/DOM tests are described in VALIDATION.md. There is no supplied church GitHub URL, Supabase project, or YouTube API key, so the live backend is not deployed or end-to-end verified against that project. Chromium layout and interaction checks passed at phone/tablet/desktop widths. Real YouTube player playback and the configured backend require your deployment; mocked and DOM tests do not prove video playback.

Official documentation:
- https://developers.google.com/youtube/data/reference/rest/v3/search/list
- https://developers.google.com/youtube/data/reference/rest/v3/videos/list
- https://developers.google.com/youtube/data/reference/rest/v3/playlistItems/list
- https://supabase.com/docs/guides/functions
