import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp } from 'lucide-react';

const TabNavigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'timesheet', label: 'Timesheet', icon: Calendar },
    { id: 'linkedin', label: 'LinkedIn', icon: TrendingUp }
  ];

  return (
    <div className="mb-8">
      <div className="relative bg-gradient-to-r from-slate-800/90 via-slate-700/90 to-slate-800/90 backdrop-blur-xl rounded-3xl p-1.5 border border-white/10 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-pink-500/10 rounded-3xl"></div>
        <div className="relative flex justify-center">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onTabChange(tab.id)}
                className={`
                  relative px-8 py-4 rounded-2xl font-semibold transition-all duration-500 flex items-center gap-3 mx-1
                  ${isActive 
                    ? 'text-white bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 shadow-xl shadow-purple-500/30 ring-2 ring-white/20' 
                    : 'text-gray-300 hover:text-white hover:bg-white/10 hover:shadow-lg hover:shadow-white/5'
                  }
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.15, duration: 0.8 }}
                  />
                )}
                <div className="relative z-10 flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-300'}`} />
                  <span className="hidden sm:inline text-base tracking-wide">{tab.label}</span>
                  <span className="sm:hidden text-base tracking-wide">{tab.id === 'timesheet' ? 'Hours' : 'Analytics'}</span>
                </div>
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full shadow-lg"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TabNavigation;