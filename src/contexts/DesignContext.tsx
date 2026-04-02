import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface BackgroundImageSettings {
  homepage?: string;
  dietPage?: string;
  programPage?: string;
  loginPage?: string;
  profilePage?: string;
}

interface DesignSettings {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  backgroundImages?: BackgroundImageSettings;
}

interface DesignContextType {
  settings: DesignSettings;
  updateSettings: (newSettings: Partial<DesignSettings>) => void;
  updateBackgroundImages: (images: BackgroundImageSettings) => void;
  saveSettings: () => Promise<void>;
  loadSettings: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const defaultSettings: DesignSettings = {
  primaryColor: '#3B82F6',
  secondaryColor: '#8B5CF6',
  backgroundColor: '#FFFFFF', // Force white background for consistency
  textColor: '#1E293B',
  accentColor: '#10B981',
  backgroundImages: {} // Empty background images to force consistency
};

const DesignContext = createContext<DesignContextType | undefined>(undefined);

export const useDesign = () => {
  const context = useContext(DesignContext);
  if (!context) {
    throw new Error('useDesign must be used within a DesignProvider');
  }
  return context;
};

interface DesignProviderProps {
  children: ReactNode;
}

export const DesignProvider: React.FC<DesignProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<DesignSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRowId, setCurrentRowId] = useState<string | null>(null);
  const lastFetchRef = useRef<number>(0);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const initialLoadRef = useRef(false);

  const refreshSettings = async (force = false) => {
    const now = Date.now();
    if (!force && now - lastFetchRef.current < 1000) return;
    if (!mountedRef.current) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      
      const { data, error } = await supabase
        .from('design_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()
        .abortSignal(abortControllerRef.current.signal);
      
      if (!mountedRef.current) return;
      
      if (error && error.code !== 'PGRST116') {
        console.warn('Design settings error (non-critical):', error.message);
        // Don't set error state for non-critical failures - use defaults
        return;
      }
      
      if (data) {
        setCurrentRowId(data.id);
        const loadedSettings = {
          ...defaultSettings,
          ...(data.settings || {}),
          backgroundImages: data.settings?.backgroundImages || data.background_images || {}
        };
        setSettings(loadedSettings);
        lastFetchRef.current = now;
      }
    } catch (err: any) {
      if (!mountedRef.current) return;
      
      // Ignore abort errors
      if (err?.name === 'AbortError') return;
      
      // Handle all errors gracefully
      const message = err?.message?.toLowerCase() || '';
      
      if (message.includes('timeout')) {
        console.warn('Design settings request timed out (non-critical)');
      } else if (message.includes('failed to fetch') || message.includes('network') || message.includes('unable to connect')) {
        console.warn('Network error loading design settings (non-critical)');
      } else {
        console.warn('Design settings error (non-critical):', err?.message || err);
      }
      // Don't set error state - just use default settings
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    
    // Delay initial load to not compete with critical auth requests
    const initialLoadTimeout = setTimeout(() => {
      if (mountedRef.current && !initialLoadRef.current) {
        initialLoadRef.current = true;
        refreshSettings(true);
      }
    }, 200);
    
    // Debounced realtime subscription
    const subscription = supabase
      .channel('design_settings_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'design_settings' },
        () => {
          if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
          }
          refreshTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              refreshSettings(true);
            }
          }, 500);
        }
      )
      .subscribe();

    return () => {
      mountedRef.current = false;
      clearTimeout(initialLoadTimeout);
      subscription.unsubscribe();
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const updateSettings = (newSettings: Partial<DesignSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const updateBackgroundImages = (images: BackgroundImageSettings) => {
    setSettings(prev => ({ 
      ...prev, 
      backgroundImages: images
    }));
  };

  const saveSettings = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let targetRowId = currentRowId;
      if (!targetRowId) {
        const { data: existingRows } = await supabase
          .from('design_settings')
          .select('id')
          .limit(1);
        
        if (existingRows && existingRows.length > 0) {
          targetRowId = existingRows[0].id;
          setCurrentRowId(targetRowId);
        }
      }
      
      const saveData = {
        settings: {
          ...settings,
          backgroundImages: settings.backgroundImages || {}
        },
        background_images: settings.backgroundImages || {},
        updated_at: new Date().toISOString()
      };
      
      if (targetRowId) {
        const { error: updateError } = await supabase
          .from('design_settings')
          .update(saveData)
          .eq('id', targetRowId);
        
        if (updateError) {
          throw updateError;
        }
      } else {
        throw new Error('No design settings row found to update');
      }
      
      await refreshSettings(true);
      
      // Debounced cross-tab sync
      setTimeout(() => {
        localStorage.setItem('forceRefresh', Date.now().toString());
      }, 100);
      
    } catch (err) {
      console.error('Failed to save design settings:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to save settings';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loadSettings = async () => {
    await refreshSettings(true);
  };

  return (
    <DesignContext.Provider value={{
      settings,
      updateSettings,
      updateBackgroundImages,
      saveSettings,
      loadSettings,
      refreshSettings,
      isLoading,
      error
    }}>
      {children}
    </DesignContext.Provider>
  );
};

export type { DesignSettings, BackgroundImageSettings };
