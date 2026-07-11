import {describe,expect,it} from 'vitest'
import {assertOfflineEligible,offlineSafety} from '../missionBridgeOffline'
describe('MissionBridge offline safety',()=>{it('never queues high-risk events locally',()=>{expect(()=>assertOfflineEligible({entityType:'incident',payload:{riskLevel:'L3'}})).toThrow(/必须联网/);expect(()=>assertOfflineEligible({entityType:'checkin',payload:{riskLevel:'L2'}})).toThrow(/必须联网/)});it('declares encryption conflict and logout guarantees',()=>{expect(offlineSafety).toEqual(expect.objectContaining({encrypted:true,conflictResolution:true,clearOnLogout:true}))})})
