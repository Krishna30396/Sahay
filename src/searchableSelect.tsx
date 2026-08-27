import { useEffect, useState } from 'react'

export function SearchableSelect({ value, options, onChange, placeholder }: { value: string; options: string[]; onChange: (value: string) => void; placeholder?: string }) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)

  useEffect(() => { setQuery(value) }, [value])

  const filtered = query.trim()
    ? options.filter(option => option.toLowerCase().includes(query.trim().toLowerCase()))
    : options

  const pick = (option: string) => {
    onChange(option)
    setQuery(option)
    setOpen(false)
  }

  return <div className="searchable-select">
    <input
      className="review-field-input"
      value={query}
      placeholder={placeholder}
      onChange={event => { setQuery(event.target.value); setOpen(true) }}
      onFocus={() => setOpen(true)}
      onBlur={() => setTimeout(() => setOpen(false), 120)}
    />
    {open && filtered.length > 0 && <ul className="searchable-select-list">
      {filtered.map(option => <li key={option}>
        <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => pick(option)}>{option}</button>
      </li>)}
    </ul>}
    {open && filtered.length === 0 && <p className="searchable-select-empty">No matching state</p>}
  </div>
}
