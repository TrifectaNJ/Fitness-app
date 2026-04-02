// Detect if running inside Capacitor native app
export const isCapacitor = (): boolean => {
  return typeof window !== 'undefined' && 
    (window as any).Capacitor !== undefined;
};

export const isNativeIOS = (): boolean => {
  if (!isCapacitor()) return false;
  const capacitor = (window as any).Capacitor;
  return capacitor?.getPlatform?.() === 'ios';
};

export const isNativeAndroid = (): boolean => {
  if (!isCapacitor()) return false;
  const capacitor = (window as any).Capacitor;
  return capacitor?.getPlatform?.() === 'android';
};

export const isNativeApp = (): boolean => {
  return isNativeIOS() || isNativeAndroid();
};
