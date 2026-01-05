import { LeetCodeStats, CodeforcesStats, HeatmapData } from './types';

// Minimum date: Jan 1, 2026 (timestamp)
const MIN_DATE_2026 = new Date(2026, 0, 1).getTime() / 1000;

// LeetCode API - using alfa-leetcode-api
export async function fetchLeetCodeStats(username: string): Promise<LeetCodeStats | null> {
  try {
    // Fetch user profile and contest info
    const [userDataRes, contestRes, calendarRes] = await Promise.all([
      fetch(`https://alfa-leetcode-api.onrender.com/userProfile/${username}`),
      fetch(`https://alfa-leetcode-api.onrender.com/${username}/contest`),
      fetch(`https://alfa-leetcode-api.onrender.com/${username}/calendar`)
    ]);

    if (!userDataRes.ok) return null;
    
    const userData = await userDataRes.json();
    if (userData.errors) return null;

    // Get contest rating
    let contestRating = 0;
    let maxContestRating = 0;
    if (contestRes.ok) {
      const contestData = await contestRes.json();
      contestRating = Math.round(contestData.contestRating || 0);
      // Get max rating from contest history if available
      if (contestData.contestHistory && contestData.contestHistory.length > 0) {
        maxContestRating = Math.round(Math.max(...contestData.contestHistory.map((c: { rating: number }) => c.rating || 0)));
      }
      if (maxContestRating === 0) maxContestRating = contestRating;
    }

    // Get submission calendar
    const submissionCalendar: Record<string, number> = {};
    if (calendarRes.ok) {
      const calendarData = await calendarRes.json();
      // The calendar data might be a string that needs parsing
      let rawCalendar: Record<string, number> = {};
      if (typeof calendarData.submissionCalendar === 'string') {
        try {
          rawCalendar = JSON.parse(calendarData.submissionCalendar);
        } catch {
          rawCalendar = {};
        }
      } else if (calendarData.submissionCalendar) {
        rawCalendar = calendarData.submissionCalendar;
      }
      
      // Filter to only include 2026 and later
      for (const [timestamp, count] of Object.entries(rawCalendar)) {
        if (parseInt(timestamp) >= MIN_DATE_2026) {
          submissionCalendar[timestamp] = count as number;
        }
      }
    }

    // Get today's submissions
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayTimestamp = Math.floor(today.getTime() / 1000).toString();
    const todaySolved = submissionCalendar[todayTimestamp] || 0;

    return {
      username,
      totalSolved: userData.totalSolved || 0,
      todaySolved,
      easy: userData.easySolved || 0,
      medium: userData.mediumSolved || 0,
      hard: userData.hardSolved || 0,
      globalRanking: userData.ranking,
      contestRating,
      maxContestRating,
      submissionCalendar,
    };
  } catch (error) {
    console.error('LeetCode API error:', error);
    return null;
  }
}

// Codeforces API
export async function fetchCodeforcesStats(username: string): Promise<CodeforcesStats | null> {
  try {
    // Fetch user info
    const userResponse = await fetch(`https://codeforces.com/api/user.info?handles=${username}`);
    if (!userResponse.ok) return null;
    
    const userData = await userResponse.json();
    if (userData.status !== 'OK') return null;
    
    const user = userData.result[0];

    // Fetch submissions
    const submissionsResponse = await fetch(
      `https://codeforces.com/api/user.status?handle=${username}&from=1&count=10000`
    );
    
    const submissionCalendar: Record<string, number> = {};
    let totalSolved = 0;
    let todaySolved = 0;
    const solvedProblems = new Set<string>();
    
    if (submissionsResponse.ok) {
      const submissionsData = await submissionsResponse.json();
      if (submissionsData.status === 'OK') {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const todayStart = Math.floor(today.getTime() / 1000);
        const todayEnd = todayStart + 86400;

        for (const submission of submissionsData.result) {
          if (submission.verdict === 'OK') {
            const problemKey = `${submission.problem.contestId}-${submission.problem.index}`;
            
            if (!solvedProblems.has(problemKey)) {
              solvedProblems.add(problemKey);
              totalSolved++;
              
              // Add to calendar (only 2026 and later)
              const date = new Date(submission.creationTimeSeconds * 1000);
              date.setUTCHours(0, 0, 0, 0);
              const dateKey = Math.floor(date.getTime() / 1000).toString();
              
              // Only add if it's 2026 or later
              if (parseInt(dateKey) >= MIN_DATE_2026) {
                submissionCalendar[dateKey] = (submissionCalendar[dateKey] || 0) + 1;
              }
              
              // Check if today
              if (submission.creationTimeSeconds >= todayStart && submission.creationTimeSeconds < todayEnd) {
                todaySolved++;
              }
            }
          }
        }
      }
    }

    return {
      username,
      totalSolved,
      todaySolved,
      rating: user.rating,
      maxRating: user.maxRating,
      rank: user.rank,
      contributions: user.contribution,
      submissionCalendar,
    };
  } catch (error) {
    console.error('Codeforces API error:', error);
    return null;
  }
}

// Generate heatmap data for 2026 only (LeetCode + Codeforces)
export function generateHeatmapData(
  leetcode: LeetCodeStats | null,
  codeforces: CodeforcesStats | null
): HeatmapData {
  const heatmapData: HeatmapData = {};
  
  // Generate all dates for year 2026 (Jan 1 to Dec 31)
  // Use UTC dates to avoid timezone issues
  const startDate = Date.UTC(2026, 0, 1); // Jan 1, 2026 UTC
  const endDate = Date.UTC(2026, 11, 31); // Dec 31, 2026 UTC

  // Initialize all dates for 2026
  let currentTime = startDate;
  while (currentTime <= endDate) {
    const currentDate = new Date(currentTime);
    const dateStr = currentDate.toISOString().split('T')[0];
    // Only add if it's actually 2026
    if (dateStr.startsWith('2026-')) {
      heatmapData[dateStr] = {
        leetcode: false,
        codeforces: false,
        count: 0,
      };
    }
    currentTime += 24 * 60 * 60 * 1000; // Add one day in milliseconds
  }

  // Helper to convert timestamp to date string
  const timestampToDate = (timestamp: string): string => {
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toISOString().split('T')[0];
  };

  // Add LeetCode data (only 2026)
  if (leetcode?.submissionCalendar) {
    for (const [timestamp, count] of Object.entries(leetcode.submissionCalendar)) {
      const dateStr = timestampToDate(timestamp);
      if (dateStr.startsWith('2026-') && heatmapData[dateStr] && count > 0) {
        heatmapData[dateStr].leetcode = true;
        heatmapData[dateStr].count += count;
      }
    }
  }

  // Add Codeforces data (only 2026)
  if (codeforces?.submissionCalendar) {
    for (const [timestamp, count] of Object.entries(codeforces.submissionCalendar)) {
      const dateStr = timestampToDate(timestamp);
      if (dateStr.startsWith('2026-') && heatmapData[dateStr] && count > 0) {
        heatmapData[dateStr].codeforces = true;
        heatmapData[dateStr].count += count;
      }
    }
  }

  return heatmapData;
}
