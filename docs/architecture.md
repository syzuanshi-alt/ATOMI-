# Architecture

## Five checks before each feature

1. Data source: TikTok, Instagram, Meta Ads, independent store API or webhook, logistics, support, or CSV.
2. AI replacement: identify whether the manual step can be drafted, scored, queued, or fully automated.
3. Multi-role view: GMV/ROAS for owner, creator tasks for BD, CPA and creative value for media buyer, custom order and after-sale risk for support.
4. EU/US compliance: rate limits, permission scopes, audit log, GDPR lookup, deletion, and anonymization.
5. Growth loop: every result should become a reusable data asset for future creator, creative, ad, and fulfillment decisions.

## Runtime shape

- Frontend: Next.js App Router and TypeScript.
- Backend: Next.js API routes for the template, replaceable with NestJS when the API surface grows.
- Database: PostgreSQL using `db/schema.sql`.
- Cache and queue: Redis and BullMQ.
- Files: S3 plus CloudFront for creative assets, order proofs, and production images.
- AI Agent: independent service that writes recommended actions into `ai_actions`.
- Human approval: required for budget changes, outbound creator messages, and customer-facing replies.

## Creator-to-ads workflow

Creator CRM owns the cooperation lifecycle:

```text
Creator
  -> Outreach / Sample / Contract
  -> Creative Asset
  -> Ad Test
  -> Order Attribution
  -> ROI Review
```

The creator detail page should show BD actions, video output, ad-test summaries, and creator-level ROI. Full media buying ROI remains in Ads Cockpit so the media buyer can compare every creative across creators, countries, and audiences.

## Connector policy

- Never call provider APIs from the browser.
- Store tokens only on the server, encrypted at rest.
- Probe one read-only endpoint before mapping any third-party fields.
- Wrap provider calls with rate limiting and circuit breaker.
- Persist raw sync metadata for debugging, but avoid storing unnecessary personal data.

## Multi-region deployment

- US region for US/CA traffic and ad sync jobs.
- EU region for UK/DE/FR traffic where GDPR workflows and data residency need tighter control.
- AU edge routing for storefront and dashboard read latency.
- Central analytics warehouse can aggregate anonymized metrics after GDPR-safe transformations.

## Role-based access

Use role-based access control before showing pages or executing actions:

| Role | Main modules | Sensitive actions |
| --- | --- | --- |
| GM / Owner | Dashboard, Ads summary, Creator ROI, Orders summary, AI approvals | Approve budget changes |
| BD | Creator CRM, Creator Detail, Creative handoff, AI message approvals | Confirm creator outreach and sample tasks |
| Media Buyer | Creative Center, Ads Cockpit, AI budget recommendations | Request budget changes, pause creatives |
| Support | Orders, AI support replies, GDPR workflow | Confirm customer replies and privacy requests |
| Admin | Integrations, all audit views, GDPR, full configuration | Manage provider credentials and permissions |

Frontend role filtering is only a UX layer. Production APIs must also check permissions server-side before returning data or executing actions.

In this template:

- `lib/permissions.ts` defines the permission matrix.
- `lib/auth.ts` reads the demo role from `x-demo-role` or `demo_role` cookie.
- API routes call `requirePermission()` before returning sensitive data or executing actions.
- AI action approval also checks action ownership: GM approves budget, BD approves creator outreach, Media Buyer approves creative actions, Support approves customer/GDPR actions.
