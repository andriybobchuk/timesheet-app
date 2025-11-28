import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  format,
  addMonths,
  subMonths,
  isSameMonth,
  startOfToday,
  startOfWeek,
  endOfWeek,
  getDay,
  isWeekend,
  getWeek
} from 'date-fns';
import { Loader2 } from 'lucide-react';
import DayCard from './components/DayCard';
import ActivityModal from './components/ActivityModal';
import MonthHeader from './components/MonthHeader';
import TabNavigation from './components/TabNavigation';
import LinkedInAnalytics from './pages/LinkedInAnalytics';
import { isHoliday } from './utils/holidays';
import { useFirestore } from './hooks/useFirestore';

function App() {
  const [currentMonth, setCurrentMonth] = useState(startOfToday());
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('activeTab');
    return saved || 'timesheet';
  });
  const [useCloud, setUseCloud] = useState(true);
  
  const { 
    timeData: cloudTimeData, 
    linkedInData: cloudLinkedInData,
    config: cloudConfig, 
    loading: cloudLoading, 
    error: cloudError,
    updateTimeData: updateCloudTimeData,
    updateLinkedInData: updateCloudLinkedInData,
    updateConfig: updateCloudConfig
  } = useFirestore();

  const [localTimeData, setLocalTimeData] = useState(() => {
    const saved = localStorage.getItem('timesheetData');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [localConfig, setLocalConfig] = useState(() => {
    const saved = localStorage.getItem('timesheetConfig');
    return saved ? JSON.parse(saved) : {
      activities: ['LinkedIn Stuff'],
      maxHours: 2
    };
  });

  const timeData = useCloud ? cloudTimeData : localTimeData;
  const linkedInData = cloudLinkedInData; // LinkedIn data only stored in cloud
  const config = useCloud ? cloudConfig : localConfig;
  const setTimeData = useCloud ? updateCloudTimeData : setLocalTimeData;
  const setLinkedInData = updateCloudLinkedInData;
  const setConfig = useCloud ? updateCloudConfig : setLocalConfig;

  useEffect(() => {
    if (!useCloud) {
      localStorage.setItem('timesheetData', JSON.stringify(localTimeData));
    }
  }, [localTimeData, useCloud]);

  useEffect(() => {
    if (!useCloud) {
      localStorage.setItem('timesheetConfig', JSON.stringify(localConfig));
    }
  }, [localConfig, useCloud]);

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);


  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const monthDays = eachDayOfInterval({ start, end });
    
    // Get the first day of the week (Monday = 1, Sunday = 0)
    const firstDayOfMonth = getDay(start);
    // Adjust so Monday is 0, Sunday is 6
    const startPadding = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    
    // Add empty slots for days before month starts
    const paddedDays = [...Array(startPadding).fill(null), ...monthDays];
    
    // Pad to complete the last week
    while (paddedDays.length % 7 !== 0) {
      paddedDays.push(null);
    }
    
    return paddedDays;
  }, [currentMonth]);

  const { totalHours, monthlyLimit } = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const allDaysInMonth = eachDayOfInterval({ start, end });
    
    // Count weekdays (excluding weekends)
    const weekdaysCount = allDaysInMonth.filter(day => !isWeekend(day)).length;
    const monthlyLimit = weekdaysCount * 2; // 2 hours per weekday
    
    const monthKey = format(currentMonth, 'yyyy-MM');
    const totalHours = Object.entries(timeData)
      .filter(([key]) => key.startsWith(monthKey))
      .reduce((sum, [, data]) => sum + (data.hours || 0), 0);
    
    return { totalHours, monthlyLimit };
  }, [timeData, currentMonth]);

  const handleDayClick = (date) => {
    setSelectedDate(date);
    setModalOpen(true);
  };

  const handleSaveActivity = async (date, data) => {
    const key = format(date, 'yyyy-MM-dd');
    let newData;
    
    if (data.hours === 0) {
      newData = { ...timeData };
      delete newData[key];
    } else {
      newData = {
        ...timeData,
        [key]: data
      };
    }
    
    if (useCloud) {
      await setTimeData(newData);
    } else {
      setTimeData(newData);
    }
  };

  const exportData = () => {
    const monthKey = format(currentMonth, 'yyyy-MM');
    const monthData = Object.entries(timeData)
      .filter(([key]) => key.startsWith(monthKey))
      .map(([date, data]) => ({
        date,
        activity: data.activity,
        hours: data.hours
      }));
    
    const csv = [
      ['Date', 'Activity', 'Hours'],
      ...monthData.map(row => [row.date, row.activity, row.hours])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timesheet-${format(currentMonth, 'yyyy-MM')}.csv`;
    a.click();
  };

  if (useCloud && cloudLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading timesheet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 relative overflow-hidden">
      <div className="fixed inset-0 gradient-mesh opacity-40"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-3 max-w-4xl">
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'timesheet' ? (
          <>
            <MonthHeader
          currentMonth={currentMonth}
          onPreviousMonth={() => setCurrentMonth(prev => subMonths(prev, 1))}
          onNextMonth={() => setCurrentMonth(prev => addMonths(prev, 1))}
          totalHours={totalHours}
          monthlyLimit={monthlyLimit}
        />

        <motion.div 
          className="glass rounded-xl p-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Headers */}
          <div className="grid grid-cols-8 gap-2 mb-2">
            <div className="text-center py-1">
              <span className="text-xs font-semibold text-purple-400 uppercase tracking-wide">WK</span>
            </div>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="text-center py-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{day}</span>
              </div>
            ))}
          </div>
          
          {/* Calendar by weeks */}
          {(() => {
            const weeks = [];
            const start = startOfMonth(currentMonth);
            const end = endOfMonth(currentMonth);
            
            // Start from the Monday of the week containing the first day
            let weekStart = startOfWeek(start, { weekStartsOn: 1 });
            
            while (weekStart <= end) {
              const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
              const weekNumber = getWeek(weekStart, { weekStartsOn: 1 });
              const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
              
              weeks.push(
                <div key={weekStart.toISOString()} className="grid grid-cols-8 gap-2 mb-1">
                  {/* Week number */}
                  <div className="flex items-center justify-center">
                    <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-1 rounded">
                      {weekNumber}
                    </span>
                  </div>
                  
                  {/* Week days */}
                  {weekDays.map((day, dayIndex) => {
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    if (!isCurrentMonth) {
                      return <div key={dayIndex} className="aspect-square opacity-30"></div>;
                    }
                    
                    const key = format(day, 'yyyy-MM-dd');
                    const dayData = timeData[key] || {};
                    const holiday = isHoliday(day);
                    
                    return (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: dayIndex * 0.01 }}
                      >
                        <DayCard
                          date={day}
                          holiday={holiday}
                          hours={dayData.hours || 0}
                          activity={dayData.activity}
                          onUpdate={handleDayClick}
                          isSelected={selectedDate && format(selectedDate, 'yyyy-MM-dd') === key}
                        />
                      </motion.div>
                    );
                  })}
                </div>
              );
              
              // Move to next week
              weekStart = new Date(weekStart);
              weekStart.setDate(weekStart.getDate() + 7);
            }
            
            return weeks;
          })()}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-2 glass rounded-xl p-3"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400"></div>
                <span className="text-xs text-gray-400">Hours Filled</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400"></div>
                <span className="text-xs text-gray-400">Weekend</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-400 to-pink-400"></div>
                <span className="text-xs text-gray-400">Holiday</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-400"></div>
                <span className="text-xs text-gray-400">Today</span>
              </div>
            </div>
            
            <div></div>
          </div>
        </motion.div>
          </>
        ) : (
          <LinkedInAnalytics 
            linkedInData={linkedInData}
            onUpdateLinkedInData={setLinkedInData}
            loading={cloudLoading}
          />
        )}
      </div>

      {activeTab === 'timesheet' && (
        <ActivityModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        date={selectedDate || new Date()}
        currentData={selectedDate ? timeData[format(selectedDate, 'yyyy-MM-dd')] : null}
        onSave={handleSaveActivity}
        activities={config.activities}
        maxHours={config.maxHours}
        totalHours={totalHours}
        monthlyLimit={monthlyLimit}
        />
      )}
    </div>
  );
}

export default App;