// Simple Grid Dashboard - Placeholder UI
import React from 'react';

const SimpleDashboard = () => {
  return (
    <div 
      className="min-h-screen bg-white" 
      style={{
        backgroundImage: `
          linear-gradient(to right, #000 1px, transparent 1px),
          linear-gradient(to bottom, #000 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px'
      }}
    >
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 bg-white/90 rounded-lg shadow-lg">
          <h1 className="text-4xl font-bold text-black mb-4">Dashboard</h1>
          <p className="text-gray-600 text-lg">UI Coming Soon</p>
          <p className="text-gray-400 text-sm mt-2">Backend APIs are working</p>
        </div>
      </div>
    </div>
  );
};

export default SimpleDashboard;
