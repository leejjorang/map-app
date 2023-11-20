const Modal = ({ open, children, onClose, position }) => {
  if (!open) return null;

  const style = {
    top: `${position.top}px`,
    left: `${position.left}px`,
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={style}
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;