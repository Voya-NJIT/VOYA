function Modal({ isOpen, onClose, title, message, type = 'info', onConfirm }) {
  if (!isOpen) return null;

  const isConfirm = type === 'confirm';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-footer">
          {isConfirm ? (
            <>
              <button className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={() => {
                onConfirm();
                onClose();
              }}>
                Confirm
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={onClose}>
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Modal;
