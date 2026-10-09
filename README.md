# Grace & Gather — church website

A responsive, front-end-first church website for GitHub Pages. Vanilla HTML, CSS and JavaScript. No build step. Each page has its own HTML and JavaScript file. This is a customizable starter with sample church copy, not a live church deployment.

## Included
- Home: automatic 6.5-second slideshow with text, link and optional image per slide; previous/next, dots, pause, reduced-motion support and focus pause.
- About, Ministries, Sermons, Events, Visit, Give, Privacy and Member/Admin pages.
- Mobile navigation, responsive cards, keyboard access, visible focus, and local original sanctuary artwork.
- Pastor content editor: name, service time, address, email, slides, ministries, sermon links, events, giving and livestream links. Add, reorder or remove items and publish to Supabase.
- Member registration, password login, email password reset, signed-in password change and logout.
- Pastor-issued, per-member, hashed 10–16 digit recovery PINs. One use; 30-minute expiry; five guesses per email per 15 minutes. Pastor accounts use email recovery, not PIN recovery.

## 1. Preview
From this folder:

    python3 -m http.server 8080

Open http://localhost:8080. Use HTTP rather than opening HTML through file:// because modules and JSON need a web server. Public pages work without Supabase, showing assets/content.json. Google Fonts are optional; installed system fonts are the fallback. Authentication loads the Supabase client from jsDelivr when configured.

## 2. Prepare the church copy
Edit assets/content.json for bundled content. Replace the sample name, address, example email, About introduction, service details, messages and events. Review the privacy page. Do not advertise sample events as real events. Set your church’s official giving-provider URL; no payment credentials or card collection belong here. Images can be local paths such as assets/my-church.jpg or HTTPS URLs you have permission to use. Titles accept line breaks. All entered content is rendered as plain text, never executable HTML.

The visual is original local SVG artwork, not a photograph. Replace it with your real church photography using slide image fields if desired. The editor supports text/image/button slides rather than arbitrary HTML or embedded scripts.

## 3. Create and connect Supabase
1. Create a Supabase project.
2. Open SQL Editor and run supabase/schema.sql once. Do not re-run the complete script after installation.
3. In Authentication settings enable email/password signup and email confirmation. Set minimum password length to 12. Configure production SMTP so confirmations and recovery emails can reach real members.
4. Set Site URL to your GitHub Pages project URL, e.g. https://YOURNAME.github.io/YOURREPO/. Allow the exact redirect https://YOURNAME.github.io/YOURREPO/admin.html. Add http://localhost:8080/admin.html only if testing locally.
5. Get the project URL and public publishable key (or legacy anon key) from your project settings. Never put a service-role, secret key, database password or recovery PIN in your repo.
6. At the bottom of the site select Member & church admin login, expand Connect your Supabase project, and enter the URL/public key. This saves the connection on that browser.
7. Select Download public config. Replace assets/js/config.js in the repository with this downloaded file. Now all visitors connect to the same church project. Public keys are designed for browser use; database policies enforce access.
8. Create the pastor account, confirm its email, then run the commented pastor-promotion SQL at the bottom of schema.sql with the correct email. This must be done by the project owner in SQL Editor. Creating an account never makes someone a pastor automatically.
9. Sign out and back in. The pastor dashboard will appear. Publish content to populate the singleton church_content record. Cloud content then overrides bundled content for connected visitors.

Each Supabase project is one church. Members normally only enter an email and password; project connection fields are for the church’s setup, not for every member. To switch church projects, clear the connection, enter the new URL/key, and reconnect. Clear connection removes the browser override; a committed config.js remains the default.

## 4. Deploy pastor PIN recovery
GitHub Pages cannot execute backend code. The front end remains entirely in GitHub; the supplied backend runs inside Supabase Edge Functions and database policies.

Install the Supabase CLI using the official instructions, log in, and run from this folder:

    supabase login
    supabase link --project-ref YOUR_PROJECT_REF
    supabase secrets set ALLOWED_ORIGINS=https://YOURNAME.github.io
    supabase functions deploy church-recovery --no-verify-jwt

Origins have no path or trailing slash. For a custom domain use its origin. Multiple origins can be comma-separated, e.g. https://YOURNAME.github.io,http://localhost:8080. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are supplied inside the hosted function environment; never copy that service key to front-end config.

The function is intentionally public for recovery. It independently verifies the signed-in pastor’s token before issuing any PIN. SQL RPC execution is restricted to service_role. CORS is an origin filter, not an authentication mechanism; PIN validation, row locking and rate limits run server-side.

Recovery procedure:
1. Pastor verifies the member’s identity separately.
2. Pastor signs in, enters the confirmed member email, and sets a unique unpredictable 10–16 digit PIN. Use randomly generated digits; do not reuse a church-wide master PIN.
3. Pastor communicates the PIN privately. It is never stored in public content.
4. Member opens the login page and enters email, PIN and a new password.
5. Server consumes the PIN and changes that member’s password. Member signs in with the new password.

Wrong attempts count against the same account for 15 minutes; issuing a replacement PIN does not clear this limit. A failed password update after PIN consumption requires the pastor to issue a new PIN. Pastor accounts and unconfirmed accounts cannot use PIN recovery. Email recovery remains available. Optional cleanup queries are included in schema.sql. For a large public deployment add platform-level request limits/CAPTCHA to control abuse and unbounded unknown-email attempt records.

## 5. Publish on GitHub Pages
1. Create/open your GitHub repository.
2. Upload the CONTENTS of this folder into the repository root (index.html at root).
3. Commit. Open Settings → Pages → Deploy from a branch → main → / (root) → Save.
4. Open the resulting GitHub Pages URL after deployment finishes.
5. Confirm your Supabase redirect URLs and ALLOWED_ORIGINS match it.

All links and assets are relative, so repository subpaths work. No GitHub token is required by the website. Future code/layout edits are committed in GitHub; pastor content edits are stored in Supabase and display without a new GitHub build. Do not upload private secrets. Backend files can be public source; their secrets are set only in Supabase.

## Acceptance checks after connecting your project
- Visit all pages at 375px, tablet and desktop widths. Check navigation and footer login.
- Confirm slides rotate, dots/next/previous work, Pause holds the current slide, and reduced-motion users start paused.
- Create/confirm a member. Confirm member cannot see the dashboard or write church_content (RLS denies it).
- Promote only your real pastor via SQL. Verify publish changes appear on a refreshed public page.
- Confirm signup email and email-reset redirects return to admin.html and password updates work.
- Issue PIN, try one wrong PIN, use the correct PIN, then verify replay fails.
- Confirm expired PIN fails and five wrong guesses block another attempt within 15 minutes.
- Verify a member token cannot issue a PIN, anonymous table reads cannot fetch PIN hashes, and PIN recovery cannot reset pastor accounts.
- Verify your real sermon, giving and email links.

Local browser checks cover the bundled UI. Supabase login, permissions and deployed PIN recovery require a real project and must be verified after installation. No deployment or live Supabase integration is claimed by this package.

Official reference documentation:
- https://supabase.com/docs/guides/auth/passwords
- https://supabase.com/docs/reference/javascript/auth-admin-updateuserbyid
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/functions
- https://docs.github.com/en/pages
