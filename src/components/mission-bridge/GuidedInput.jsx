import { useLang } from '../../i18n/LanguageContext'
import './guidedInput.css'

const SEPARATOR = '；'
const DEFAULT_OPTION_LABEL = '推荐选项（可多选，也可直接输入）'

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
  optionLabel,
  className = '',
  style,
  ...inputProps
}) {
  const { t } = useLang()
  const selected = tokens(value)
  const resolvedLabel = optionLabel
    ? t(optionLabel)
    : t('推荐选项（可多选，也可直接输入）')

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
        <div className="mb-guided-input__options" aria-label={resolvedLabel || DEFAULT_OPTION_LABEL}>
          <small>{resolvedLabel}</small>
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
                  {active ? '✓ ' : '+ '}{t(option.label)}
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
