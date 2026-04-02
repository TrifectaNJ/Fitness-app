import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const RoutePreserver = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const hasRestoredRoute = useRef(false);

  useEffect(() => {
    // On initial mount, check if we need to restore a route
    if (!hasRestoredRoute.current) {
      const storedRoute = sessionStorage.getItem('lastRoute');
      const currentPath = location.pathname + location.search + location.hash;
      
      // If we have a stored route and we're currently at root, restore the route
      if (storedRoute && storedRoute !== '/' && currentPath === '/') {
        console.log('Restoring route after refresh:', storedRoute);
        hasRestoredRoute.current = true;
        navigate(storedRoute, { replace: true });
        return;
      }
      
      hasRestoredRoute.current = true;
    }
    
    // Store current route for future refreshes
    const currentPath = location.pathname + location.search + location.hash;
    sessionStorage.setItem('lastRoute', currentPath);
    console.log('Route preserved:', currentPath);
  }, [location, navigate]);

  return null;
};

export default RoutePreserver;