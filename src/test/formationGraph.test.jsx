import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import FormationGraph3D from '../FormationGraph3D'
import { buildFormationGraphScene } from '../formationGraphScene'
import SoulTabs from '../components/SoulTabs'
import {
  fetchFormationSubgraph,
  recordFormationGraphInteraction,
} from '../api'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('personal formation graph API and scene', () => {
  it('requests a bounded focused subgraph with authentication', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ nodes: [], edges: [], focus_node: 'node-a' }),
    })

    await fetchFormationSubgraph('user@example.com', {
      focusNode: 'node-a', depth: 2, maxNodes: 120,
    }, 'session-token')

    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toContain('/sfds/v2/graph/subgraph/user%40example.com')
    expect(url).toContain('focus_node=node-a')
    expect(url).toContain('depth=2')
    expect(url).toContain('max_nodes=120')
    expect(options.headers.Authorization).toBe('Bearer session-token')
  })

  it('records relationship interactions for dynamic edge weights', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ updated: true }),
    })
    await recordFormationGraphInteraction('user-1', 'source', 'target', 'expand', 'token')
    const [, options] = fetchMock.mock.calls[0]
    expect(JSON.parse(options.body)).toEqual({
      user_id: 'user-1',
      source_node_id: 'source',
      target_node_id: 'target',
      interaction_type: 'expand',
    })
  })

  it('uses server coordinates and excludes edges outside the returned node set', () => {
    const scene = buildFormationGraphScene({
      nodes: [
        { id: 'a', node_type: 'Emotion', node_name: '焦虑', position: { x: 1, y: 2, z: 3 } },
        { id: 'b', node_type: 'Behavior', node_name: '逃避', position: { x: 4, y: 5, z: 6 } },
      ],
      edges: [
        { id: 'ab', source: 'a', target: 'b', edge_type: 'LEADS_TO' },
        { id: 'missing', source: 'a', target: 'c', edge_type: 'LEADS_TO' },
      ],
    })
    expect(scene.nodes[0].positionArray).toEqual([1, 2, 3])
    expect(scene.edges.map((edge) => edge.id)).toEqual(['ab'])
  })
})

describe('formation graph navigation', () => {
  it('exposes the top-level formation graph tab', () => {
    const onTabChange = vi.fn()
    render(<SoulTabs activeTab="dashboard" onTabChange={onTabChange} />)
    fireEvent.click(screen.getByText('形成图谱'))
    expect(onTabChange).toHaveBeenCalledWith('graph')
  })

  it('requires login without attempting to render a WebGL canvas', () => {
    const onNeedLogin = vi.fn()
    render(<FormationGraph3D userId="" token="" onNeedLogin={onNeedLogin} />)
    fireEvent.click(screen.getByText('登录'))
    expect(onNeedLogin).toHaveBeenCalledOnce()
    expect(screen.queryByTestId('formation-graph-canvas')).toBeNull()
  })
})
