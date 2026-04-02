import { useEffect, useState } from 'react';

interface VersionInfo {
  version: string;
  buildTime: string;
  hash: string;
}

export const useVersionCheck = () => {
  const [needsUpdate, setNeedsUpdate] = useState(false);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        // Add timestamp to prevent caching of version.json
        const response = await fetch(`/version.json?t=${Date.now()}`);
        const serverVersion: VersionInfo = await response.json();
        
        const localVersion = localStorage.getItem('app_version');
        
        if (!localVersion || localVersion !== serverVersion.version) {
          localStorage.setItem('app_version', serverVersion.version);
          if (localVersion) {
            // Set flag instead of forcing immediate reload
            setNeedsUpdate(true);
            console.log('New version available:', serverVersion.version);
            // Only reload if user has been on the page for more than 10 seconds
            // This prevents reload loops on fresh page loads
            setTimeout(() => {
              if (document.hasFocus()) {
                console.log('Reloading for version update...');
                window.location.reload();
              }
            }, 10000);
          }
        }
      } catch (error) {
        console.warn('Version check failed:', error);
      }
    };

    // Only check version after initial page load is complete
    const initialDelay = setTimeout(() => {
      checkVersion();
      
      // Check version every 5 minutes
      const interval = setInterval(checkVersion, 5 * 60 * 1000);
      
      return () => clearInterval(interval);
    }, 2000); // Wait 2 seconds after component mount
    
    return () => clearTimeout(initialDelay);
  }, []);

  return { needsUpdate };
};