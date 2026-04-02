import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface HomePageItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'plan' | 'activity' | 'tracking' | 'text' | 'button' | 'card';
  progress?: string;
  showProgress?: boolean;
  order: number;
  style?: React.CSSProperties;
  link?: string;
  content?: string;
  programId?: string;
  coachProgramId?: string;
}

interface HomePageContextType {
  homePageItems: HomePageItem[];
  updateHomePageItems: (items: HomePageItem[]) => Promise<void>;
  resetToDefaults: () => void;
  items: HomePageItem[];
  saveToDatabase: () => Promise<void>;
  loadFromDatabase: () => Promise<void>;
  refreshHomePageItems: () => Promise<void>;
  isUpdating: boolean;
  error: string | null;
}

const defaultItems: HomePageItem[] = [
  { id: '1', title: 'Start Calisthenics Plan', description: 'Gain muscle & strength', icon: 'dumbbell', type: 'plan', order: 0, content: 'Start Calisthenics Plan' },
  { id: '2', title: 'Snap Your Meal', description: 'Show coach what\'s on your plate', icon: 'camera', type: 'tracking', order: 1, content: 'Snap Your Meal' },
  { id: '3', title: 'Weigh-in', description: 'Regular check-ins', icon: 'scale', type: 'tracking', order: 2, content: 'Weigh-in' }
];

const HomePageContext = createContext<HomePageContextType | undefined>(undefined);

export const useHomePage = () => {
  const context = useContext(HomePageContext);
  if (!context) {
    throw new Error('useHomePage must be used within a HomePageProvider');
  }
  return context;
};

export const useHomePageContext = useHomePage;

interface HomePageProviderProps {
  children: ReactNode;
}

export const HomePageProvider: React.FC<HomePageProviderProps> = ({ children }) => {
  const [homePageItems, setHomePageItems] = useState<HomePageItem[]>(defaultItems);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchRef = useRef<number>(0);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const refreshHomePageItems = async (force = false) => {
    if (isUpdating && !force) return;
    const now = Date.now();
    if (!force && now - lastFetchRef.current < 1000) return;
    
    try {
      setError(null);
      const { data, error } = await supabase.from('homepage_items').select('*').order('order_index', { ascending: true });
      
      if (error) { console.warn('Homepage items error:', error); setError('Failed to load homepage items'); return; }
      
      if (data && data.length > 0) {
        const convertedItems = data.map((item, index) => ({
          id: item.id, title: item.title, description: item.description || '', icon: item.icon || 'dumbbell',
          type: item.type || 'plan', progress: item.progress, showProgress: item.show_progress || false,
          order: item.order_index !== null ? item.order_index : index, link: item.link, content: item.content || item.title,
          programId: item.program_id, coachProgramId: item.coach_program_id
        }));
        setHomePageItems(convertedItems);
        lastFetchRef.current = now;
      }
    } catch (err) { console.warn('Homepage items error:', err); setError('Failed to load homepage items'); }
  };

  useEffect(() => {
    refreshHomePageItems(true);
    const subscription = supabase.channel('homepage_items_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'homepage_items' }, () => {
        if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = setTimeout(() => refreshHomePageItems(true), 500);
      }).subscribe();
    return () => { subscription.unsubscribe(); if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current); };
  }, []);

  const updateHomePageItems = async (items: HomePageItem[]) => {
    setIsUpdating(true); setError(null);
    try {
      setHomePageItems(items);
      await supabase.from('homepage_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      const itemsToInsert = items.map((item, index) => ({
        title: item.title, description: item.description, icon: item.icon, type: item.type,
        progress: item.progress || null, show_progress: item.showProgress || false,
        order_index: item.order !== undefined ? item.order : index, link: item.link || null,
        content: item.content || item.title, program_id: item.programId || null,
        coach_program_id: item.coachProgramId || null, updated_at: new Date().toISOString()
      }));
      const { error } = await supabase.from('homepage_items').insert(itemsToInsert);
      if (error) throw new Error(`Failed to save: ${error.message}`);
      await refreshHomePageItems(true);
      setTimeout(() => localStorage.setItem('forceRefresh', Date.now().toString()), 100);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update items';
      setError(errorMsg); await refreshHomePageItems(true); throw err;
    } finally { setIsUpdating(false); }
  };

  const resetToDefaults = () => setHomePageItems([...defaultItems]);
  const saveToDatabase = async () => await updateHomePageItems(homePageItems);
  const loadFromDatabase = async () => await refreshHomePageItems(true);

  return (
    <HomePageContext.Provider value={{ homePageItems, updateHomePageItems, resetToDefaults, items: homePageItems, saveToDatabase, loadFromDatabase, refreshHomePageItems, isUpdating, error }}>
      {children}
    </HomePageContext.Provider>
  );
};

export type { HomePageItem };
