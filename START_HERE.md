# Greater St. Paul · purple & gold website update

Target repository: https://github.com/Zayaiken21/The-growing-Church
Current website: https://zayaiken21.github.io/The-growing-Church/

1. Upload the CONTENTS of church-website into your repository, keeping assets/, supabase/ and their subfolders intact. Replace existing files. Restore the bundled content.json, icon.svg and sanctuary.svg: these were missing from the inspected repository.
2. Home and Sermons will immediately display 73 real Greater St. Paul broadcasts, with carousel navigation and a video player. The archive is labeled as a saved library until automatic status checking is connected.
3. Follow LIVESTREAM_SETUP.md to configure Supabase, run youtube-migration.sql, and deploy youtube-feed with your server-side YouTube API key. The inspected repository's assets/js/config.js was empty, so add the Supabase public URL/key there as described in README.md. Never put the YouTube API key or Supabase service key in GitHub.
4. Visit Sermons and check for a fresh “Checked [time]” message. Confirm a real replay plays and a publicly scheduled service appears. New discovery can take about 30 minutes plus YouTube indexing delays; known statuses are checked every minute while a page is open.

12 automated tests and 27 Chromium page/viewport checks passed. Real YouTube playback and the live Supabase/API integration still need your deployment checks. No live backend deployment is included or claimed.

Brand update: rich purple backgrounds, gold accents, warm ivory surfaces, matching sanctuary artwork, favicon and mobile browser theme color. Church name: Greater St. Paul, matching the YouTube channel.
