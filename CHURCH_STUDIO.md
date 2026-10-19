# Church Studio

Open **admin.html** from the Church Studio login link in the footer.

## Owner setup

The site, images, page templates, public content, and design revisions are stored in `Zayaiken21/The-growing-Church`. The editor does not require Supabase. GitHub Pages is static hosting: it cannot securely run its own private password database or OAuth token-exchange server.

1. Invite each trusted website editor to the repository with write access. Website visitors do not receive publishing rights merely by signing in.
2. The owner can create a fine-grained GitHub token restricted to this repository with **Contents: Read and write**. **Actions: Read** is optional for deployment status.
3. Each editor connects with their own token. Fine-grained tokens have GitHub limitations for outside collaborators on personal repositories. Where GitHub does not offer the repository, use organization-managed access or a classic `public_repo` token, understanding that a classic token covers other public repositories that account can write to. Never share the owner's token.
4. Paste the token in Church Studio. The token remains in the JavaScript object's private field for this tab only. It is never saved to browser storage, draft exports, page HTML, or GitHub. Reloading or signing out clears it.
5. GitHub handles account passwords, two-factor authentication, collaborator removal and recovery. Revoke tokens through GitHub settings when access is no longer needed.

A one-click GitHub OAuth login would require registering an OAuth/GitHub app and deploying a confidential authorization service. This version does not pretend that a static page can provide that service.

## Editing

- Choose a page, then click its words, photo or section in the preview.
- Change text, links, photo descriptions, background photos, colors, alignment, text size, padding, margins, corners and minimum height. Select parent section to style a larger area.
- Add ready-made welcome, text, photo, three-card, scripture, invitation, FAQ, YouTube, address and spacer blocks. Edit fields; duplicate blocks; reorder with up/down buttons; hide and restore existing items.
- Colors & style changes the shared palette, heading font, base text size and corner style. Page-level overrides take precedence.
- Church content changes shared details, ministries, church events and custom photo slides. Choose whether Home shows upcoming events or custom photo slides. Event date controls use New York time, including daylight saving changes. The repeated hour when clocks go back resolves to the first occurrence.
- Pages & menu creates pages, edits menu links, and sets search engine titles/descriptions.
- The preview is sandboxed with scripts disabled. Existing live services are labeled as connected modules. Test calendar filtering, video playback and other live interactions with Open live. The editor changes content and presentation, not the underlying algorithms of these services.
- Undo/redo retains the last 40 editing steps. Drafts autosave on this browser; use My drafts to recover, delete, export or import them. Browser storage can be limited, especially with photos; errors tell you to download a backup. Drafts can contain public site content and remain after sign-out; delete them on shared computers.
- Uploaded JPG/PNG/WebP photos are resized to at most 2000 pixels on the longest edge. Images are committed to the repository only when publishing.

## Publishing and restore

Review & publish asks for a revision name, then atomically commits the design JSON, uploaded images, all compiled public pages, content fallback and sitemap. The previous design stays in Git history. GitHub Pages then deploys the commit. Deployment progress needs optional Actions read access; an unavailable status is never reported as live.

Revision history lists 20 versions at a time. Revision names can be changed without rewriting Git history. Load any revision into a draft, review it, and publish as a new revision. Restore regenerates pages from the original templates, so removed blocks, changed colors and changed words do not linger. Older custom pages are deleted when restoring a design without them. Uploaded photos are retained, making older revisions restorable. Restoring a design does not roll back source-code releases or the independently refreshed event/video/pantry feeds.

Conflict protection compares the design blob loaded at sign-in with the current published design. If another editor published, the save is rejected rather than silently overwriting their work. Background feed updates may proceed when the design is unchanged. Branch updates never use force. A concurrent branch update during publishing may require reloading and trying again; the draft remains available.

## Files and maintenance

- `assets/studio/design.json`: published complete design and church content; no private data.
- `assets/studio/templates/*.html`: stable base templates for the original public pages. Keep `data-site-id` values stable when maintaining them. Update these templates alongside future source-level page changes; Studio recompiles from these templates.
- `assets/studio/page-template.html`: new page template.
- `assets/studio/revision-names.json`: user-facing names for historical design commits.
- `assets/js/studio-model.js`: safe components, compilation, time handling and design application.
- `assets/js/studio-runtime.js`: runtime overlay for client-rendered content.
- `assets/js/studio-github.js`: authenticated GitHub persistence and conflict checks.
- `assets/js/studio-editor.js`: accessible editing interface and help.
- `assets/css/studio-admin.css`, `studio-public.css`: editor and block presentation.

`core.js` reads GitHub-published design content first, then the bundled content fallback. It no longer reads Supabase content overrides. Older Supabase modules are retained in the repository for reference but the new admin page does not load them. Existing automated GitHub feed refreshes remain independent of the editor. The admin page is marked noindex; public metadata and sitemap are generated on publish. Search engine inclusion and ranking are never guaranteed.

## Validation

Run `node --test tests/studio.test.mjs` with `happy-dom` installed. The tests cover stable IDs, compiled output, whole-design restoration, repeatable section ordering, block escaping, safe URLs/styles, Eastern time, image persistence, atomic commits, conflict rejection and non-destructive restore. The GitHub request tests use a simulated API; a real editor's GitHub login and device-specific interaction still need an owner smoke test.

Research used: GitHub Pages static hosting documentation; GitHub Git Database REST documentation and fine-grained token permission documentation; GrapesJS component/block and project-storage documentation. The implementation is a custom, dependency-free browser editor using component definitions and whole-project JSON, not GrapesJS or Shopify.
