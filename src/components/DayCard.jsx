import React from 'react';
import { motion } from 'framer-motion';
import { format, isWeekend, isSameDay, startOfToday } from 'date-fns';
import { Calendar, Coffee, Sparkles } from 'lucide-react';

const DayCard = ({ date, holiday, hours, activity, onUpdate, isSelected }) => {
  const isWeekendDay = isWeekend(date);
  const isToday = isSameDay(date, startOfToday());
  const dayNumber = format(date, 'd');
  const dayName = format(date, 'EEE');
  
  const getBgClass = () => {
    if (holiday) return 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-400/30';
    if (isWeekendDay) return 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-400/20';
    if (isToday) return 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-400/30';
    return 'bg-white/5 border-white/10';
  };

  const getIcon = () => {
    if (holiday) return <Sparkles className="w-3 h-3" />;
    if (isWeekendDay) return <Coffee className="w-3 h-3" />;
    if (isToday) return <Calendar className="w-3 h-3" />;
    return null;
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative p-1 sm:p-2 rounded-lg sm:rounded-xl border backdrop-blur-lg cursor-pointer aspect-square
        transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10
        ${getBgClass()}
        ${isSelected ? 'ring-1 sm:ring-2 ring-purple-400 shadow-lg shadow-purple-500/20' : ''}
      `}
      onClick={() => onUpdate(date)}
    >
      <div className="flex flex-col items-center justify-center h-full">
        {/* Mobile: Simple layout */}
        <div className="sm:hidden flex flex-col items-center justify-center h-full">
          <div className="text-sm font-bold bg-gradient-to-br from-white to-gray-300 bg-clip-text text-transparent">
            {dayNumber}
          </div>
          {hours > 0 && (
            <div className="text-[8px] font-bold text-emerald-300 mt-0.5">{hours}h</div>
          )}
          {holiday && (
            <div className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-purple-400"></div>
          )}
        </div>
        
        {/* Desktop: Full layout */}
        <div className="hidden sm:flex flex-col items-center justify-center h-full space-y-1">
          <div className="flex items-center gap-1">
            {getIcon()}
            <span className="text-xs font-medium text-gray-400">{dayName}</span>
          </div>
          
          <div className="text-2xl font-bold bg-gradient-to-br from-white to-gray-300 bg-clip-text text-transparent">
            {dayNumber}
          </div>
          
          {holiday && (
            <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
              <span className="text-[10px] font-semibold text-white">Holiday</span>
            </div>
          )}
          
          {hours > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="mt-1 px-2 py-1 rounded-lg bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-400/30"
            >
              <span className="text-xs font-bold text-emerald-300">{hours}h</span>
            </motion.div>
          )}
          
          {activity && (
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full bg-gradient-to-r from-violet-400 to-purple-400 animate-pulse"></div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default DayCard;