import { render,screen } from '@testing-library/react'
import { describe,it,expect,vi } from 'vitest'
import MissionAuditConsole from '../features/mission-os/components/MissionAuditConsole'
vi.mock('../features/mission-os/api/audit',()=>({fetchMissionAudit:vi.fn().mockResolvedValue({items:[{id:'a1',action:'approve',result:'success',resourceType:'deployment',resourceId:'d1',changedFields:['status']}]}),fetchMissionLineage:vi.fn(),requestBreakGlass:vi.fn()}))
describe('MissionAuditConsole',()=>{it('renders metadata without sensitive values',async()=>{render(<MissionAuditConsole token="t"/>);expect(await screen.findByText('approve')).toBeTruthy();expect(screen.getByText(/status/)).toBeTruthy();expect(screen.queryByText(/reflection|passport|token/i)).toBeNull()})})
