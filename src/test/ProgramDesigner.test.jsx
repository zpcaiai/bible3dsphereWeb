import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ProgramDesigner from '../components/mission-bridge/ProgramDesigner'
import * as api from '../missionBridgeApi'
vi.mock('../missionBridgeApi',()=>({validateMissionBridgeProgram:vi.fn(),publishMissionBridgeProgram:vi.fn()}))
describe('ProgramDesigner',()=>{it('keeps publish disabled until the required safety-ready definition is complete',()=>{render(<ProgramDesigner token="t"/>);expect(screen.getByText('发布版本').disabled).toBe(true);fireEvent.change(screen.getByLabelText('项目 ID'),{target:{value:'pilot-x'}});expect(api.publishMissionBridgeProgram).not.toHaveBeenCalled()})})
