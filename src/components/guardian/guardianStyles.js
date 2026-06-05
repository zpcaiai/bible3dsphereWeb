// Guardian Widget 共享样式（与 App 深色星空风格一致）
export const C = {
  night: '#0b1026',
  panel: 'rgba(20, 26, 53, 0.96)',
  line: 'rgba(42, 51, 88, 0.9)',
  lineSoft: 'rgba(42, 51, 88, 0.45)',
  text: '#e8ecff',
  dim: '#9aa3c7',
  flame: '#ffb347',
  glow: '#ffd9a0',
}

export const S = {
  input: {
    width: '100%', boxSizing: 'border-box', resize: 'none',
    borderRadius: 12, border: `1px solid ${C.line}`,
    background: 'rgba(11,16,38,0.6)', padding: '8px 12px',
    fontSize: 13.5, color: C.text, outline: 'none', fontFamily: 'inherit',
  },
  primaryBtn: {
    borderRadius: 12, border: 'none', background: C.flame,
    color: '#1a1200', padding: '9px 14px', fontSize: 13.5,
    fontWeight: 600, cursor: 'pointer',
  },
  chip: (active) => ({
    borderRadius: 999, border: 'none', cursor: 'pointer',
    padding: '5px 11px', fontSize: 12, whiteSpace: 'nowrap',
    background: active ? C.flame : C.lineSoft,
    color: active ? '#1a1200' : C.dim,
  }),
  card: {
    borderRadius: 12, border: `1px solid ${C.lineSoft}`,
    background: 'rgba(11,16,38,0.45)', padding: 12,
  },
  sectionTitle: { fontSize: 13.5, fontWeight: 600, color: C.text, margin: 0 },
  dimText: { fontSize: 11.5, color: C.dim },
}
