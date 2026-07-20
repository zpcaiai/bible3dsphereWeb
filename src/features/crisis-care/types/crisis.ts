// Crisis Care (危机守护) — shared types.
// Mirrors backend crisis_engine / routers/crisis.py contracts.

export type RiskLevel = "green" | "yellow" | "orange" | "red";

export type CrisisRiskType =
  | "suicidal_ideation"
  | "self_harm"
  | "harm_to_others"
  | "panic_attack"
  | "trauma_trigger"
  | "dissociation"
  | "domestic_violence"
  | "spiritual_despair"
  | "toxic_shame"
  | "addiction_relapse"
  | "psychosis_like_symptom"
  | "medical_emergency";

export type CrisisWorkflow =
  | "normal_care"
  | "yellow_support"
  | "orange_safety_plan"
  | "red_emergency";

export interface CrisisResource {
  name: string;
  contact: string;
  availability: string;
  type: "suicide_prevention" | "emotional_support" | "emergency" | "text" | "mental_health";
  note?: string;
}

export interface ResourceBlock {
  region: string;
  regionCode: string;
  emergencyNumber: string | null;
  resources: CrisisResource[];
}

export interface TriageResult {
  riskLevel: RiskLevel;
  riskTypes: CrisisRiskType[];
  evidence: string[];
  confidence: number;
  recommendedWorkflow: CrisisWorkflow;
  requiresDirectSafetyQuestion: boolean;
  requiresHumanEscalation: boolean;
  disclaimer?: string;
  resources?: ResourceBlock;
  emergency?: EmergencyMessage;
  safetyCheck?: SafetyCheckStep;
}

export interface SafetyCheckStep {
  state: string;
  message: string;
  done: boolean;
  escalate: boolean;
}

export interface EmergencyMessage {
  headline: string;
  steps: string[];
  copyText: string;
  resources: CrisisResource[];
  region: string;
  regionCode: string;
  emergencyNumber: string | null;
}

export type GuardianRole =
  | "family" | "friend" | "pastor" | "small_group_leader"
  | "counselor" | "doctor" | "peer_companion";

export interface GuardianContact {
  id?: string;
  name: string;
  relationship: string;
  role: GuardianRole;
  phone: string;
  email: string;
  notifyMethods: string[];
  permissionLevel: "yellow" | "orange" | "red";
  consentEnabled: boolean;
  createdAt?: string;
}

export interface SpiritualAnchor {
  type: "scripture" | "truth" | "prayer";
  ref?: string;
  text: string;
}

export interface SafetyPlan {
  id?: string;
  warningSigns: string[];
  internalCopingStrategies: string[];
  safePeople: string[];
  safePlaces: string[];
  professionalResources: CrisisResource[];
  meansRestrictionSteps: string[];
  spiritualAnchors: SpiritualAnchor[];
  emergencyMessageTemplate: string;
  regionCode?: string;
  emergencyNumber?: string | null;
  status?: string;
  updatedAt?: string;
  lastReviewedAt?: string;
  rehearsedAt?: string;
}

export interface Followup {
  id: string;
  eventId?: string;
  phase: "24h" | "72h" | "7d" | "30d";
  tasks: string[];
  completedTaskIds: string[];
  dueAt: string;
  status: "pending" | "done" | "skipped";
  createdAt?: string;
}

export interface ComfortResult {
  body: string;
  scripture: { ref: string; text: string; theme?: string };
  note: string;
  detectedType?: string | null;
  convictionVsCondemnation?: Array<{ dimension: string; conviction: string; condemnation: string }>;
}
