# Attention Stewardship Frontend Release Report

- Git commit: `4b08ea8`
- Route registry: `src/features/attention/lib/integration/route-registry.ts`
- Admin view: `src/features/attention/app/AdminScreen.jsx`
- Privacy-first guardrails: no public feed, no leaderboard, admin aggregate-only.

## Required Commands

- `npm run test -- src/test/attention.test.js src/test/attentionApi.contract.test.js src/test/AttentionPage.test.jsx src/test/attentionIntegration.test.ts`
- `npm run build`
- `npm run attention:audit:logs`
- `npm run attention:audit:security`

## Manual QA

- [ ] /attention dashboard shows all Batch 1-6 summaries without sensitive raw text.
- [ ] /attention/privacy defaults protect sensitive categories.
- [ ] /attention/accountability can revoke a share.
- [ ] /attention/groups challenge participants are not ranked.
- [ ] /attention/admin rejects ordinary users and shows aggregate-only data for admin.
