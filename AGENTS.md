<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

## Project context

BreezeMobile Flow Intelligence is a SaaS visitor intelligence platform —
not a generic dashboard or CRM. It connects anonymous visitor behavior,
campaign attribution, session recordings, and intent signals into unified
visitor profiles.

Full architecture and decisions: `docs/architecture/plan.md`
Full change protocol: `docs/development/change-protocol.md`

---

## Before making any change

Read in this order:

1. `docs/product/phases.md` — confirm the task belongs to the current phase.
2. `docs/tracking/tracking-contract.md` — source of truth for events and attribution.
3. `docs/architecture/plan.md` — data model, adapter design, recording strategy.
4. `docs/product/scope-and-non-goals.md` — what must not be built.

Confirm mentally before touching code:

- The task belongs to the current phase.
- The task does not invent data that does not yet exist.
- The task does not turn the platform into a generic CRM or dashboard.
- The task does not modify critical tracking without authorization.
- The task does not add sales, revenue, ROAS, or confirmed lead data without real data.

---

## Change documentation (required after every non-micro change)

After every important change, provide a report with:

- **Summary** — what was done in plain language.
- **Modified files** — every file touched.
- **How it works** — user flow, data used, states, relationships.
- **Do not touch** — what must not be changed next.
- **How to validate** — concrete steps, commands if applicable.
- **Risks** — what to watch.
- **Documentation updated** — which docs changed, or why none were needed.
- **Pending** — what remains from this change.
- **Suggested commit** — conventional commit message.

Change levels:

| Level | When | Report required |
|---|---|---|
| Micro | Text fix, style tweak, typo | Commit message only |
| Standard | New view, component, query, mock | Sections above (skip doc update if scope unchanged) |
| Architectural | Tracking, PostHog, GTM, data model, storage, phases | Full report + updated docs |

---

## Document hierarchy (conflict resolution)

When documents conflict, this order wins:

1. `docs/tracking/tracking-contract.md` — always wins on events, payloads, attribution, privacy.
2. `docs/architecture/plan.md` — wins on technical decisions and data model.
3. `docs/product/phases.md` — wins on scope and phases.
4. `docs/product/scope-and-non-goals.md` — wins on what not to build.
5. Any other doc in `docs/` — most recently modified wins.

---

## Rules that never change without explicit authorization

- Event names (`page_view_custom`, `service_click`, `whatsapp_click`)
- Event payloads and field names
- `visitor_id`, `session_id`, `event_id` generation logic
- `localStorage` and `sessionStorage` keys
- Attribution logic (session-level, no inheritance between sessions)
- Privacy rules (no PII in tracking, PostHog, GTM, or dataLayer)
- PostHog integration (server-side only, no API keys in frontend)
- GTM/dataLayer behavior and Meta Pixel assumptions
- The meaning of `whatsapp_click`
- Any screen or label that would imply confirmed lead, sale, revenue, or ROAS

```
whatsapp_click = anonymous conversion / high-intent signal
whatsapp_click ≠ confirmed lead
whatsapp_click ≠ sale
whatsapp_click ≠ revenue
```

---

## Pre-push checklist

- [ ] Critical tracking not modified without authorization
- [ ] Event names unchanged
- [ ] `visitor_id`, `session_id`, `event_id` intact
- [ ] No PII added to tracking
- [ ] No sales, revenue, or ROAS shown without real data
- [ ] No `whatsapp_click` called a confirmed lead
- [ ] No private API keys exposed in frontend
- [ ] Main navigation still works
- [ ] Documentation updated if scope, data, or integrations changed

```bash
npm run lint
npm run build
```

---

## Final rule

Nothing important lives only in the chat.

Every relevant change must end up in code, documentation, an issue,
a pull request, or a clear report in the project history.
