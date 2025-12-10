import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Users, Award, Target, MessageSquare, TrendingUp, Trash2 } from 'lucide-react';

const LinkedInDataForm = ({ weekData, onSave, onClear, weekInfo }) => {
  const [formData, setFormData] = useState({
    followerCount: weekData?.followerCount || '',
    ssi: {
      establishBrand: weekData?.ssi?.establishBrand || '',
      findPeople: weekData?.ssi?.findPeople || '',
      engageInsights: weekData?.ssi?.engageInsights || '',
      buildRelationships: weekData?.ssi?.buildRelationships || '',
      total: weekData?.ssi?.total || ''
    }
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    setFormData({
      followerCount: weekData?.followerCount || '',
      ssi: {
        establishBrand: weekData?.ssi?.establishBrand || '',
        findPeople: weekData?.ssi?.findPeople || '',
        engageInsights: weekData?.ssi?.engageInsights || '',
        buildRelationships: weekData?.ssi?.buildRelationships || '',
        total: weekData?.ssi?.total || ''
      }
    });
  }, [weekData]);

  const validateForm = () => {
    const newErrors = {};

    // Validate follower count
    const followerCount = parseInt(formData.followerCount);
    if (!formData.followerCount || isNaN(followerCount) || followerCount < 0) {
      newErrors.followerCount = 'Please enter a valid follower count (0 or higher)';
    }

    // Validate SSI components (allow decimals)
    const ssiFields = ['establishBrand', 'findPeople', 'engageInsights', 'buildRelationships'];
    ssiFields.forEach(field => {
      const value = parseFloat(formData.ssi[field]);
      if (!formData.ssi[field] || isNaN(value) || value < 0 || value > 25) {
        newErrors[field] = 'Must be between 0 and 25';
      }
    });

    return newErrors;
  };

  const handleSave = () => {
    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return; // Don't save if there are validation errors
    }

    const establishBrand = parseFloat(formData.ssi.establishBrand) || 0;
    const findPeople = parseFloat(formData.ssi.findPeople) || 0;
    const engageInsights = parseFloat(formData.ssi.engageInsights) || 0;
    const buildRelationships = parseFloat(formData.ssi.buildRelationships) || 0;
    const totalSSI = establishBrand + findPeople + engageInsights + buildRelationships;
    
    const cleanData = {
      followerCount: parseInt(formData.followerCount) || 0,
      ssi: {
        establishBrand,
        findPeople,
        engageInsights,
        buildRelationships,
        total: Math.round(totalSSI * 10) / 10 // Round to 1 decimal place
      }
    };
    onSave(cleanData);
  };

  const handleClear = () => {
    setFormData({
      followerCount: '',
      ssi: {
        establishBrand: '',
        findPeople: '',
        engageInsights: '',
        buildRelationships: '',
        total: ''
      }
    });
    setErrors({});
    onClear();
  };

  const isFormValid = () => {
    return formData.followerCount && 
           formData.ssi.establishBrand && 
           formData.ssi.findPeople && 
           formData.ssi.engageInsights && 
           formData.ssi.buildRelationships &&
           Object.keys(errors).length === 0;
  };

  const ssiFields = [
    { key: 'establishBrand', label: 'Establish your professional brand', icon: Award, color: 'from-purple-400 to-pink-400' },
    { key: 'findPeople', label: 'Find the right people', icon: Target, color: 'from-blue-400 to-cyan-400' },
    { key: 'engageInsights', label: 'Engage with insights', icon: MessageSquare, color: 'from-emerald-400 to-teal-400' },
    { key: 'buildRelationships', label: 'Build relationships', icon: TrendingUp, color: 'from-orange-400 to-red-400' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6"
    >
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2">
          LinkedIn Metrics for Week {weekInfo.weekNumber}
        </h3>
        <p className="text-gray-400 text-sm">
          {weekInfo.dateRange} • {weekInfo.year}
        </p>
      </div>

      <div className="space-y-6">
        {/* Follower Count */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
            <Users className="w-4 h-4 text-blue-400" />
            Follower Count
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={formData.followerCount}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, followerCount: e.target.value }));
              if (errors.followerCount) {
                setErrors(prev => ({ ...prev, followerCount: undefined }));
              }
            }}
            placeholder="e.g., 1250"
            className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
              errors.followerCount 
                ? 'border-red-400/50 focus:ring-red-500/50 focus:border-red-500/50' 
                : 'border-white/10 focus:ring-blue-500/50 focus:border-blue-500/50'
            }`}
          />
          {errors.followerCount && (
            <p className="text-red-400 text-xs mt-2">{errors.followerCount}</p>
          )}
        </div>

        {/* SSI Components */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
            <Award className="w-4 h-4 text-purple-400" />
            SSI Components
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ssiFields.map((field) => {
              const Icon = field.icon;
              return (
                <div key={field.key}>
                  <label className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                    <Icon className={`w-3 h-3 bg-gradient-to-r ${field.color} bg-clip-text text-transparent`} />
                    {field.label}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="25"
                    step="0.01"
                    value={formData.ssi[field.key]}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        ssi: { ...prev.ssi, [field.key]: e.target.value }
                      }));
                      if (errors[field.key]) {
                        setErrors(prev => ({ ...prev, [field.key]: undefined }));
                      }
                    }}
                    placeholder="0-25"
                    className={`w-full px-3 py-2 rounded-lg bg-white/5 border text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-all ${
                      errors[field.key] 
                        ? 'border-red-400/50 focus:ring-red-500/50 focus:border-red-500/50' 
                        : 'border-white/10 focus:ring-purple-500/50 focus:border-purple-500/50'
                    }`}
                  />
                  {errors[field.key] && (
                    <p className="text-red-400 text-xs mt-1">{errors[field.key]}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Total SSI - Auto-calculated */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Total SSI Score (Auto-calculated)
          </label>
          <div className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 flex items-center justify-between">
            <span>
              {(
                (parseFloat(formData.ssi.establishBrand) || 0) +
                (parseFloat(formData.ssi.findPeople) || 0) +
                (parseFloat(formData.ssi.engageInsights) || 0) +
                (parseFloat(formData.ssi.buildRelationships) || 0)
              ).toFixed(1)}
            </span>
            <span className="text-xs text-gray-500">/100</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleClear}
            className="flex-1 py-3 px-4 rounded-xl bg-red-500/20 border border-red-400/30 hover:bg-red-500/30 transition-all flex items-center justify-center gap-2 text-red-400"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={!isFormValid()}
            className="flex-2 py-3 px-6 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium"
          >
            <Save className="w-4 h-4" />
            Save Week Data
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default LinkedInDataForm;