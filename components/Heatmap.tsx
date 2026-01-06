'use client';

import { useState, useEffect } from 'react';
import { HeatmapData } from '@/lib/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface HeatmapProps {
  data: HeatmapData;
}

// Hook to detect mobile screen
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < breakpoint);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
}

// Get color based on which platforms were used
function getColor(day: { leetcode: boolean; codeforces: boolean; count: number }): string {
  const { leetcode, codeforces, count } = day;
  const platformCount = [leetcode, codeforces].filter(Boolean).length;
  
  if (count === 0 || platformCount === 0) {
    return 'bg-gray-100 border border-gray-200';
  }

  // Intensity based on count (1-5 scale)
  const intensity = Math.min(Math.max(count, 1), 5);
  const opacityClass = intensity === 1 ? 'opacity-50' : intensity === 2 ? 'opacity-65' : intensity === 3 ? 'opacity-80' : intensity === 4 ? 'opacity-90' : 'opacity-100';

  // Single platform colors
  if (platformCount === 1) {
    if (leetcode) return `bg-amber-500 ${opacityClass}`; // Yellow/Orange for LeetCode
    if (codeforces) return `bg-sky-500 ${opacityClass}`; // Blue for Codeforces
  }

  // Both platforms
  return `bg-emerald-500 ${opacityClass}`; // Green for LC + CF
}

function getPlatformLabel(day: { leetcode: boolean; codeforces: boolean }): string {
  const platforms = [];
  if (day.leetcode) platforms.push('LeetCode');
  if (day.codeforces) platforms.push('Codeforces');
  return platforms.length > 0 ? platforms.join(' + ') : 'No activity';
}

export function Heatmap({ data }: HeatmapProps) {
  const isMobile = useIsMobile();
  
  // Get current month and next month for mobile filtering
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Sort dates and group by week for 2026 only (filter out any non-2026 dates)
  // On mobile, filter to show only current month and next month
  const sortedDates = Object.keys(data)
    .filter(date => {
      if (!date.startsWith('2026-')) return false;
      if (!isMobile) return true;
      
      // On mobile, show current month + next month only
      const d = new Date(date);
      const month = d.getMonth();
      const year = d.getFullYear();
      
      // Current month or next month
      const isCurrentMonth = month === currentMonth && year === currentYear;
      const isNextMonth = (month === (currentMonth + 1) % 12) && 
        (currentMonth === 11 ? year === currentYear + 1 : year === currentYear);
      
      return isCurrentMonth || isNextMonth;
    })
    .sort();
    
  const allWeeks: string[][] = [];
  
  // Get the starting day offset (0 = Sunday, 1 = Monday, etc.)
  if (sortedDates.length > 0) {
    const firstDate = new Date(sortedDates[0]);
    const dayOfWeek = firstDate.getDay();
    
    // Start with empty cells for alignment
    let currentWeek: string[] = new Array(dayOfWeek).fill('');
    
    for (const date of sortedDates) {
      if (currentWeek.length === 7) {
        allWeeks.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(date);
    }
    
    // Push the last week
    if (currentWeek.length > 0) {
      allWeeks.push(currentWeek);
    }
  }
  
  const weeks = allWeeks;

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Get month labels for the header
  const getMonthPositions = () => {
    const positions: { month: string; col: number }[] = [];
    let lastMonth = -1;
    
    weeks.forEach((week, weekIndex) => {
      for (const date of week) {
        if (date) {
          const parsedDate = new Date(date);
          const month = parsedDate.getMonth();
          if (month !== lastMonth) {
            positions.push({ month: monthLabels[month], col: weekIndex });
            lastMonth = month;
          }
          break;
        }
      }
    });
    
    return positions;
  };

  const monthPositions = getMonthPositions();

  // Get display title based on what's shown
  const getTitle = () => {
    if (!isMobile) return '2026';
    const nextMonth = (currentMonth + 1) % 12;
    return `${monthLabels[currentMonth]} - ${monthLabels[nextMonth]} 2026`;
  };

  return (
    <div className="p-4 flex flex-col items-center">
        {/* Year/Month Title */}
        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">{getTitle()}</h3>
        
        {/* Heatmap container - centered */}
        <div className="inline-block">
        {/* Month labels */}
        <div className="flex mb-2 ml-10">
          <div className="flex" style={{ gap: '2px' }}>
            {weeks.map((_, weekIndex) => {
              const monthLabel = monthPositions.find(m => m.col === weekIndex);
              return (
                <div
                  key={weekIndex}
                  className="w-[14px] text-[10px] text-gray-500 font-medium"
                >
                  {monthLabel?.month || ''}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex">
          {/* Day labels */}
          <div className="flex flex-col mr-2 text-[10px] text-gray-500 font-medium" style={{ gap: '2px' }}>
            {dayLabels.map((day, i) => (
              <div key={day} className="h-[14px] flex items-center justify-end w-10">
                {i % 2 === 1 ? day : ''}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="flex" style={{ gap: '2px' }}>
            <TooltipProvider delayDuration={100}>
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col" style={{ gap: '2px' }}>
                  {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                    const date = week[dayIndex];
                    if (!date) {
                      return (
                        <div
                          key={dayIndex}
                          className="w-[14px] h-[14px]"
                        />
                      );
                    }
                    
                    const dayData = data[date] || { leetcode: false, codeforces: false, count: 0 };
                    const colorClass = getColor(dayData);
                    const d = new Date(date);
                    const formattedDate = d.toLocaleDateString('en-US', { 
                      weekday: 'short',
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    });

                    return (
                      <Tooltip key={dayIndex}>
                        <TooltipTrigger asChild>
                          <div
                            className={`w-[14px] h-[14px] rounded-[3px] cursor-pointer transition-all hover:ring-2 hover:ring-gray-400 ${colorClass}`}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-white border border-gray-200 shadow-lg">
                          <div className="text-sm font-medium text-gray-900">{formattedDate}</div>
                          <div className="text-xs text-gray-600">
                            {getPlatformLabel(dayData)}
                          </div>
                          <div className="text-xs text-gray-600">
                            {dayData.count} problem{dayData.count !== 1 ? 's' : ''}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </TooltipProvider>
          </div>
        </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-6 text-xs text-gray-600">
          <span className="font-medium text-gray-800">Legend:</span>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-[3px] bg-gray-100 border border-gray-200 shrink-0" />
            <span className="whitespace-nowrap">None</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-[3px] bg-amber-500 shrink-0" />
            <span className="whitespace-nowrap">LeetCode</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-[3px] bg-sky-500 shrink-0" />
            <span className="whitespace-nowrap">Codeforces</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-[3px] bg-emerald-500 shrink-0" />
            <span className="whitespace-nowrap">Both</span>
          </div>
        </div>

        {/* Intensity scale */}
        <div className="flex items-center justify-center gap-2 mt-3 text-xs text-gray-600">
          <span>Less</span>
          <div className="flex gap-1">
            {[50, 65, 80, 90, 100].map((opacity) => (
              <div
                key={opacity}
                className="w-3.5 h-3.5 rounded-[3px] bg-emerald-500 shrink-0"
                style={{ opacity: opacity / 100 }}
              />
            ))}
          </div>
          <span>More</span>
        </div>
    </div>
  );
}
