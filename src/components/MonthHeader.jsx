import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const MonthHeader = ({ currentMonth, onPreviousMonth, onNextMonth, totalHours }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-4 mb-3"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onPreviousMonth}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
          
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-purple-400" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
              {format(currentMonth, 'MMMM yyyy')}
            </h1>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onNextMonth}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>
        
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-400/30"
        >
          <span className="text-sm text-gray-300">Total Hours:</span>
          <span className="text-2xl font-bold text-emerald-400">{totalHours}</span>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default MonthHeader;