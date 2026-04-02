import React from 'react';

interface ConsistentWorkoutWrapperProps {
  children: React.ReactNode;
}

const ConsistentWorkoutWrapper: React.FC<ConsistentWorkoutWrapperProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-white">
      {children}
    </div>
  );
};

export default ConsistentWorkoutWrapper;