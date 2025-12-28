import React from "react";

const Modal = ({ title, children, show, onClose, confirm }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      ></div>

      {/* Modal content */}
      <div
        className="
          relative z-50 w-full max-w-lg 
          bg-base-300 rounded-lg shadow-xl 
          flex flex-col max-h-[90vh] overflow-hidden
        "
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-base-200">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            className="btn btn-sm btn-ghost"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body (scrollable) */}
        <div className="p-4 overflow-y-auto">{children}</div>

        {/* Footer (sticky at bottom) */}
        <div className="p-4 border-t border-base-200 flex justify-end gap-2 shrink-0">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button onClick={confirm} className="btn btn-primary">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
