import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp } from 'lucide-react';

const TabNavigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'timesheet', label: 'Timesheet', icon: Calendar },
    { id: 'linkedin', label: 'LinkedIn', icon: TrendingUp }
  ];

  return (
    <div className="mb-6">
      <div className="glass rounded-2xl p-2 flex justify-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2
                ${isActive 
                  ? 'text-white bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/25' 
                  : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                }
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500"
                  initial={false}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <div className="relative z-10 flex items-center gap-2">
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.id === 'timesheet' ? 'Hours' : 'Analytics'}</span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default TabNavigation;