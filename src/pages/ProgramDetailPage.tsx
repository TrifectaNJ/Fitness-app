import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '@/contexts/AppContext';
import RedesignedProgramDetailComplete from '@/components/RedesignedProgramDetailComplete';
import ProgramPlayer from '@/components/ProgramPlayer';
import BackgroundWrapper from '@/components/BackgroundWrapper';
import { FitnessProgram } from '@/types/fitness';
import { Loader2 } from 'lucide-react';

const ProgramDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { programs, loading, refreshPrograms } = useAppContext();
  const [selectedProgram, setSelectedProgram] = useState<FitnessProgram | null>(null);
  const [isPlayingProgram, setIsPlayingProgram] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    const loadProgram = async () => {
      if (id && programs.length > 0) {
        const program = programs.find(p => p.id === id);
        if (program) {
          setSelectedProgram(program);
          setIsInitialLoad(false);
        } else {
          navigate('/404');
        }
      } else if (id && !loading && programs.length === 0 && isInitialLoad) {
        // If no programs loaded yet, try refreshing
        await refreshPrograms();
      }
    };

    loadProgram();
  }, [id, programs, navigate, loading, refreshPrograms, isInitialLoad]);

  const handleBack = () => {
    navigate('/');
  };

  const handleStartProgram = () => {
    if (selectedProgram && selectedProgram.price === 0) {
      setIsPlayingProgram(true);
    }
  };

  if (loading || (isInitialLoad && !selectedProgram)) {
    return (
      <BackgroundWrapper page="programPage">
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </BackgroundWrapper>
    );
  }

  if (!selectedProgram) {
    return null;
  }

  if (isPlayingProgram) {
    return (
      <BackgroundWrapper page="programPage">
        <ProgramPlayer 
          program={selectedProgram}
          onBack={() => setIsPlayingProgram(false)}
        />
      </BackgroundWrapper>
    );
  }

  return (
    <BackgroundWrapper page="programPage">
      <RedesignedProgramDetailComplete
        program={selectedProgram}
        onBack={handleBack}
        onStartProgram={selectedProgram.price === 0 ? handleStartProgram : undefined}
      />
    </BackgroundWrapper>
  );
};

export default ProgramDetailPage;