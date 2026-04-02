  const calculateWeeklyStats = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    });

    const weekData = last7Days.map(date => {
      const dayData = trackerData.filter(entry => entry.date === date);
      const dayTotal = dayData.reduce((sum, entry) => sum + entry.value, 0);
      return { date, value: dayTotal, goalMet: dayTotal >= dailyGoal };
    });

    const daysGoalMet = weekData.filter(day => day.goalMet).length;
    const averageValue = weekData.reduce((sum, day) => sum + day.value, 0) / 7;
    
    const thisWeekAvg = averageValue;
    const lastWeekData = trackerData.filter(entry => {
      const entryDate = new Date(entry.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 14);
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 7);
      return entryDate >= weekAgo && entryDate < twoWeeksAgo;
    });
    
    const lastWeekAvg = lastWeekData.length > 0 
      ? lastWeekData.reduce((sum, entry) => sum + entry.value, 0) / 7 
      : 0;

    return {
      daysGoalMet,
      totalDays: 7,
      averageValue,
      weeklyChange: thisWeekAvg - lastWeekAvg,
      unit: config.unit
    };
  };

  const weeklyStats = calculateWeeklyStats();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Button */}
      {onBack && (
        <Button
          onClick={onBack}
          variant="outline"
          className="flex items-center gap-2 mb-6 hover:bg-gray-50 transition-colors border-2 border-gray-300 h-12 px-6 font-semibold rounded-xl"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </Button>
      )}
      
      {/* Main Tracker Card */}
      <Card className={`${config.bgColor} ${config.borderColor} border-2 shadow-xl`}>
        <CardHeader className="pb-6 text-center">
          <CardTitle className="flex items-center justify-center gap-3 text-3xl font-bold text-gray-800">
            <span className="text-3xl">{config.emoji}</span>
            <span>{config.name}</span>
          </CardTitle>
          <p className="text-gray-600 text-base mt-2">Track your daily progress and reach your goals</p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 h-14 bg-white/60 rounded-xl border border-gray-200">
              <TabsTrigger value="add" className="flex items-center gap-2 text-base font-semibold h-12 rounded-lg">
                <Plus className="w-5 h-5" />
                Add Entry
              </TabsTrigger>
              <TabsTrigger value="progress" className="flex items-center gap-2 text-base font-semibold h-12 rounded-lg">
                <BarChart3 className="w-5 h-5" />
                Progress
              </TabsTrigger>
              <TabsTrigger value="goal" className="flex items-center gap-2 text-base font-semibold h-12 rounded-lg">
                <Target className="w-5 h-5" />
                Goal
              </TabsTrigger>
            </TabsList>

            <TabsContent value="add" className="space-y-4">
              <BeginnerFriendlyTrackerEntry
                trackerName={trackerName}
                unit={config.unit}
                onSubmit={handleSubmitEntry}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="progress" className="space-y-6">
              <BeginnerFriendlyTrackerSummary
                trackerName={trackerName}
                weeklyStats={weeklyStats}
              />
              
              {trackerData.length > 0 && (
                <Card className="bg-white/70 border-2 border-gray-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
                      <Calendar className="w-6 h-6" />
                      30-Day Progress Chart
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ProgressChart
                      data={trackerData}
                      trackerName={trackerName}
                      unit={config.unit}
                      dailyGoal={dailyGoal}
                    />
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="goal" className="space-y-4">
              <BeginnerFriendlyTrackerGoal
                trackerName={trackerName}
                dailyGoal={dailyGoal}
                unit={config.unit}
                onUpdateGoal={handleUpdateGoal}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};