# Technical Debt Register

| Priority | Item | Evidence / consequence | Required action |
|---|---|---|---|
| Resolved | Sensitive MissionBridge tables have verified RLS policies | empty PostgreSQL smoke and non-owner tenant test passed | retain migration and RLS regression coverage |
| Resolved | L3 closure dual control and complete state machine | explicit transitions and two independent approvals implemented | retain negative permission tests |
| P1 | Tenant selection accepts a request header | possible confused-deputy access | bind tenant scope to authenticated membership |
| Resolved | Transactional Outbox | same-transaction write, idempotency, retry and dead letter verified | add consumer adapters as later modules land |
| Resolved | Shared Feature Flag backend guard | direct disabled API test returns 503 while safety/privacy remain available | require the guard on every later non-safety router |
| P1 | Audit metadata can include resolution narrative | sensitive content may enter audit | store field names and redacted summaries only |
| Resolved | MissionBridge component policy mock | complete Mission frontend suite is green | retain tests |
| Resolved | Browser critical path | real browser completed consent, enrollment, journey and check-in and exposed two UI defects that were fixed | repeat at each batch gate |
| P2 | AgentWorkbench tests emit React `act` warnings | assertions pass but asynchronous cleanup is noisy | await final agent state in the component test |
| P2 | Frontend is JavaScript rather than typed contracts | contract drift | add runtime schema validation, then migrate incrementally |
| P2 | Formation data is partly localStorage | cross-device and tenant semantics are weak | introduce adapters without destructive migration |
