import React from 'react';
import './AsAProfessor.css';

function AsAProfessor({ children, content }) {
  return (
    <div className="as-a-professor">
      <div className="professor-header">
        <span className="professor-icon">👨‍🏫</span>
        <span className="professor-label">As a Professor</span>
      </div>
      <div className="professor-content">
        {children || content}
      </div>
    </div>
  );
}

export default AsAProfessor;
