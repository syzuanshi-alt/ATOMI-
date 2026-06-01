# ATOMI SHINE AI Growth OS Production Roadmap

## Phase 1 - Template hardening

- Keep Demo Mode for sales calls.
- Use Live Mode only after platform credentials are configured server-side.
- Store all monetary values as integer cents.
- Persist core entities in PostgreSQL using `db/schema.sql`.
- Run Redis and BullMQ for provider sync jobs and AI action execution queues.

## Phase 2 - Connector implementation

- Shopify or custom store: orders, customers, refunds, products, webhooks.
- Meta Ads: campaigns, ad sets, ads, creatives, spend, clicks, purchases.
- TikTok Ads: campaigns, ad groups, video creatives, cost and conversion metrics.
- Instagram Graph: business media, creator signals where permitted.
- Logistics: production state, tracking events, delivery exceptions.
- Support: Gorgias, Zendesk, or inbox ticket exports.

Do not assume third-party API response formats. Confirm each endpoint with one read-only call before mapping fields.

## Phase 3 - AI workflows

- Creative scoring agent: hook, completion, click intent, scale potential.
- Creator CRM agent: discovery, scoring, message draft, ROI review.
- Ads analyst agent: budget recommendation, pause recommendation, anomaly detection.
- Order support agent: customization parsing, reply drafting, fulfillment risk detection.

Budget changes, creator messages, and customer-facing replies remain human-confirmed.

## Phase 4 - GDPR and audit

- Lookup customer by email, phone, customer id, and order id.
- Delete or anonymize personal fields across orders, support tickets, ad audiences, AI datasets, and exports.
- Keep non-personal aggregate metrics where permitted.
- Log every deletion request in `audit_logs`.
