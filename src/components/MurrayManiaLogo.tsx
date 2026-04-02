import React from 'react';

interface MurrayManiaLogoProps {
  className?: string;
  size?: number;
}

const MurrayManiaLogo: React.FC<MurrayManiaLogoProps> = ({ 
  className = "", 
  size = 24 
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      className={className}
      fill="currentColor"
    >
      {/* Hexagon background */}
      <polygon 
        points="50,5 85,25 85,75 50,95 15,75 15,25" 
        fill="currentColor"
        opacity="0.1"
        stroke="currentColor"
        strokeWidth="2"
      />
      
      {/* Letter M */}
      <path 
        d="M25 75 L25 25 L35 25 L50 55 L65 25 L75 25 L75 75 L65 75 L65 40 L55 65 L45 65 L35 40 L35 75 Z" 
        fill="currentColor"
      />
    </svg>
  );
};

export { MurrayManiaLogo };
export default MurrayManiaLogo;