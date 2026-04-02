// Simple route preservation utility
export const preserveRoute = () => {
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname + window.location.search + window.location.hash;
    if (currentPath !== '/') {
      sessionStorage.setItem('lastRoute', currentPath);
    }
  }
};

export const getPreservedRoute = () => {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('lastRoute');
  }
  return null;
};

export const clearPreservedRoute = () => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('lastRoute');
  }
};

// Set up route preservation on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', preserveRoute);
}