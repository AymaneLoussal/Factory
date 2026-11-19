import React, { useEffect } from 'react';
import Icon from './Icon';

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  iconName = 'info',
  isDanger = false,
  actions,
  maxWidth = 480,
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card" style={{ maxWidth }} onClick={(e) => e.stopPropagation()}>
        {iconName && (
          <div className={`modal-icon ${isDanger ? 'danger' : ''}`}>
            <Icon name={iconName} size={24} />
          </div>
        )}
        {title && <h2>{title}</h2>}
        {subtitle && <p className="muted">{subtitle}</p>}
        {children}
        {actions && <div className="actions">{actions}</div>}
      </div>
    </div>
  );
}
