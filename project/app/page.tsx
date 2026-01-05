'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heatmap } from '@/components/Heatmap';
import { ContestRankings } from '@/components/ContestRankings';
import { ProblemStats } from '@/components/ProblemStats';
import { ConsistencyGraph } from '@/components/ConsistencyGraph';
import { 
  fetchLeetCodeStats, 
  fetchCodeforcesStats, 
  generateHeatmapData 
} from '@/lib/api';
import { LeetCodeStats, CodeforcesStats, HeatmapData } from '@/lib/types';

// Calculate streak (consecutive days with BOTH LeetCode AND Codeforces)
function calculateStreak(heatmapData: HeatmapData): { current: number; max: number } {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];
  
  // Get all dates sorted in descending order (most recent first)
  const sortedDates = Object.keys(heatmapData)
    .filter(date => date.startsWith('2026-'))
    .sort()
    .reverse();
  
  let currentStreak = 0;
  let maxStreak = 0;
  let tempStreak = 0;
  let checkingCurrent = true;
  
  // For current streak, start from today and go backwards
  for (let i = 0; i < sortedDates.length; i++) {
    const dateStr = sortedDates[i];
    const dayData = heatmapData[dateStr];
    const bothPlatforms = dayData.leetcode && dayData.codeforces;
    
    // For current streak calculation
    if (checkingCurrent) {
      // Skip future dates
      if (dateStr > todayStr) continue;
      
      // Check if this is today or consecutive from last checked date
      if (i === 0 || dateStr === todayStr) {
        if (bothPlatforms) {
          currentStreak++;
        } else if (dateStr === todayStr) {
          // Today doesn't count, check if yesterday continues the streak
          continue;
        } else {
          checkingCurrent = false;
        }
      } else {
        // Check if consecutive
        const prevDate = new Date(sortedDates[i - 1]);
        const currDate = new Date(dateStr);
        const diffDays = Math.round((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1 && bothPlatforms) {
          currentStreak++;
        } else {
          checkingCurrent = false;
        }
      }
    }
  }
  
  // Calculate max streak by going through all dates in order
  const sortedAsc = [...sortedDates].reverse();
  for (let i = 0; i < sortedAsc.length; i++) {
    const dateStr = sortedAsc[i];
    const dayData = heatmapData[dateStr];
    const bothPlatforms = dayData.leetcode && dayData.codeforces;
    
    if (bothPlatforms) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(sortedAsc[i - 1]);
        const currDate = new Date(dateStr);
        const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      maxStreak = Math.max(maxStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }
  
  return { current: currentStreak, max: maxStreak };
}

// Hardcoded usernames - personalized for you
const LEETCODE_USERNAME = 'mrinank_kavuri';
const CODEFORCES_USERNAME = 'omenyx';

// Custom hook for initial data fetch
function useInitialFetch() {
  const [leetcodeStats, setLeetcodeStats] = useState<LeetCodeStats | null>(null);
  const [codeforcesStats, setCodeforcesStats] = useState<CodeforcesStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [initialFetchDone, setInitialFetchDone] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const [lcStats, cfStats] = await Promise.all([
        fetchLeetCodeStats(LEETCODE_USERNAME),
        fetchCodeforcesStats(CODEFORCES_USERNAME)
      ]);
      
      if (lcStats) setLeetcodeStats(lcStats);
      if (cfStats) setCodeforcesStats(cfStats);
      
      if (!lcStats && !cfStats) {
        setError('Failed to fetch data from both platforms');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data');
    }
    
    setLoading(false);
    setInitialFetchDone(true);
  };

  // Trigger initial fetch on first render
  if (!initialFetchDone && !loading) {
    fetchAllData();
  }

  return { leetcodeStats, codeforcesStats, loading, error, fetchAllData };
}

export default function Home() {
  const { leetcodeStats, codeforcesStats, loading, error, fetchAllData } = useInitialFetch();

  // Generate heatmap data (memoized based on stats)
  const heatmapData = useMemo(() => {
    return generateHeatmapData(leetcodeStats, codeforcesStats);
  }, [leetcodeStats, codeforcesStats]);

  // Calculate streak (memoized)
  const streak = useMemo(() => {
    return calculateStreak(heatmapData);
  }, [heatmapData]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="text-center mb-8">
          {/* Title with Streak */}
          <div className="flex items-center justify-center gap-4 mb-3">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              Coding Tracker
            </h1>
            {/* Streak Badge - LeetCode style */}
            <div className="flex items-center gap-0.5" title={`Current: ${streak.current} days | Best: ${streak.max} days`}>
              <span className="text-2xl">🔥</span>
              <span className="text-xl font-bold text-orange-500">{streak.current}</span>
            </div>
          </div>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Tracking progress across LeetCode and Codeforces
            <span className="text-sm text-gray-400 ml-2">(Best: 🏆 {streak.max})</span>
          </p>
          
          {/* Refresh Button */}
          <div className="mt-6">
            <Button 
              onClick={fetchAllData}
              disabled={loading}
              variant="outline"
              className="border-gray-300 hover:bg-gray-100"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  Refresh Stats
                </>
              )}
            </Button>
          </div>
          
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </header>

        {/* Problem Stats - LeetCode, Codeforces, Combined */}
        <div className="mb-6">
          <ProblemStats 
            leetcode={leetcodeStats} 
            codeforces={codeforcesStats} 
          />
        </div>

        {/* Contest Rankings + Consistency Graph */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Contest Rankings */}
          <ContestRankings 
            leetcode={leetcodeStats} 
            codeforces={codeforcesStats} 
          />

          {/* Consistency Graph */}
          <ConsistencyGraph 
            leetcode={leetcodeStats} 
            codeforces={codeforcesStats} 
          />
        </div>

        {/* Heatmap Section - Now at Bottom */}
        <Card className="bg-white border border-gray-200 shadow-sm mb-8">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h8V3a1 1 0 112 0v1h1a2 2 0 012 2v11a2 2 0 01-2 2H3a2 2 0 01-2-2V6a2 2 0 012-2h1V3a1 1 0 011-1zm11 4H4v10h12V6z" clipRule="evenodd" />
              </svg>
              Activity Heatmap
              <span className="text-sm font-normal text-gray-500 ml-2">2026</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <Heatmap data={heatmapData} />
          </CardContent>
        </Card>

        {/* Footer */}
        <footer className="text-center text-sm text-gray-500 border-t border-gray-200 pt-8">
          <p>
            Made By Mrinank Kavuri
          </p>
        </footer>
      </div>
    </div>
  );
}
