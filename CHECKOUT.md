# ATOMI SHINE AI Growth OS Checkout

## Immediate visual review

Double-click `launch-app.cmd`.

If Windows blocks script launch, open `index.html` directly in a browser.

## What to test

1. Switch Demo Mode / Live Mode in the left sidebar.
2. Switch the role selector between GM, BD, Media Buyer, Support, and Admin. Notice each role gets a different navigation set and home tasks.
3. As Admin, open Data Integration and fill any account reference.
4. Upload `sample-data/orders.csv` or `sample-data/ad-metrics.csv`.
5. As BD, open Creator CRM and generate an English DM draft.
6. In Creator CRM, click `查看合作链路` to review BD workflow, video assets, ad test summary, and creator ROI summary.
7. As Media Buyer, open Creative Center and Ads Cockpit.
8. As Support, open Orders and GDPR.
9. Open AI Confirmation Center and approve or reject actions.

Server-side permission checks in the Next.js template:

- `GET /api/me` returns the detected demo role and permissions.
- Pass `x-demo-role: admin`, `gm`, `bd`, `media`, `media_buyer`, or `support` when testing APIs.
- Example: a BD can approve creator outreach but cannot approve budget changes.

## Production app path

After npm dependencies are available:

```bash
npm install
npm run dev
```

Then open:

```text
http://127.0.0.1:4173
```
