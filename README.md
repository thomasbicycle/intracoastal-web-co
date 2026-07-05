# Intracoastal Web Co.

Marketing site for Intracoastal Web Co. — a Palm Beach County web studio building
hand-crafted websites for local small businesses.

Static HTML/CSS/JS with one Cloudflare Pages Function for the contact form.
No build step required.

## Structure

```
.
├── index.html                 # The entire site (HTML, CSS, and JS in one file)
├── screenshots/               # Portfolio images referenced by index.html
│   ├── bannonlegal-fullpage.jpg
│   └── bannonlegal-fullpage-mobile.jpg
└── functions/
    └── api/
        └── contact.js         # Serves POST /api/contact — handles the contact form
```

## Deploy (Cloudflare Pages + Git)

1. Push this folder to a GitHub repo.
2. In the Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to Git**,
   then select this repo.
3. Build settings:
   - **Framework preset:** None
   - **Build command:** *(leave blank)*
   - **Build output directory:** `/`
4. Add environment variables under **Settings → Environment variables** (Production):
   - `RESEND_API_KEY` — your Resend API key (mark as a secret)
   - `CONTACT_TO` — where inquiries are delivered, e.g. `contact@intracoastalwebco.com`
   - `CONTACT_FROM` — a verified Resend sender, e.g. `Intracoastal Web Co. <contact@intracoastalwebco.com>`
5. Trigger a fresh deployment so the variables take effect.

After setup, every push to `main` auto-deploys.

## The contact form

The form posts to `/api/contact`, which emails the submission to you via
[Resend](https://resend.com). It won't work when opening `index.html` directly
from your computer — Pages Functions only run on Cloudflare (or locally via
`npx wrangler pages dev .`).

## Updating the portfolio

To swap or add screenshots, drop new images into `screenshots/` and update the
`<img>` `src` paths in `index.html`. Full-page (tall) screenshots work best —
the browser-frame mockup auto-scrolls through them.
