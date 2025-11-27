import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Briefcase, Save, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const ActivityModal = ({ isOpen, onClose, date, currentData, onSave, activities, maxHours }) => {
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

  const handleSave = () => {
    onSave(date, { activity: selectedActivity, hours });
    onClose();
  };

  const handleClear = () => {
    onSave(date, { activity: '', hours: 0 });
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
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                  <Briefcase className="w-4 h-4" />
                  Activity Type
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {activities.map((activity) => (
                    <motion.button
                      key={activity}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedActivity(activity)}
                      className={`
                        p-3 rounded-lg border transition-all
                        ${selectedActivity === activity
                          ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 border-purple-400'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }
                      `}
                    >
                      <span className="font-medium">{activity}</span>
                    </motion.button>
                  ))}
                </div>
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
                    max={maxHours}
                    step="0.5"
                    value={hours}
                    onChange={(e) => setHours(parseFloat(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, rgb(168, 85, 247) 0%, rgb(168, 85, 247) ${(hours / maxHours) * 100}%, rgba(255, 255, 255, 0.1) ${(hours / maxHours) * 100}%, rgba(255, 255, 255, 0.1) 100%)`
                    }}
                  />
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-gray-400">0h</span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {hours}h
                    </span>
                    <span className="text-xs text-gray-400">{maxHours}h</span>
                  </div>
                </div>
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
                  disabled={!selectedActivity || hours === 0}
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