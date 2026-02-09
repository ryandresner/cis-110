import React from 'react';
import './ProTip.css';

function ProTip({ children, type = 'tip', content }) {
  const icons = {
    tip: '💡',
    warning: '⚠️',
    info: 'ℹ️',
    success: '✅',
    note: '📝',
    professor: '👨‍🏫'
  };

  const icon = icons[type] || icons.tip;

  return (
    <div className={`protip protip-${type}`}>
      <span className="protip-icon">{icon}</span>
      <div className="protip-content">
        {children || content}
      </div>
    </div>
  );
}

export default ProTip;
