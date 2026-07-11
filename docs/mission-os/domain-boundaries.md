# Domain Boundaries

Mission OS owns MissionField, PeopleGroup, FieldResearchProject, CallingJourney, WorkerReadinessAssessment, MissionTrainingPlan, SendingJourney, MissionTeam, MissionPartnership, DeploymentPlan, MemberCarePlan, MissionIncident, LocalLeaderDevelopmentPlan, MissionProgram, and MissionEvaluation.

Identity owns User and IdentityProfile. Formation owns GiftProfile, FormationPlan, HabitPlan, and DiscipleshipJourney. Crisis owns CrisisCase. Content owns ContentItem. Notifications own NotificationPreference.

Mission OS may use external data only through a versioned API, adapter, or domain event. It must not import another context's repository or update its tables. AI may produce a reviewable proposal but may not directly mutate an aggregate or make final calling, sending, safeguarding, or leadership-transfer decisions. Analytics consumes redacted events or read models and cannot write transaction tables.

The frontend uses public contracts through the API. The current split-repository deployment is retained: `bible3dsphereWeb` owns React UI and `bible3dsphere` owns FastAPI and PostgreSQL behavior.
