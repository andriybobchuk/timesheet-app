import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Briefcase, Save, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const ActivityModal = ({ isOpen, onClose, date, currentData, onSave, activities, maxHours, totalHours, monthlyLimit }) => {
  const [selectedActivity, setSelectedActivity] = useState(currentData?.activity || 'LinkedIn Stuff');
  const [hours, setHours] = useState(currentData?.hours || 2);

  useEffect(() => {
    if (currentData) {
      setSelectedActivity(currentData.activity || 'LinkedIn Stuff');
      setHours(currentData.hours || 2);
    } else {
      setSelectedActivity('LinkedIn Stuff');
      setHours(2);
    }
  }, [currentData]);

  const currentHoursForThisDay = currentData?.hours || 0;
  const hoursAfterSave = totalHours - currentHoursForThisDay + hours;
  const wouldExceedLimit = hoursAfterSave > monthlyLimit;

  const handleSave = () => {
    if (hours > 0 && wouldExceedLimit && hours > currentHoursForThisDay) {
      return; // Don't save if it would exceed limit (but allow saving 0 hours)
    }
    onSave(date, { activity: selectedActivity, hours });
    onClose();
  };

  const handleClear = () => {
    onSave(date, { activity: 'LinkedIn Stuff', hours: 0 });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md glass rounded-2xl p-6 shadow-2xl"
        >
          <div className="absolute inset-0 gradient-mesh opacity-30 rounded-2xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {format(date, 'EEEE, MMMM d')}
              </h3>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Briefcase className="w-4 h-4 text-purple-400" />
                  <span className="text-lg font-medium text-gray-300">LinkedIn Stuff</span>
                </div>
                <p className="text-sm text-gray-500">Track your LinkedIn work hours</p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                  <Clock className="w-4 h-4" />
                  Hours Worked
                </label>
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="8"
                    step="0.5"
                    value={hours}
                    onChange={(e) => setHours(parseFloat(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, rgb(168, 85, 247) 0%, rgb(168, 85, 247) ${Math.round((hours / 8) * 100)}%, rgba(255, 255, 255, 0.1) ${Math.round((hours / 8) * 100)}%, rgba(255, 255, 255, 0.1) 100%)`
                    }}
                  />
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-gray-400">0h</span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {hours}h
                    </span>
                    <span className="text-xs text-gray-400">8h</span>
                  </div>
                </div>
                
                {hours > 0 && wouldExceedLimit && hours > currentHoursForThisDay && (
                  <div className="mt-4 p-3 rounded-lg bg-red-500/20 border border-red-400/30">
                    <div className="flex items-center gap-2">
                      <span className="text-red-400 font-semibold">⚠️ Monthly Limit Exceeded</span>
                    </div>
                    <p className="text-sm text-red-300 mt-1">
                      This would put you at {hoursAfterSave}h/{monthlyLimit}h for the month. 
                      The monthly limit is 2 hours per weekday.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleClear}
                  className="flex-1 py-3 px-4 rounded-lg bg-red-500/20 border border-red-400/30 hover:bg-red-500/30 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={hours > 0 && wouldExceedLimit && hours > currentHoursForThisDay}
                  className="flex-1 py-3 px-4 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  Save
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ActivityModal;