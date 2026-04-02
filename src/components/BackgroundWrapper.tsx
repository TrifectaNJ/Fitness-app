import React, { useEffect, useState } from 'react';
import { useDesign } from '@/contexts/DesignContext';

interface BackgroundWrapperProps {
  children: React.ReactNode;
  page: 'homepage' | 'dietPage' | 'programPage' | 'loginPage' | 'profilePage' | 'workoutPage';
  className?: string;
}

const BackgroundWrapper: React.FC<BackgroundWrapperProps> = ({
  children,
  page,
  className = ''
}) => {
  // Use try-catch to handle potential context errors gracefully
  let settings: any = { backgroundImages: {} };
  
  try {
    const designContext = useDesign();
    settings = designContext.settings;
  } catch (error) {
    // If DesignContext is not available, use defaults
    console.warn('DesignContext not available, using defaults');
  }
  
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Force white background for workout pages
  if (page === 'workoutPage') {
    return (
      <div className={`min-h-screen flex-1 bg-white ${className}`}>
        {children}
      </div>
    );
  }
  
  const providedLoginImage = 'https://d64gsuwffb70l.cloudfront.net/683f455091f9cbb716202747_1750134828532_f9c1d4a2.png';
  const backgroundImage = page === 'loginPage' ? providedLoginImage : settings.backgroundImages?.[page];
  
  useEffect(() => {
    if (backgroundImage && !imageError) {
      setImageLoaded(false);
      const img = new Image();
      img.onload = () => setImageLoaded(true);
      img.onerror = () => setImageError(true);
      img.src = backgroundImage;
    } else {
      setImageLoaded(false);
      setImageError(false);
    }
  }, [backgroundImage, page, imageError]);
  
  const shouldShowBackground = backgroundImage && imageLoaded && !imageError;
  
  const style = shouldShowBackground ? {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed'
  } : {};

  return (
    <div 
      className={`min-h-screen bg-white ${className}`}
      style={style}
    >
      {shouldShowBackground && (
        <div className="absolute inset-0 bg-black bg-opacity-30 pointer-events-none" />
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default BackgroundWrapper;
