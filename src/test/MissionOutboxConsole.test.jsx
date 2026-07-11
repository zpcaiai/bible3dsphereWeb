import { render,screen } from '@testing-library/react'
import { describe,it,expect,vi } from 'vitest'
import MissionOutboxConsole from '../features/mission-os/components/MissionOutboxConsole'
vi.mock('../features/mission-os/api/outbox',()=>({fetchMissionOutbox:vi.fn().mockResolvedValue({items:[{id:'e1',eventType:'MissionTrainingPlanCreated',attempts:8,deadLetter:true,error:'RuntimeError'}]}),replayMissionOutboxEvent:vi.fn()}))
describe('MissionOutboxConsole',()=>{it('shows immutable dead-letter metadata without payload editor',async()=>{render(<MissionOutboxConsole token="t"/>);expect(await screen.findByText('MissionTrainingPlanCreated')).toBeTruthy();expect(screen.getByText('Dead Letter')).toBeTruthy();expect(screen.queryByRole('textbox')).toBeNull()})})
