import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Users, Award } from 'lucide-react';
import { format, subWeeks } from 'date-fns';

const MetricCard = ({ title, value, previousValue, icon: Icon, color, suffix = '' }) => {
  const change = previousValue ? value - previousValue : 0;
  const changePercent = previousValue ? ((change / previousValue) * 100) : 0;
  const isPositive = change > 0;
  const isNeutral = change === 0;
  
  const TrendIcon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className={`glass rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all`}
    >
      <div className="flex items-center justify-between mb-3">
        <Icon className={`w-5 h-5 text-${color}-400`} />
        <div className={`flex items-center gap-1 text-xs ${
          isPositive ? 'text-emerald-400' : isNeutral ? 'text-gray-400' : 'text-red-400'
        }`}>
          <TrendIcon className="w-3 h-3" />
          {change !== 0 && (
            <span>
              {Math.round(Math.abs(changePercent))}%
            </span>
          )}
        </div>
      </div>
      
      <div className="space-y-1">
        <div className={`text-2xl font-bold text-${color}-400`}>
          {value}{suffix}
        </div>
        <div className="text-xs text-gray-500">{title}</div>
        {previousValue !== null && (
          <div className="text-xs text-gray-600">
            {isPositive ? '+' : ''}{Math.round(change * 10) / 10}{suffix} from last week
          </div>
        )}
      </div>
    </motion.div>
  );
};

const MetricsDashboard = ({ currentData, previousData, weekInfo }) => {
  const metrics = useMemo(() => {
    if (!currentData) return [];
    
    return [
      {
        title: 'Followers',
        value: currentData.followerCount || 0,
        previousValue: previousData?.followerCount || null,
        icon: Users,
        color: 'blue',
        suffix: ''
      },
      {
        title: 'Total SSI',
        value: currentData.ssi?.total || 0,
        previousValue: previousData?.ssi?.total || null,
        icon: Award,
        color: 'purple',
        suffix: '/100'
      },
      {
        title: 'Professional Brand',
        value: currentData.ssi?.establishBrand || 0,
        previousValue: previousData?.ssi?.establishBrand || null,
        icon: Award,
        color: 'purple',
        suffix: '/25'
      },
      {
        title: 'Find People',
        value: currentData.ssi?.findPeople || 0,
        previousValue: previousData?.ssi?.findPeople || null,
        icon: Award,
        color: 'blue',
        suffix: '/25'
      },
      {
        title: 'Engage Insights',
        value: currentData.ssi?.engageInsights || 0,
        previousValue: previousData?.ssi?.engageInsights || null,
        icon: Award,
        color: 'emerald',
        suffix: '/25'
      },
      {
        title: 'Build Relationships',
        value: currentData.ssi?.buildRelationships || 0,
        previousValue: previousData?.ssi?.buildRelationships || null,
        icon: Award,
        color: 'orange',
        suffix: '/25'
      }
    ];
  }, [currentData, previousData]);

  if (!currentData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-8 text-center"
      >
        <div className="text-gray-400 mb-4">
          <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium">No Data Yet</h3>
          <p className="text-sm mt-2">
            Add LinkedIn metrics for Week {weekInfo.weekNumber} to see your analytics dashboard
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <MetricCard {...metric} />
          </motion.div>
        ))}
      </div>

      {/* Summary */}
      {previousData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass rounded-xl p-6"
        >
          <h4 className="text-md font-semibold text-white mb-3">Week-over-Week Summary</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Follower Growth:</span>
              <span className={`ml-2 font-medium ${
                (currentData.followerCount || 0) > (previousData.followerCount || 0) 
                  ? 'text-emerald-400' 
                  : 'text-red-400'
              }`}>
                {(currentData.followerCount || 0) - (previousData.followerCount || 0) > 0 ? '+' : ''}
                {Math.round((currentData.followerCount || 0) - (previousData.followerCount || 0))} followers
              </span>
            </div>
            <div>
              <span className="text-gray-400">SSI Improvement:</span>
              <span className={`ml-2 font-medium ${
                (currentData.ssi?.total || 0) > (previousData.ssi?.total || 0) 
                  ? 'text-emerald-400' 
                  : 'text-red-400'
              }`}>
                {(currentData.ssi?.total || 0) - (previousData.ssi?.total || 0) > 0 ? '+' : ''}
                {Math.round((currentData.ssi?.total || 0) - (previousData.ssi?.total || 0))} points
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default MetricsDashboard;