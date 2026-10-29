// UPDATED: accessible confirmation dialog (native <dialog>: focus trap, Esc to cancel, aria-labelledby).
import React, { useEffect, useRef } from "react";

export default function ConfirmDialog({ open, title, text, confirmLabel, cancelLabel, busy, onConfirm, onCancel }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className="vx-dialog vx-confirm"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-text"
      onCancel={(e) => {
        e.preventDefault(); // keep React state in charge of closing
        if (!busy) onCancel();
      }}
    >
      <div className="vx-confirm-icon" aria-hidden="true"><i className="fa fa-trash-o" /></div>
      <h2 id="confirm-title" className="vx-title-sm">{title}</h2>
      <p id="confirm-text" className="vx-muted">{text}</p>
      <div className="vx-dialog-actions">
        {/* autoFocus on the safe choice, as recommended for destructive confirmations */}
        <button type="button" className="vx-btn vx-btn--soft" autoFocus disabled={busy} onClick={onCancel}>{cancelLabel}</button>
        <button type="button" className="vx-btn vx-btn--danger" disabled={busy} onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </dialog>
  );
}
