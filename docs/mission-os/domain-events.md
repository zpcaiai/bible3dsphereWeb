# Domain Events and Outbox

Mission OS writes a versioned event into `mission_outbox_events` using the same database cursor and transaction as the aggregate change. Publishing is asynchronous. Consumers identify themselves with a stable key and use `(consumer_key,event_id)` as their idempotency boundary. Delivery failure never rolls back a previously committed aggregate.

Events contain identifiers and minimum operational facts, never private narratives, mental-health text, exact contacts or locations, credentials, documents, or unredacted assessments. The repository rejects known sensitive keys. Error storage records exception type only.

The canonical event catalog begins with `MissionCallingJourneyStarted`, `MissionCallingJourneyPaused`, `MissionReadinessAssessmentCompleted`, `MissionTrainingPlanCreated`, `MissionTrainingMilestoneCompleted`, `MissionFieldInterestConfirmed`, `MissionSendingJourneyStarted`, `MissionDeploymentSubmitted`, `MissionDeploymentApproved`, `MissionDeploymentPaused`, `MissionMemberCareRiskRaised`, `MissionIncidentCreated`, `MissionIncidentEscalated`, `MissionLocalLeaderCandidateIdentified`, and `MissionLeadershipTransferred`. All event payloads are versioned.

Workers claim rows with `FOR UPDATE SKIP LOCKED`, retry with bounded exponential backoff, and dead-letter after eight attempts. Replay requires an administrator, cannot edit payload, and writes an audit record. Formation, Habit, Crisis, and Notification consumers are adapters and must be independently idempotent.
