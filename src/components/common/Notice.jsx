import React from 'react';
import Icon from './Icon';

export default function Notice({ title, message, tone = 'info', children, className = '' }) {
  const iconName =
    tone === 'error' || tone === 'warning' ? 'alert' : tone === 'success' ? 'checkCircle' : 'info';
  const role = tone === 'error' ? 'alert' : 'status';

  return (
    <div className={`notice ${tone} ${className}`} role={role}>
      <Icon name={iconName} />
      <div style={{ flex: 1 }}>
        {title && <strong>{title}</strong>}
        {message && <p>{message}</p>}
        {children}
      </div>
    </div>
  );
}
