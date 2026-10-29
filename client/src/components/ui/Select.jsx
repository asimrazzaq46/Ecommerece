// UPDATED: small accessible select (select-only combobox + listbox). The native popup is drawn by the OS/browser
// and cannot be themed, so it showed a bright blue highlight. Keyboard: Arrows, Home/End, Enter/Space, Esc, Tab,
// type-ahead. Values and onChange(value) behave like a native <select>.
import React, { useEffect, useId, useRef, useState } from "react";
import "./Select.css";

export default function Select({ id, value, onChange, options, label, disabled = false, className = "" }) {
  const autoId = useId();
  const baseId = id || `select-${autoId}`;
  const listId = `${baseId}-list`;
  const root = useRef(null);
  const button = useRef(null);
  const [open, setOpen] = useState(false);
  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value));
  const [active, setActive] = useState(selectedIndex);
  const typed = useRef({ text: "", at: 0 });

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (!root.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const enabled = (index) => !options[index]?.disabled;
  const move = (from, step) => {
    let i = from;
    do {
      i = Math.min(options.length - 1, Math.max(0, i + step));
    } while (!enabled(i) && i > 0 && i < options.length - 1);
    return enabled(i) ? i : from;
  };
  const show = () => {
    setActive(selectedIndex);
    setOpen(true);
  };
  const choose = (index) => {
    if (!enabled(index)) return;
    setOpen(false);
    button.current?.focus();
    if (options[index].value !== value) onChange(options[index].value);
  };

  const onKeyDown = (e) => {
    if (disabled) return;
    const key = e.key;
    if (key === "Escape" && open) {
      e.preventDefault();
      setOpen(false);
    } else if (key === "Tab") {
      setOpen(false);
    } else if (key === "ArrowDown" || key === "ArrowUp") {
      e.preventDefault();
      if (!open) show();
      else setActive((i) => move(i, key === "ArrowDown" ? 1 : -1));
    } else if (key === "Home" || key === "End") {
      e.preventDefault();
      if (!open) show();
      setActive(key === "Home" ? 0 : options.length - 1);
    } else if (key === "Enter" || key === " ") {
      e.preventDefault();
      if (open) choose(active);
      else show();
    } else if (key.length === 1 && !e.ctrlKey && !e.metaKey) {
      // type-ahead: jump to the next option starting with the typed text
      const now = Date.now();
      typed.current = { text: (now - typed.current.at < 700 ? typed.current.text : "") + key.toLowerCase(), at: now };
      const hit = options.findIndex((o, i) => enabled(i) && String(o.label).toLowerCase().startsWith(typed.current.text));
      if (hit >= 0) {
        if (!open) show();
        setActive(hit);
      }
    }
  };

  return (
    <div className={`vx-select-wrap ${className}`} ref={root}>
      <button
        type="button"
        id={baseId}
        ref={button}
        role="combobox"
        className="vx-select-trigger"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${baseId}-opt-${active}` : undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
      >
        <span>{options[selectedIndex]?.label}</span>
        <i className="fa fa-angle-down" aria-hidden="true" />
      </button>
      {open && (
        <ul id={listId} role="listbox" className="vx-select-list" aria-label={label}>
          {options.map((option, index) => (
            <li
              key={option.value}
              id={`${baseId}-opt-${index}`}
              role="option"
              aria-selected={option.value === value}
              aria-disabled={option.disabled || undefined}
              className={`${index === active ? "is-active" : ""}${option.value === value ? " is-selected" : ""}`}
              onMouseEnter={() => enabled(index) && setActive(index)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(index)}
            >
              {option.label}
              {option.value === value && <i className="fa fa-check" aria-hidden="true" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
