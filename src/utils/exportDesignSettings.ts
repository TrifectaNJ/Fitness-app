import { supabase } from '@/lib/supabase';

/**
 * Export/Publish current design settings to Supabase
 * This utility ensures design settings are properly synced to the database
 */
export async function exportDesignSettingsToSupabase() {
  try {
    console.log('📤 Exporting design settings to Supabase...');
    
    // Default design settings to export
    const designSettings = {
      primaryColor: '#3B82F6',
      secondaryColor: '#8B5CF6',
      backgroundColor: '#FFFFFF',
      textColor: '#1E293B',
      accentColor: '#10B981',
      backgroundImages: {}
    };

    // Check if a row exists
    const { data: existing, error: fetchError } = await supabase
      .from('design_settings')
      .select('id')
      .limit(1)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    const saveData = {
      settings: designSettings,
      background_images: designSettings.backgroundImages,
      updated_at: new Date().toISOString()
    };

    if (existing?.id) {
      // Update existing row
      const { error: updateError } = await supabase
        .from('design_settings')
        .update(saveData)
        .eq('id', existing.id);

      if (updateError) throw updateError;
      
      console.log('✅ Design settings updated successfully!', existing.id);
    } else {
      // Insert new row
      const { error: insertError } = await supabase
        .from('design_settings')
        .insert([saveData]);

      if (insertError) throw insertError;
      
      console.log('✅ Design settings inserted successfully!');
    }

    return { success: true, message: 'Design settings exported to Supabase' };
  } catch (error) {
    console.error('❌ Failed to export design settings:', error);
    return { success: false, error };
  }
}
