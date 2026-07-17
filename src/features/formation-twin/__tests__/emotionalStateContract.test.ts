import { describe, expect, it } from 'vitest'
import { isGovernedEmotionObservation, type EmotionObservation } from '../emotionalStateContract'

const base: EmotionObservation = { id:'1',emotion_label:'ANGER',source_kind:'USER_REPORT',statement_type:'USER_REPORTED_FACT',occurred_at:'2026-07-17T10:00:00+08:00',confidence:null,evidence:[],user_review_status:'NOT_REQUIRED',processing_status:'ACTIVE' }

describe('emotional state shared contract',()=>{
  it('accepts unscored user report',()=>expect(isGovernedEmotionObservation(base)).toBe(true))
  it('rejects model candidate without evidence or provenance',()=>expect(isGovernedEmotionObservation({...base,source_kind:'MODEL',statement_type:'MODEL_INFERENCE',confidence:.8,user_review_status:'PENDING'})).toBe(false))
})
