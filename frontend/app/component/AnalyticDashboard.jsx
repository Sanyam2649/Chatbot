// components/AnalyticsDashboard.jsx
"use client";

import { motion } from "framer-motion";
import { BarChart, LineChart, PieChart } from "lucide-react";

export function AnalyticsDashboard() {
  const analyticsData = {
    dailyUsage: [65, 59, 80, 81, 56, 55, 40],
    fileTypes: [
      { type: 'PDF', count: 45, color: '#3B82F6' },
      { type: 'DOCX', count: 28, color: '#10B981' },
      { type: 'PPTX', count: 15, color: '#F59E0B' },
      { type: 'Others', count: 12, color: '#EF4444' }
    ],
    queryTypes: [
      { type: 'Technical', count: 35 },
      { type: 'Creative', count: 28 },
      { type: 'Research', count: 22 },
      { type: 'Other', count: 15 }
    ]
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Usage Chart */}
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <LineChart className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Daily Usage</h3>
              <p className="text-sm text-gray-600">Queries per day</p>
            </div>
          </div>
          <div className="h-48 flex items-end space-x-2">
            {analyticsData.dailyUsage.map((value, index) => (
              <motion.div
                key={index}
                initial={{ height: 0 }}
                animate={{ height: `${value}%` }}
                transition={{ delay: index * 0.1 }}
                className="flex-1 bg-gradient-to-t from-blue-500 to-blue-600 rounded-t-lg"
                style={{ height: `${value}%` }}
              />
            ))}
          </div>
        </motion.div>

        {/* File Types Chart */}
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <PieChart className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">File Types</h3>
              <p className="text-sm text-gray-600">Upload distribution</p>
            </div>
          </div>
          <div className="space-y-3">
            {analyticsData.fileTypes.map((fileType, index) => (
              <div key={fileType.type} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: fileType.color }}
                  />
                  <span className="text-sm font-medium text-gray-700">{fileType.type}</span>
                </div>
                <span className="text-sm text-gray-600">{fileType.count} files</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Query Types */}
      <motion.div
        whileHover={{ y: -5 }}
        className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <BarChart className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">Query Types</h3>
            <p className="text-sm text-gray-600">Question categorization</p>
          </div>
        </div>
        <div className="space-y-4">
          {analyticsData.queryTypes.map((queryType, index) => (
            <div key={queryType.type} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">{queryType.type}</span>
                <span className="text-gray-600">{queryType.count} queries</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(queryType.count / 100) * 100}%` }}
                  transition={{ delay: index * 0.2 }}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}