function ConfirmDialog({
  confirmLabel,
  error,
  isLoading,
  isOpen,
  message,
  onCancel,
  onConfirm,
  title,
}) {
  if (!isOpen) return null;

  return (
    <div className="dialog-backdrop" role="presentation">
      <section
        aria-describedby="dialog-message"
        aria-labelledby="dialog-title"
        aria-modal="true"
        className="confirm-dialog"
        role="dialog"
      >
        <span className="dialog-icon">!</span>
        <h2 id="dialog-title">{title}</h2>
        <p id="dialog-message">{message}</p>
        {error && <p className="dialog-error" role="alert">{error}</p>}
        <div className="dialog-actions">
          <button className="secondary-button" disabled={isLoading} onClick={onCancel} type="button">
            Cancelar
          </button>
          <button className="danger-button" disabled={isLoading} onClick={onConfirm} type="button">
            {isLoading ? "Excluindo..." : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

export default ConfirmDialog;
