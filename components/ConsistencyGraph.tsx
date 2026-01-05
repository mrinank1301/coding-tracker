'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar
} from 'recharts';
import { LeetCodeStats, CodeforcesStats } from '@/lib/types';

interface ConsistencyGraphProps {
  leetcode: LeetCodeStats | null;
  codeforces: CodeforcesStats | null;
}

interface DataPoint {
  date: string;
  displayDate: string;
  leetcode: number;
  codeforces: number;
  total: number;
}

type ViewMode = 'days' | 'months';

export function ConsistencyGraph({ leetcode, codeforces }: ConsistencyGraphProps) {
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('days');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate daily data from Jan 1, 2026 to today (strictly 2026 only)
  const dailyData = useMemo(() => {
    const data: DataPoint[] = [];
    
    // Use UTC dates to avoid timezone issues
    const startDate = new Date(Date.UTC(2026, 0, 1)); // Jan 1, 2026 UTC
    
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    
    const currentDate = new Date(startDate);
    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Skip any date not in 2026 (extra safety check)
      if (!dateStr.startsWith('2026-')) {
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        continue;
      }
      
      const timestamp = Math.floor(currentDate.getTime() / 1000).toString();
      const displayDate = new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      let lcCount = 0;
      let cfCount = 0;
      
      if (leetcode?.submissionCalendar) {
        lcCount = leetcode.submissionCalendar[timestamp] || 0;
      }
      
      if (codeforces?.submissionCalendar) {
        cfCount = codeforces.submissionCalendar[timestamp] || 0;
      }
      
      data.push({
        date: dateStr,
        displayDate,
        leetcode: lcCount,
        codeforces: cfCount,
        total: lcCount + cfCount,
      });
      
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
    
    return data;
  }, [leetcode, codeforces]);

  // Generate monthly aggregated data
  const monthlyData = useMemo(() => {
    const monthMap = new Map<string, DataPoint>();
    
    for (const day of dailyData) {
      const date = new Date(day.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const displayDate = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {
          date: monthKey,
          displayDate,
          leetcode: 0,
          codeforces: 0,
          total: 0,
        });
      }
      
      const monthData = monthMap.get(monthKey)!;
      monthData.leetcode += day.leetcode;
      monthData.codeforces += day.codeforces;
      monthData.total += day.total;
    }
    
    return Array.from(monthMap.values());
  }, [dailyData]);

  const chartData = viewMode === 'days' ? dailyData : monthlyData;

  // Calculate tick interval based on data length and view mode
  const tickInterval = useMemo(() => {
    if (viewMode === 'months') return 0; // Show all months
    if (chartData.length <= 7) return 0;
    if (chartData.length <= 30) return Math.floor(chartData.length / 7);
    if (chartData.length <= 90) return Math.floor(chartData.length / 10);
    return Math.floor(chartData.length / 12);
  }, [chartData.length, viewMode]);

  if (!mounted) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm h-full min-h-[340px]">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Consistency</h2>
        <div className="h-64 flex items-center justify-center text-gray-400">
          Loading chart...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm h-full min-h-[340px]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800">Consistency</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">Jan 2026 - Present</span>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as ViewMode)}
            className="text-xs border border-gray-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
          >
            <option value="days">By Days</option>
            <option value="months">By Months</option>
          </select>
        </div>
      </div>
      
      <div style={{ width: '100%', height: 256 }}>
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'days' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorLeetcode" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorCodeforces" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="displayDate" 
                tick={{ fontSize: 10, fill: '#6b7280' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
                interval={tickInterval}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: '#6b7280' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
                allowDecimals={false}
                domain={[0, 'dataMax + 1']}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              />
              <Area
                type="monotone"
                dataKey="leetcode"
                name="LeetCode"
                stroke="#f59e0b"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorLeetcode)"
              />
              <Area
                type="monotone"
                dataKey="codeforces"
                name="Codeforces"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCodeforces)"
              />
            </AreaChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="displayDate" 
                tick={{ fontSize: 10, fill: '#6b7280' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
                interval={0}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: '#6b7280' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
                allowDecimals={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              />
              <Bar
                dataKey="leetcode"
                name="LeetCode"
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="codeforces"
                name="Codeforces"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
