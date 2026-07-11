import { render,screen } from '@testing-library/react'
import { beforeEach,describe,expect,it,vi } from 'vitest'
import MissionFeatureSettings from '../features/mission-os/components/MissionFeatureSettings'
import * as api from '../features/mission-os/api/features'
vi.mock('../features/mission-os/api/features',()=>({fetchMissionFeatures:vi.fn(),setMissionFeatureOverride:vi.fn()}))
describe('MissionFeatureSettings',()=>{
  beforeEach(()=>api.fetchMissionFeatures.mockResolvedValue({flags:[{key:'mission_deployment_enabled',description:'Deployment',defaultValue:false,riskLevel:'critical'}],overrides:[]}))
  it('shows fail-closed high-risk flags',async()=>{
    render(<MissionFeatureSettings token="t" />)
    expect(await screen.findByText('mission_deployment_enabled')).toBeTruthy()
    expect(screen.getByText('critical')).toBeTruthy()
    expect(screen.getByText('创建启用覆盖')).toBeTruthy()
  })
})
