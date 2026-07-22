const NODE_COLORS = {
  Emotion: '#ff6b8a',
  EmotionNode: '#ff6b8a',
  Desire: '#f6c453',
  Motive: '#f6c453',
  MotiveNode: '#f6c453',
  Behavior: '#65d1ff',
  BehaviorNode: '#65d1ff',
  Outcome: '#a18cff',
  OutcomeNode: '#a18cff',
  Belief: '#57d68d',
  Principle: '#ffe9a8',
  PrincipleNode: '#ffe9a8',
  PatternMatch: '#ff9f43',
}

export function buildFormationGraphScene(payload) {
  const rawNodes = Array.isArray(payload?.nodes) ? payload.nodes : []
  const nodes = rawNodes.map((node, index) => ({
    ...node,
    positionArray: [
      Number(node.position?.x ?? index * 1.5),
      Number(node.position?.y ?? 0),
      Number(node.position?.z ?? 0),
    ],
    color: NODE_COLORS[node.node_type] || '#d9e2ff',
  }))
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const edges = (Array.isArray(payload?.edges) ? payload.edges : [])
    .map((edge) => ({
      ...edge,
      sourceNode: byId.get(edge.source),
      targetNode: byId.get(edge.target),
    }))
    .filter((edge) => edge.sourceNode && edge.targetNode)
  return { nodes, edges, byId }
}
