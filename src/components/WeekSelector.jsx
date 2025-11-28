import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  addWeeks, 
  subWeeks, 
  startOfYear, 
  getWeek,
  getYear,
  isSameWeek
} from 'date-fns';

const WeekSelector = ({ selectedWeek, onWeekChange }) => {
  const weekInfo = useMemo(() => {
    const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 }); // Monday start
    const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });
    const weekNumber = getWeek(selectedWeek, { weekStartsOn: 1 });
    const year = getYear(selectedWeek);
    const monthStart = format(weekStart, 'MMM');
    const monthEnd = format(weekEnd, 'MMM');
    const dateRange = monthStart === monthEnd 
      ? `${format(weekStart, 'd')}-${format(weekEnd, 'd')} ${monthStart}`
      : `${format(weekStart, 'd')} ${monthStart} - ${format(weekEnd, 'd')} ${monthEnd}`;
    
    return { weekStart, weekEnd, weekNumber, year, dateRange };
  }, [selectedWeek]);

  const goToPreviousWeek = () => onWeekChange(subWeeks(selectedWeek, 1));
  const goToNextWeek = () => onWeekChange(addWeeks(selectedWeek, 1));
  const goToCurrentWeek = () => onWeekChange(new Date());

  const isCurrentWeek = isSameWeek(selectedWeek, new Date(), { weekStartsOn: 1 });

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-4 mb-4"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={goToPreviousWeek}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>

          <div className="text-center">
            <div className="flex items-baseline gap-3">
              <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                Week {weekInfo.weekNumber}
              </div>
              <div className="text-base text-gray-400">
                {weekInfo.year}
              </div>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {weekInfo.dateRange}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={goToNextWeek}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>

        <div className="flex gap-3">
          {!isCurrentWeek && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={goToCurrentWeek}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-400/30 text-emerald-400 font-medium transition-all hover:shadow-lg hover:shadow-emerald-500/10 text-sm"
            >
              Current Week
            </motion.button>
          )}

          {isCurrentWeek && (
            <div className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30">
              <span className="text-amber-400 font-medium text-sm">Current Week</span>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.open('https://www.linkedin.com/sales/ssi', '_blank')}
            className="px-3 py-2 rounded-xl bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-400/30 text-blue-400 font-medium transition-all hover:shadow-lg hover:shadow-blue-500/10 flex items-center gap-2 text-sm"
          >
            Check SSI
            <ExternalLink className="w-3 h-3" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default WeekSelector;