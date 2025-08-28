import React from 'react';
import EmergencyCall from './EmergencyCall';

const Emergency: React.FC = () => {
  return (
    <div
      style={{
        background: '#fff',
        minHeight: 'calc(100vh - 1.2rem)',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        padding: '0.24rem'
      }}
    >
      <EmergencyCall />
    </div>
  );
};

export default Emergency;