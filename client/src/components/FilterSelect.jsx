import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import './FilterSelect.css';

/**
 * Custom select — tránh option mặc định của trình duyệt (nền xanh).
 * options: [{ value, label }]
 */
export default function FilterSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Chọn...',
  className = '',
  variant = 'filter', // 'filter' | 'form'
  'aria-label': ariaLabel,
}) {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const rootRef = useRef(null);
  const listId = useId();

  const selected = options.find((o) => String(o.value) === String(value));
  const hasValue = selected != null && String(selected.value) !== '';
  const label = selected?.label || placeholder;

  useEffect(() => {
    if (!open) return undefined;
    if (rootRef.current) {
      const rect = rootRef.current.getBoundingClientRect();
      setDropUp(window.innerHeight - rect.bottom < 240);
    }
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pick = (next) => {
    onChange?.(next);
    setOpen(false);
  };

  return (
    <div
      className={`filter-select filter-select--${variant} ${open ? 'is-open' : ''} ${dropUp ? 'is-drop-up' : ''} ${className}`.trim()}
      ref={rootRef}
    >
      <button
        type="button"
        className="filter-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel || label}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={`filter-select-label ${hasValue ? 'has-value' : ''}`.trim()}>{label}</span>
        <ChevronDown size={16} className="filter-select-chevron" />
      </button>

      {open && (
        <ul
          id={listId}
          className="filter-select-menu"
          role="listbox"
          aria-label={ariaLabel || placeholder}
        >
          {options.map((opt) => {
            const active = String(opt.value) === String(value);
            return (
              <li key={`${opt.value}-${opt.label}`} role="option" aria-selected={active}>
                <button
                  type="button"
                  className={`filter-select-option ${active ? 'is-active' : ''}`}
                  onClick={() => pick(opt.value)}
                >
                  <span>{opt.label}</span>
                  {active && <Check size={14} strokeWidth={2.5} />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
