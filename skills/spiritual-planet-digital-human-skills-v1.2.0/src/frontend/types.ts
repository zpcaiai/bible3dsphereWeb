export type GroundingLevel =
  | 'G5_DIRECT_SCRIPTURE'
  | 'G4_STRONG_SCRIPTURAL_FACT'
  | 'G3_SCRIPTURAL_INFERENCE'
  | 'G2_HISTORICAL_RECONSTRUCTION'
  | 'G1_INTERPRETIVE_POSSIBILITY'
  | 'G0_UNSUPPORTED';

export interface BibleCharacter {
  id: string;
  canonicalName: string;
  avatar: {
    provider: 'metaperson';
    modelUrl: string;
    portraitUrl?: string;
    version: string;
    framing?: 'head' | 'bust' | 'full';
  };
  voice: {
    provider: string;
    voiceId: string;
    language?: string;
  };
}

export interface DigitalHumanResponse {
  characterId: string;
  answerType: 'FACT' | 'EVENT' | 'THEOLOGY' | 'DEVOTIONAL' | 'UNSUPPORTED';
  spokenText: string;
  displayText: string;
  groundingLevel: GroundingLevel;
  references: Array<{
    sourceType: 'SCRIPTURE' | 'HISTORY' | 'COMMENTARY' | 'INTERNAL_REVIEW';
    locator: string;
    claimSupport: 'DIRECT' | 'STRONG' | 'INFERRED' | 'CONTEXT_ONLY';
  }>;
  warnings: string[];
}
