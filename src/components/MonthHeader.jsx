import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, Banknote, Clock } from 'lucide-react';
import { format } from 'date-fns';

const MonthHeader = ({ currentMonth, onPreviousMonth, onNextMonth, totalHours, monthlyLimit }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-3 mb-3"
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
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
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
        
        <div className="flex gap-3">
          {/* Hours Card */}
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border ${
              totalHours > monthlyLimit 
                ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-400/30'
                : 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border-blue-400/30'
            }`}
          >
            <Clock className="w-3 h-3 text-blue-400" />
            <span className={`text-sm font-bold ${
              totalHours > monthlyLimit ? 'text-red-400' : 'text-blue-400'
            }`}>
              {totalHours}/{monthlyLimit} HRS
            </span>
            {totalHours > monthlyLimit && (
              <span className="text-xs text-red-300 ml-1">EXCEEDED</span>
            )}
          </motion.div>
          
          {/* Money Card */}
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg border bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-400/30"
          >
            <Banknote className="w-3 h-3 text-emerald-400" />
            <span className="text-sm font-bold text-emerald-400">
              {(totalHours * 35).toLocaleString()} PLN
            </span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default MonthHeader;