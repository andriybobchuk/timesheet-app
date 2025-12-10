import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { format, getWeek } from 'date-fns';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800/90 backdrop-blur-sm border border-white/20 rounded-lg p-3 shadow-xl">
        <p className="text-gray-300 text-sm mb-2">{`Week ${label}`}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const FollowerChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="glass rounded-xl p-6 h-64 flex items-center justify-center">
        <p className="text-gray-400">No data available for follower trends</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-6"
    >
      <h4 className="text-lg font-semibold text-white mb-4">Follower Growth Trend</h4>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="followerGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="week" 
              stroke="#9CA3AF" 
              fontSize={12}
              tickFormatter={(value) => `W${value}`}
            />
            <YAxis stroke="#9CA3AF" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="followers"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#followerGradient)"
              name="Followers"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

const SSIChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="glass rounded-xl p-6 h-64 flex items-center justify-center">
        <p className="text-gray-400">No data available for SSI trends</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass rounded-xl p-6"
    >
      <h4 className="text-lg font-semibold text-white mb-4">SSI Components Over Time</h4>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="week" 
              stroke="#9CA3AF" 
              fontSize={12}
              tickFormatter={(value) => `W${value}`}
            />
            <YAxis stroke="#9CA3AF" fontSize={12} domain={[0, 25]} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="establishBrand"
              stroke="#A855F7"
              strokeWidth={2}
              dot={{ fill: '#A855F7', r: 4 }}
              name="Professional Brand"
            />
            <Line
              type="monotone"
              dataKey="findPeople"
              stroke="#06B6D4"
              strokeWidth={2}
              dot={{ fill: '#06B6D4', r: 4 }}
              name="Find People"
            />
            <Line
              type="monotone"
              dataKey="engageInsights"
              stroke="#10B981"
              strokeWidth={2}
              dot={{ fill: '#10B981', r: 4 }}
              name="Engage Insights"
            />
            <Line
              type="monotone"
              dataKey="buildRelationships"
              stroke="#F59E0B"
              strokeWidth={2}
              dot={{ fill: '#F59E0B', r: 4 }}
              name="Build Relationships"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

const TotalSSIChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="glass rounded-xl p-6 h-64 flex items-center justify-center">
        <p className="text-gray-400">No data available for Total SSI trends</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass rounded-xl p-6"
    >
      <h4 className="text-lg font-semibold text-white mb-4">Total SSI Score Over Time</h4>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="week" 
              stroke="#9CA3AF" 
              fontSize={12}
              tickFormatter={(value) => `W${value}`}
            />
            <YAxis stroke="#9CA3AF" fontSize={12} domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <defs>
              <linearGradient id="totalSSIGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#A855F7" />
                <stop offset="50%" stopColor="#EC4899" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
            </defs>
            <Line
              type="monotone"
              dataKey="totalSSI"
              stroke="url(#totalSSIGradient)"
              strokeWidth={3}
              dot={{ fill: '#EC4899', r: 5 }}
              activeDot={{ r: 8 }}
              name="Total SSI"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

const SSIRadarChart = ({ currentData }) => {
  if (!currentData?.ssi) {
    return (
      <div className="glass rounded-xl p-6 h-64 flex items-center justify-center">
        <p className="text-gray-400">No SSI data available</p>
      </div>
    );
  }

  const radarData = [
    {
      metric: 'Professional Brand',
      value: currentData.ssi.establishBrand || 0,
      fullMark: 100,
    },
    {
      metric: 'Find People',
      value: currentData.ssi.findPeople || 0,
      fullMark: 100,
    },
    {
      metric: 'Engage Insights',
      value: currentData.ssi.engageInsights || 0,
      fullMark: 100,
    },
    {
      metric: 'Build Relationships',
      value: currentData.ssi.buildRelationships || 0,
      fullMark: 100,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass rounded-xl p-6"
    >
      <h4 className="text-lg font-semibold text-white mb-4">Current SSI Breakdown</h4>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid stroke="#374151" />
            <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              tickCount={6}
            />
            <Radar
              name="SSI Score"
              dataKey="value"
              stroke="#EC4899"
              fill="url(#ssiGradient)"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <defs>
              <linearGradient id="ssiGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#EC4899" stopOpacity={0.3}/>
                <stop offset="100%" stopColor="#A855F7" stopOpacity={0.3}/>
              </linearGradient>
            </defs>
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

const AnalyticsCharts = ({ linkedInData, currentWeekData }) => {
  const chartData = useMemo(() => {
    if (!linkedInData || Object.keys(linkedInData).length === 0) return [];

    return Object.entries(linkedInData)
      .map(([weekKey, data]) => ({
        week: parseInt(weekKey.split('-')[1]),
        year: parseInt(weekKey.split('-')[0]),
        followers: data.followerCount || 0,
        establishBrand: data.ssi?.establishBrand || 0,
        findPeople: data.ssi?.findPeople || 0,
        engageInsights: data.ssi?.engageInsights || 0,
        buildRelationships: data.ssi?.buildRelationships || 0,
        totalSSI: data.ssi?.total || 0
      }))
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.week - b.week;
      });
  }, [linkedInData]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FollowerChart data={chartData} />
        <SSIChart data={chartData} />
      </div>
      <TotalSSIChart data={chartData} />
    </div>
  );
};

export default AnalyticsCharts;