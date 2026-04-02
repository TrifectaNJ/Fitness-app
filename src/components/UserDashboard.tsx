import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import ProgramCard from './ProgramCard';
import ProgramDetail from './ProgramDetail';
import ProgramPlayer from './ProgramPlayer';
import CalorieCalculator from './CalorieCalculator';
import PersonalPathToSuccess from './PersonalPathToSuccess';
import StyleableComponent from './StyleableComponent';
import { BeginnerFriendlyProgressTracker } from './BeginnerFriendlyProgressTracker';
import { useFitness } from '@/contexts/FitnessContext';
import { useHomePage } from '@/contexts/HomePageContext';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronRight,
  Dumbbell,
  Camera,
  Scale,
  Activity,
  Droplets,
  Calculator,
  Target,
  Heart,
  RefreshCw,
  Home,
  MessageCircle
} from 'lucide-react';
import { ChatTabs } from './ChatTabs';
import { FitnessProgram } from '@/types/fitness';
import { useDesign } from '@/contexts/DesignContext';

interface UserDashboardProps {
  homePageItems: any[];
  onViewProgram?: (program: FitnessProgram) => void;
  isAdmin?: boolean;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ 
  homePageItems, 
  onViewProgram,
  isAdmin = false 
}) => {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedProgram, setSelectedProgram] = useState<FitnessProgram | null>(null);
  const [isPlayingProgram, setIsPlayingProgram] = useState(false);
  const [showProgressTracker, setShowProgressTracker] = useState(false);
  const [selectedTracker, setSelectedTracker] = useState<string>('');
  const { programs, refreshPrograms, loading } = useFitness();
  const { refreshHomePageItems } = useHomePage();
  const { settings } = useDesign();
  const [currentDate] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    refreshPrograms();
    refreshHomePageItems();
  }, []);

  const formatDate = (date: Date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
  };

  const getIcon = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      dumbbell: <Dumbbell className="w-6 h-6" />,
      camera: <Camera className="w-6 h-6" />,
      scale: <Scale className="w-6 h-6" />,
      activity: <Activity className="w-6 h-6" />,
      droplets: <Droplets className="w-6 h-6" />
    };
    return icons[iconName] || <Dumbbell className="w-6 h-6" />;
  };

  const isTrackableItem = (title: string) => {
    const trackableItems = [
      'Water, water and more Water!',
      'weight',
      'step tracker',
      'calorie tracker'
    ];
    return trackableItems.some(item => 
      title.toLowerCase().includes(item.toLowerCase())
    );
  };

  const handleProgramClick = (program: FitnessProgram) => {
    if (program.price === 0) {
      setSelectedProgram(program);
      setIsPlayingProgram(true);
    } else {
      setSelectedProgram(program);
      setIsPlayingProgram(false);
      if (onViewProgram) {
        onViewProgram(program);
      }
    }
  };

  const handleHomePageItemClick = (item: any) => {
    console.log('Homepage item clicked:', item);
    
    // Check if this is a trackable item
    if (isTrackableItem(item.title)) {
      setSelectedTracker(item.title);
      setShowProgressTracker(true);
      return;
    }
    
    if (item.link) {
      console.log('Item has link:', item.link);
      
      // Check if it's a program link
      if (item.link.startsWith('program:')) {
        const programId = item.link.replace('program:', '');
        console.log('Looking for program with ID:', programId);
        
        const program = programs.find(p => p.id === programId);
        console.log('Found program:', program);
        
        if (program && onViewProgram) {
          console.log('Calling onViewProgram with:', program);
          onViewProgram(program);
        } else {
          console.log('Program not found or onViewProgram not available');
        }
      } else if (item.link.startsWith('http')) {
        // External link
        window.open(item.link, '_blank');
      } else {
        // Internal navigation
        navigate(item.link);
      }
    }
  };

  const handleRefresh = async () => {
    await Promise.all([
      refreshPrograms(),
      refreshHomePageItems()
    ]);
  };

  if (showProgressTracker) {
    return (
      <StyleableComponent pageKey="homepage">
        <div className="min-h-screen" style={{ backgroundColor: settings.backgroundColor }}>
          <div className="w-full px-4 py-6 md:container md:mx-auto md:max-w-4xl">
            <BeginnerFriendlyProgressTracker
              trackerName={selectedTracker}
              userId="anonymous"
              onBack={() => setShowProgressTracker(false)}
            />
          </div>
        </div>
      </StyleableComponent>
    );
  }

  const renderHomeContent = () => {
    const homePagePrograms = programs.filter(p => p.isActive && p.showOnHomePage);

    return (
      <div className="space-y-4">
        {homePageItems.sort((a, b) => a.order - b.order).map((item) => (
          <Card 
            key={item.id} 
            className="bg-white border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
            style={item.style}
            onClick={() => handleHomePageItemClick(item)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    {getIcon(item.icon)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-gray-600">{item.description}</p>
                    {isTrackableItem(item.title) && (
                      <p className="text-sm text-blue-600 mt-1">Click to track progress</p>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
              {item.showProgress && (
                <div className="mt-4 space-y-2">
                  <Progress value={0} className="h-2" />
                  <p className="text-sm text-gray-500">{item.progress}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        

      </div>
    );
  };

  return (
    <StyleableComponent pageKey="homepage">
      <div className="min-h-screen" style={{ backgroundColor: settings.backgroundColor }}>
        <div className="w-full px-4 py-6 md:container md:mx-auto md:max-w-4xl">
          <div className="flex items-center justify-end mb-8">
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={loading}>
                <RefreshCw className={`h-4 w-4 cursor-pointer ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-6" style={{ color: settings.textColor }}>My Plan</h2>
            <div className="flex items-center justify-center mb-8">
              <div className="text-center">
                <h3 className="text-xl font-semibold" style={{ color: settings.textColor }}>Today</h3>
                <p className="text-gray-600">{formatDate(currentDate)}</p>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-white border border-gray-200 rounded-lg p-1">
                <TabsTrigger value="home" className="text-xs sm:text-sm"><Home className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />Home</TabsTrigger>
                <TabsTrigger value="personal-path" className="text-xs sm:text-sm"><Heart className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />Diet</TabsTrigger>
                <TabsTrigger value="calculator" className="text-xs sm:text-sm">Calculator</TabsTrigger>
                <TabsTrigger value="programs" className="text-xs sm:text-sm"><Target className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />Programs</TabsTrigger>
                <TabsTrigger value="chat" className="text-xs sm:text-sm">Chat</TabsTrigger>
              </TabsList>

              <div className="mt-8 space-y-4">
                <TabsContent value="home" className="mt-0">{renderHomeContent()}</TabsContent>
                <TabsContent value="personal-path" className="mt-0"><PersonalPathToSuccess /></TabsContent>
                <TabsContent value="calculator" className="mt-0">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Calculator className="w-6 h-6 text-blue-600" />
                      <h3 className="text-xl font-semibold" style={{ color: settings.textColor }}>Calorie Calculator</h3>
                    </div>
                    <CalorieCalculator />
                  </div>
                </TabsContent>
                <TabsContent value="programs" className="mt-0">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Target className="w-6 h-6 text-purple-600" />
                      <h3 className="text-xl font-semibold" style={{ color: settings.textColor }}>Fitness Programs</h3>
                    </div>
                    {loading ? (
                      <div className="text-center py-8">
                        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                        <p className="text-gray-600">Loading programs...</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {programs.filter(p => p.isActive).map((program) => (
                          <div key={program.id} className="transform hover:scale-105 transition-all duration-300">
                            <ProgramCard program={program} onView={() => handleProgramClick(program)} isAdmin={false} />
                          </div>
                        ))}
                        {programs.filter(p => p.isActive).length === 0 && (
                          <div className="col-span-2 text-center py-8">
                            <p className="text-gray-600">No active programs available</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="chat" className="mt-0">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                      <MessageCircle className="w-6 h-6 text-blue-600" />
                      <h3 className="text-xl font-semibold" style={{ color: settings.textColor }}>Chat with Coach</h3>
                    </div>
                    <ChatTabs />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </StyleableComponent>
  );
};

export default UserDashboard;