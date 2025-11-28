import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { getWeek, getYear, format, subWeeks, startOfWeek } from 'date-fns';
import WeekSelector from '../components/WeekSelector';
import LinkedInDataForm from '../components/LinkedInDataForm';
import MetricsDashboard from '../components/MetricsDashboard';
import AnalyticsCharts from '../components/AnalyticsCharts';

const LinkedInAnalytics = ({ 
  linkedInData, 
  onUpdateLinkedInData, 
  loading 
}) => {
  const [selectedWeek, setSelectedWeek] = useState(new Date());

  const weekInfo = useMemo(() => {
    const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
    const weekNumber = getWeek(selectedWeek, { weekStartsOn: 1 });
    const year = getYear(selectedWeek);
    const weekKey = `${year}-${weekNumber}`;
    const dateRange = `${format(weekStart, 'd MMM')} - ${format(new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000), 'd MMM')}`;
    
    return { weekNumber, year, weekKey, dateRange };
  }, [selectedWeek]);

  const currentWeekData = linkedInData[weekInfo.weekKey] || null;
  
  const previousWeekInfo = useMemo(() => {
    const prevWeek = subWeeks(selectedWeek, 1);
    const prevWeekNumber = getWeek(prevWeek, { weekStartsOn: 1 });
    const prevYear = getYear(prevWeek);
    const prevWeekKey = `${prevYear}-${prevWeekNumber}`;
    
    return {
      weekKey: prevWeekKey,
      data: linkedInData[prevWeekKey] || null
    };
  }, [selectedWeek, linkedInData]);

  const handleSaveWeekData = async (data) => {
    const updatedData = {
      ...linkedInData,
      [weekInfo.weekKey]: {
        ...data,
        updatedAt: new Date().toISOString()
      }
    };
    await onUpdateLinkedInData(updatedData);
  };

  const handleClearWeekData = async () => {
    const updatedData = { ...linkedInData };
    delete updatedData[weekInfo.weekKey];
    await onUpdateLinkedInData(updatedData);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4">⟳</div>
          <p className="text-gray-400">Loading LinkedIn analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <WeekSelector 
        selectedWeek={selectedWeek} 
        onWeekChange={setSelectedWeek} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LinkedInDataForm
          weekData={currentWeekData}
          onSave={handleSaveWeekData}
          onClear={handleClearWeekData}
          weekInfo={weekInfo}
        />
        
        <MetricsDashboard
          currentData={currentWeekData}
          previousData={previousWeekInfo.data}
          weekInfo={weekInfo}
        />
      </div>

      <AnalyticsCharts 
        linkedInData={linkedInData}
        currentWeekData={currentWeekData}
      />
    </motion.div>
  );
};

export default LinkedInAnalytics;