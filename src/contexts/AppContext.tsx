import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from '@/components/ui/use-toast';
import { FitnessProgram } from '@/types/fitness';
import { supabase } from '@/lib/supabase';
import { useUserStatus } from '@/hooks/useUserStatus';

interface AppContextType {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  programs: FitnessProgram[];
  addProgram: (program: Omit<FitnessProgram, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProgram: (id: string, updates: Partial<FitnessProgram>) => Promise<void>;
  deleteProgram: (id: string) => Promise<void>;
  refreshPrograms: () => Promise<void>;
  loading: boolean;
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
  checkAdminStatus: () => Promise<void>;
  forceRefresh: () => void;
  currentUser: { id: string; name: string; email: string } | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [programs, setPrograms] = useState<FitnessProgram[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [initializing, setInitializing] = useState(true);

  // Initialize user status tracking
  useUserStatus(currentUser?.id || null);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  const forceRefresh = () => {
    refreshPrograms();
  };

  const checkAdminStatus = async () => {
    if (adminChecked) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        setCurrentUser(null);
        setAdminChecked(true);
        return;
      }

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('role, first_name, last_name')
        .eq('id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          const { error: insertError } = await supabase
            .from('user_profiles')
            .insert({ 
              id: user.id, 
              role: 'user',
              email: user.email,
              status: 'online',
              last_activity: new Date().toISOString(),
              last_seen: new Date().toISOString()
            });
          
          if (insertError) {
            console.error('Error creating user profile:', insertError);
          }
          setIsAdmin(false);
          setCurrentUser({
            id: user.id,
            name: user.email?.split('@')[0] || 'User',
            email: user.email || ''
          });
          setAdminChecked(true);
          return;
        }
        throw error;
      }

      const adminStatus = profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'coach';
      setIsAdmin(adminStatus);
      
      const userName = profile?.first_name && profile?.last_name 
        ? `${profile.first_name} ${profile.last_name}`
        : user.email?.split('@')[0] || 'User';
      
      setCurrentUser({
        id: user.id,
        name: userName,
        email: user.email || ''
      });
      
      // Ensure user is marked as online
      await supabase
        .from('user_profiles')
        .update({ 
          status: 'online', 
          last_activity: new Date().toISOString(),
          last_seen: new Date().toISOString()
        })
        .eq('id', user.id);
      
      setAdminChecked(true);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
      setCurrentUser(null);
      setAdminChecked(true);
    }
  };

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setAdminChecked(false);
          await checkAdminStatus();
        } else {
          setAdminChecked(true);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAdminChecked(true);
      } finally {
        setInitializing(false);
      }
    };

    initializeAuth();
  }, []);

  // Auth listener setup with user status tracking
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setAdminChecked(false);
        // Force check admin status to update current user
        setTimeout(() => checkAdminStatus(), 100);
      } else if (event === 'SIGNED_OUT') {
        // Update status to offline before clearing state
        if (currentUser?.id) {
          await supabase
            .from('user_profiles')
            .update({ status: 'offline', last_activity: new Date().toISOString() })
            .eq('id', currentUser.id);
        }
        setIsAdmin(false);
        setCurrentUser(null);
        setAdminChecked(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [currentUser]);

  const refreshPrograms = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching programs:', error);
        toast({ title: 'Error loading programs', variant: 'destructive' });
        return;
      }
      
      const formattedPrograms = data?.map(program => ({
        id: program.id,
        title: program.title,
        description: program.description || '',
        price: program.price || 0,
        paymentType: program.payment_type || 'one-time',
        duration: program.duration || '',
        difficulty: program.difficulty || 'beginner',
        category: program.category || '',
        imageUrl: program.image_url,
        videoUrl: program.video_url,
        instructions: program.instructions || [],
        days: program.days || [],
        isActive: program.is_active || false,
        showOnHomePage: program.show_on_homepage || false,
        createdAt: new Date(program.created_at),
        updatedAt: new Date(program.updated_at)
      })) || [];
      
      setPrograms(formattedPrograms);
    } catch (error) {
      console.error('Error refreshing programs:', error);
      toast({ title: 'Error loading programs', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const addProgram = async (programData: Omit<FitnessProgram, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data, error } = await supabase
        .from('programs')
        .insert([{
          title: programData.title,
          description: programData.description,
          price: programData.price,
          payment_type: programData.paymentType,
          duration: programData.duration,
          difficulty: programData.difficulty,
          category: programData.category,
          image_url: programData.imageUrl,
          video_url: programData.videoUrl,
          instructions: programData.instructions,
          days: programData.days,
          is_active: programData.isActive,
          show_on_homepage: programData.showOnHomePage || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating program:', error);
        toast({ title: `Error creating program: ${error.message}`, variant: 'destructive' });
        return;
      }
      
      await refreshPrograms();
      toast({ title: 'Program created successfully!' });
    } catch (error) {
      console.error('Error adding program:', error);
      toast({ title: 'Error creating program', variant: 'destructive' });
    }
  };

  const updateProgram = async (id: string, updates: Partial<FitnessProgram>) => {
    try {
      const dbUpdates: any = {
        updated_at: new Date().toISOString()
      };
      
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.price !== undefined) dbUpdates.price = updates.price;
      if (updates.paymentType !== undefined) dbUpdates.payment_type = updates.paymentType;
      if (updates.duration !== undefined) dbUpdates.duration = updates.duration;
      if (updates.difficulty !== undefined) dbUpdates.difficulty = updates.difficulty;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
      if (updates.videoUrl !== undefined) dbUpdates.video_url = updates.videoUrl;
      if (updates.instructions !== undefined) dbUpdates.instructions = updates.instructions;
      if (updates.days !== undefined) dbUpdates.days = updates.days;
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
      if (updates.showOnHomePage !== undefined) dbUpdates.show_on_homepage = updates.showOnHomePage;
      
      const { error } = await supabase
        .from('programs')
        .update(dbUpdates)
        .eq('id', id);
      
      if (error) {
        console.error('Error updating program:', error);
        toast({ title: `Error updating program: ${error.message}`, variant: 'destructive' });
        return;
      }
      
      await refreshPrograms();
      toast({ title: 'Program updated successfully!' });
    } catch (error) {
      console.error('Error updating program:', error);
      toast({ title: 'Error updating program', variant: 'destructive' });
    }
  };

  const deleteProgram = async (id: string) => {
    try {
      const { error } = await supabase
        .from('programs')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting program:', error);
        toast({ title: `Error deleting program: ${error.message}`, variant: 'destructive' });
        return;
      }
      
      await refreshPrograms();
      toast({ title: 'Program deleted successfully!' });
    } catch (error) {
      console.error('Error deleting program:', error);
      toast({ title: 'Error deleting program', variant: 'destructive' });
    }
  };

  return (
    <AppContext.Provider value={{
      sidebarOpen,
      toggleSidebar,
      programs,
      addProgram,
      updateProgram,
      deleteProgram,
      refreshPrograms,
      loading,
      isAdmin,
      setIsAdmin,
      checkAdminStatus,
      forceRefresh,
      currentUser,
    }}>
      {children}
    </AppContext.Provider>
  );
};