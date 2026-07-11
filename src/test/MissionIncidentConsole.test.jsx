import { render,screen } from '@testing-library/react'
import { describe,it,expect,vi } from 'vitest'
import MissionIncidentConsole from '../features/mission-os/components/MissionIncidentConsole'
vi.mock('../features/mission-os/api/incidents',()=>({fetchMissionIncidents:vi.fn().mockResolvedValue({items:[{id:'i1',riskLevel:'L3',category:'medical',status:'resolved',assignedTo:'officer'}]}),fetchMissionIncident:vi.fn(),transitionMissionIncident:vi.fn()}))
describe('MissionIncidentConsole',()=>{it('makes human ownership and dual review visible',async()=>{render(<MissionIncidentConsole token="t"/>);expect(await screen.findByText(/L3 · medical/)).toBeTruthy();expect(screen.getByText(/两名独立复核人/)).toBeTruthy();expect(screen.getByText(/人工负责/)).toBeTruthy()})})
