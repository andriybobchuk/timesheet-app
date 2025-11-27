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
  startOfToday
} from 'date-fns';
import { Settings, Download, TrendingUp, Cloud, CloudOff, Loader2 } from 'lucide-react';
import DayCard from './components/DayCard';
import ActivityModal from './components/ActivityModal';
import MonthHeader from './components/MonthHeader';
import { isHoliday } from './utils/holidays';
import { useFirestore } from './hooks/useFirestore';

function App() {
  const [currentMonth, setCurrentMonth] = useState(startOfToday());
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [useCloud, setUseCloud] = useState(() => {
    const saved = localStorage.getItem('useCloud');
    return saved ? JSON.parse(saved) : false;
  });
  
  const { 
    timeData: cloudTimeData, 
    config: cloudConfig, 
    loading: cloudLoading, 
    error: cloudError,
    updateTimeData: updateCloudTimeData,
    updateConfig: updateCloudConfig
  } = useFirestore();

  const [localTimeData, setLocalTimeData] = useState(() => {
    const saved = localStorage.getItem('timesheetData');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [localConfig, setLocalConfig] = useState(() => {
    const saved = localStorage.getItem('timesheetConfig');
    return saved ? JSON.parse(saved) : {
      activities: ['LinkedIn Stuff', 'Paid Vacation'],
      maxHours: 12
    };
  });

  const timeData = useCloud ? cloudTimeData : localTimeData;
  const config = useCloud ? cloudConfig : localConfig;
  const setTimeData = useCloud ? updateCloudTimeData : setLocalTimeData;
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
    localStorage.setItem('useCloud', JSON.stringify(useCloud));
  }, [useCloud]);

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const totalHours = useMemo(() => {
    const monthKey = format(currentMonth, 'yyyy-MM');
    return Object.entries(timeData)
      .filter(([key]) => key.startsWith(monthKey))
      .reduce((sum, [, data]) => sum + (data.hours || 0), 0);
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
      
      <div className="relative z-10 container mx-auto px-4 py-6 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6"
        >
          <div className="glass rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="text-sm font-medium text-gray-300">Timesheet Pro</span>
              </div>
              <div className="flex gap-2 items-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setUseCloud(!useCloud)}
                  className={`p-2 rounded-lg transition-all ${
                    useCloud ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-gray-400'
                  }`}
                  title={useCloud ? 'Using Cloud Storage' : 'Using Local Storage'}
                >
                  {useCloud ? <Cloud className="w-4 h-4" /> : <CloudOff className="w-4 h-4" />}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={exportData}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  title="Export CSV"
                >
                  <Download className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
            {cloudError && useCloud && (
              <div className="mt-2 text-xs text-red-400">
                Cloud sync error: {cloudError}
              </div>
            )}
          </div>
        </motion.div>

        <MonthHeader
          currentMonth={currentMonth}
          onPreviousMonth={() => setCurrentMonth(prev => subMonths(prev, 1))}
          onNextMonth={() => setCurrentMonth(prev => addMonths(prev, 1))}
          totalHours={totalHours}
        />

        <motion.div 
          className="glass rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {days.map((day, index) => {
              const key = format(day, 'yyyy-MM-dd');
              const dayData = timeData[key] || {};
              const holiday = isHoliday(day);
              
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.01 }}
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 glass rounded-2xl p-6"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400"></div>
                <span className="text-sm text-gray-400">Weekend</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-400 to-pink-400"></div>
                <span className="text-sm text-gray-400">Holiday</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-400"></div>
                <span className="text-sm text-gray-400">Today</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <div className="text-sm text-gray-400">
                Average: <span className="text-emerald-400 font-bold">
                  {days.length > 0 ? (totalHours / days.length).toFixed(1) : 0}h/day
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <ActivityModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        date={selectedDate || new Date()}
        currentData={selectedDate ? timeData[format(selectedDate, 'yyyy-MM-dd')] : null}
        onSave={handleSaveActivity}
        activities={config.activities}
        maxHours={config.maxHours}
      />
    </div>
  );
}

export default App;