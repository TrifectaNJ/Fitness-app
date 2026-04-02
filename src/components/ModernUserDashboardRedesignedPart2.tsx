import React from 'react';

export const isTrackableItem = (title: string) => {
  const trackableItems = ['water tracker', 'weight tracker', 'step tracker', 'calorie tracker'];
  return trackableItems.some(item => title.toLowerCase().includes(item.toLowerCase()));
};

export const handleHomePageItemClickLogic = async (
  item: any,
  programs: any[],
  onViewProgram: any,
  onTabChange: any,
  setSelectedTracker: any,
  setShowProgressTracker: any,
  supabase: any
) => {
  if (isTrackableItem(item.title)) {
    setSelectedTracker(item.title);
    setShowProgressTracker(true);
    return;
  }
  
  if (item.coachProgramId) {
    try {
      const { data: coachProgram, error } = await supabase.from('coach_programs').select('*').eq('id', item.coachProgramId).eq('is_active', true).single();
      if (error) return;
      if (coachProgram && onViewProgram) {
        const convertedProgram = {
          id: coachProgram.id, title: coachProgram.title, description: coachProgram.description,
          difficulty: coachProgram.difficulty, duration: coachProgram.duration, category: coachProgram.category,
          imageUrl: coachProgram.image_url, days: coachProgram.days || [], price: 0, isActive: coachProgram.is_active, showOnHomePage: false
        };
        onViewProgram(convertedProgram);
        return;
      }
    } catch (error) {
      return;
    }
  }
  
  if (item.programId) {
    const program = programs.find(p => p.id === item.programId);
    if (program && onViewProgram) {
      onViewProgram(program);
      return;
    }
  }
  
  if (item.link) {
    if (item.link === '/page/programs' || item.link === 'programs') {
      if (onTabChange) onTabChange('programs');
      return;
    }
    if (item.link.startsWith('/program/')) {
      const programId = item.link.replace('/program/', '');
      const program = programs.find(p => p.id === programId);
      if (program && onViewProgram) onViewProgram(program);
      return;
    }
    if (item.link.startsWith('http')) {
      window.open(item.link, '_blank');
      return;
    }
    if (item.link.startsWith('/page/')) {
      const page = item.link.replace('/page/', '');
      if (onTabChange) onTabChange(page);
      return;
    }
  }
};
