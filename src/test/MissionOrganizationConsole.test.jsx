import { render,screen } from '@testing-library/react'
import { describe,it,expect,vi } from 'vitest'
import MissionOrganizationConsole from '../features/mission-os/components/MissionOrganizationConsole'
vi.mock('../features/mission-os/api/organizations',()=>({fetchMissionOrganization:vi.fn().mockResolvedValue({organization:{id:'church-1',name:'本地教会',missionKind:'church',legalName:'',countryCode:'CN'},relationships:[]}),saveMissionOrganizationProfile:vi.fn()}))
describe('MissionOrganizationConsole',()=>{it('reuses the existing organization and renders an empty relationship state',async()=>{render(<MissionOrganizationConsole token="t" organizationId="church-1"/>);expect(await screen.findByText('本地教会')).toBeTruthy();expect(screen.getByText('尚无跨组织合作关系')).toBeTruthy();expect(screen.getByText('保存组织画像')).toBeTruthy()})})
