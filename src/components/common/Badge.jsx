import React from 'react';

const STATUS_MAP = {
  PLANIFIE: { label: 'Planifié', className: 'planned' },
  EN_COURS: { label: 'En cours', className: 'progress' },
  TERMINE: { label: 'Terminé', className: 'completed' },
  ANNULE: { label: 'Annulé', className: 'cancelled' },
  Planned: { label: 'Planifié', className: 'planned' },
  'In Progress': { label: 'En cours', className: 'progress' },
  Completed: { label: 'Terminé', className: 'completed' },
  Cancelled: { label: 'Annulé', className: 'cancelled' },
  LOW: { label: 'Stock bas', className: 'low' },
  'Low stock': { label: 'Stock bas', className: 'low' },
  OK: { label: 'Disponible', className: 'available' },
  Available: { label: 'Disponible', className: 'available' },
  ADMIN: { label: 'Administrateur', className: 'available' },
  OPERATEUR: { label: 'Opérateur', className: 'progress' },
};

export default function Badge({ status, label, className = '' }) {
  const config = STATUS_MAP[status] || { label: label || status, className: 'warning' };
  const displayText = label || config.label;
  const badgeClass = config.className;

  return (
    <span className={`badge ${badgeClass} ${className}`}>
      <i></i>
      {displayText}
    </span>
  );
}
