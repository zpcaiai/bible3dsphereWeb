# Reuse Matrix

| Capability | Existing module | Reuse | Adapter | Migration | Risk | Owner |
|---|---|---|---|---|---|---|
| Authentication | backend session user | direct | yes | no | session semantics vary | Identity |
| Organizations | organization memberships | direct | yes | no | tenant header trust must be constrained | Identity |
| Formation and habits | spiritual-formation features | reference | yes | unknown | localStorage and backend models differ | Formation |
| Gifts and strengths | existing profile surfaces | reference | yes | unknown | ownership duplication | Identity |
| Crisis guidance | crisis/healing modules | integrate | yes | likely | Mission incidents must not replace CrisisCase | Crisis |
| Content | existing content APIs and R2 | direct | yes | no | review status consistency | Content |
| Notifications | existing API | direct | yes | no | delivery failure must not roll back domain work | Notification |
| Internationalization | i18n runtime | direct | no | no | generated translations require build check | Web |
| PWA | Vite service worker | direct | no | no | sensitive offline caching | Web |
| Consent and programs | MissionBridge | extend | yes | existing draft | incomplete retention and RLS | Mission OS |
| Incidents | MissionBridge incident routes | extend | yes | existing draft | incomplete workflow and dual review | Mission OS / Crisis |
| Audit | MissionBridge audit table | adapt | yes | extend | metadata may contain narrative | Platform |
| Feature flags | unknown | build or prove | yes | yes | unsafe default enablement | Platform |
| Outbox | unknown | build or prove | yes | yes | lost or duplicate integration | Platform |
| Data lineage | missing | build | yes | yes | unverifiable AI and score claims | Platform |
