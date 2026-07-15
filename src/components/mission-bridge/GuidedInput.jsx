import './guidedInput.css'

const SEPARATOR = '；'

function tokens(value) {
  return String(value || '').split(SEPARATOR).map((item) => item.trim()).filter(Boolean)
}

function normalizeOption(option) {
  return typeof option === 'string' ? { value: option, label: option } : option
}

export default function GuidedInput({
  options = [],
  value = '',
  onChange,
  multiline = false,
  optionLabel = '推荐选项（可多选，也可直接输入）',
  className = '',
  style,
  ...inputProps
}) {
  const selected = tokens(value)

  function toggle(option) {
    const exists = selected.includes(option)
    const next = exists ? selected.filter((item) => item !== option) : [...selected, option]
    const nextValue = next.join(SEPARATOR)
    if (inputProps.maxLength && nextValue.length > inputProps.maxLength) return
    onChange(nextValue)
  }

  const Control = multiline ? 'textarea' : 'input'

  return (
    <div className={`mb-guided-input ${className}`.trim()}>
      {options.length > 0 && (
        <div className="mb-guided-input__options" aria-label={optionLabel}>
          <small>{optionLabel}</small>
          <div>
            {options.map((rawOption) => {
              const option = normalizeOption(rawOption)
              const active = selected.includes(option.value)
              return (
                <button
                  key={option.value}
                  type="button"
                  className={active ? 'active' : ''}
                  aria-pressed={active}
                  onClick={() => toggle(option.value)}
                >
                  {active ? '✓ ' : '+ '}{option.label}
                </button>
              )
            })}
          </div>
        </div>
      )}
      <Control
        {...inputProps}
        className={inputProps.className || ''}
        style={style}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}
