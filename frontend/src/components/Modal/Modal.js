import React, { useEffect } from "react";
import { X } from "lucide-react";
import "./Modal.css";

/**
 * Modal reutilizável.
 * @param {boolean}  isOpen   — controla visibilidade
 * @param {string}   title    — título do cabeçalho
 * @param {Function} onClose  — callback para fechar
 * @param {ReactNode} children — conteúdo (body + footer)
 */
const Modal = ({ isOpen, title, onClose, children }) => {
  // Fecha ao pressionar Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-card" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
