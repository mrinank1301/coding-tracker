import { LeetCodeStats, CodeforcesStats, HeatmapData } from './types';

// Minimum date: Jan 1, 2026 (timestamp)
const MIN_DATE_2026 = new Date(2026, 0, 1).getTime() / 1000;

// Cache duration in milliseconds (10 minutes)
const CACHE_DURATION = 10 * 60 * 1000;

// Cache helpers
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

function getCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const entry: CacheEntry<T> = JSON.parse(cached);
    const now = Date.now();
    
    // Check if cache is still valid
    if (now - entry.timestamp < CACHE_DURATION) {
      return entry.data;
    }
    return null;
  } catch {
    return null;
  }
}

function setCache<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // localStorage might be full or disabled
  }
}

// Get cached data even if expired (for fallback on API errors)
function getCacheFallback<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const entry: CacheEntry<T> = JSON.parse(cached);
    return entry.data;
  } catch {
    return null;
  }
}

// LeetCode GraphQL API - proxied through Next.js API route to avoid CORS
const LEETCODE_API_PROXY = '/api/leetcode';

// GraphQL query to get user profile, solved stats, and calendar
const USER_PROFILE_QUERY = `
  query getUserProfile($username: String!) {
    matchedUser(username: $username) {
      username
      profile {
        ranking
      }
      submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
        }
      }
    }
  }
`;

const USER_CONTEST_QUERY = `
  query userContestRankingInfo($username: String!) {
    userContestRanking(username: $username) {
      rating
      globalRanking
    }
    userContestRankingHistory(username: $username) {
      rating
    }
  }
`;

const USER_CALENDAR_QUERY = `
  query userProfileCalendar($username: String!, $year: Int) {
    matchedUser(username: $username) {
      userCalendar(year: $year) {
        submissionCalendar
      }
    }
  }
`;

async function leetCodeGraphQL<T>(query: string, variables: Record<string, unknown>): Promise<T | null> {
  const response = await fetch(LEETCODE_API_PROXY, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      console.warn('LeetCode API rate limited (429)');
    }
    return null;
  }

  const data = await response.json();
  if (data.errors) {
    console.error('LeetCode GraphQL errors:', data.errors);
    return null;
  }

  return data.data as T;
}

export async function fetchLeetCodeStats(username: string): Promise<LeetCodeStats | null> {
  const cacheKey = `leetcode_stats_${username}`;
  
  // Check cache first
  const cached = getCache<LeetCodeStats>(cacheKey);
  if (cached) {
    console.log('Using cached LeetCode data');
    return cached;
  }

  try {
    // Fetch all data in parallel using LeetCode's GraphQL API
    const [profileData, contestData, calendarData] = await Promise.all([
      leetCodeGraphQL<{
        matchedUser: {
          username: string;
          profile: { ranking: number };
          submitStatsGlobal: {
            acSubmissionNum: Array<{ difficulty: string; count: number }>;
          };
        };
      }>(USER_PROFILE_QUERY, { username }),
      leetCodeGraphQL<{
        userContestRanking: { rating: number; globalRanking: number } | null;
        userContestRankingHistory: Array<{ rating: number }>;
      }>(USER_CONTEST_QUERY, { username }),
      leetCodeGraphQL<{
        matchedUser: {
          userCalendar: { submissionCalendar: string };
        };
      }>(USER_CALENDAR_QUERY, { username, year: 2026 }),
    ]);

    // If profile fetch failed, return cached data
    if (!profileData?.matchedUser) {
      return getCacheFallback<LeetCodeStats>(cacheKey);
    }

    const user = profileData.matchedUser;
    
    // Parse solved counts by difficulty
    let totalSolved = 0;
    let easy = 0;
    let medium = 0;
    let hard = 0;
    
    for (const stat of user.submitStatsGlobal?.acSubmissionNum || []) {
      if (stat.difficulty === 'All') totalSolved = stat.count;
      else if (stat.difficulty === 'Easy') easy = stat.count;
      else if (stat.difficulty === 'Medium') medium = stat.count;
      else if (stat.difficulty === 'Hard') hard = stat.count;
    }

    // Get contest rating
    let contestRating = 0;
    let maxContestRating = 0;
    if (contestData?.userContestRanking) {
      contestRating = Math.round(contestData.userContestRanking.rating || 0);
    }
    if (contestData?.userContestRankingHistory && contestData.userContestRankingHistory.length > 0) {
      maxContestRating = Math.round(
        Math.max(...contestData.userContestRankingHistory.map(c => c.rating || 0))
      );
    }
    if (maxContestRating === 0) maxContestRating = contestRating;

    // Parse submission calendar
    const submissionCalendar: Record<string, number> = {};
    if (calendarData?.matchedUser?.userCalendar?.submissionCalendar) {
      try {
        const rawCalendar = JSON.parse(calendarData.matchedUser.userCalendar.submissionCalendar);
        // Filter to only include 2026 and later
        for (const [timestamp, count] of Object.entries(rawCalendar)) {
          if (parseInt(timestamp) >= MIN_DATE_2026) {
            submissionCalendar[timestamp] = count as number;
          }
        }
      } catch {
        // Calendar parsing failed
      }
    }

    // Get today's submissions
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayTimestamp = Math.floor(today.getTime() / 1000).toString();
    const todaySolved = submissionCalendar[todayTimestamp] || 0;

    const result: LeetCodeStats = {
      username,
      totalSolved,
      todaySolved,
      easy,
      medium,
      hard,
      globalRanking: user.profile?.ranking,
      contestRating,
      maxContestRating,
      submissionCalendar,
    };

    // Cache the successful result
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('LeetCode API error:', error);
    // Return cached data on error
    return getCacheFallback<LeetCodeStats>(cacheKey);
  }
}

// Codeforces API
export async function fetchCodeforcesStats(username: string): Promise<CodeforcesStats | null> {
  const cacheKey = `codeforces_stats_${username}`;
  
  // Check cache first
  const cached = getCache<CodeforcesStats>(cacheKey);
  if (cached) {
    console.log('Using cached Codeforces data');
    return cached;
  }

  try {
    // Fetch user info
    const userResponse = await fetch(`https://codeforces.com/api/user.info?handles=${username}`);
    
    // Handle rate limiting
    if (userResponse.status === 429) {
      console.warn('Codeforces API rate limited (429), using cached data');
      return getCacheFallback<CodeforcesStats>(cacheKey);
    }
    
    if (!userResponse.ok) return getCacheFallback<CodeforcesStats>(cacheKey);
    
    const userData = await userResponse.json();
    if (userData.status !== 'OK') return getCacheFallback<CodeforcesStats>(cacheKey);
    
    const user = userData.result[0];

    // Fetch submissions
    const submissionsResponse = await fetch(
      `https://codeforces.com/api/user.status?handle=${username}&from=1&count=10000`
    );
    
    // Handle rate limiting on submissions endpoint
    if (submissionsResponse.status === 429) {
      console.warn('Codeforces submissions API rate limited (429), using cached data');
      return getCacheFallback<CodeforcesStats>(cacheKey);
    }
    
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

    const result: CodeforcesStats = {
      username,
      totalSolved,
      todaySolved,
      rating: user.rating,
      maxRating: user.maxRating,
      rank: user.rank,
      contributions: user.contribution,
      submissionCalendar,
    };

    // Cache the successful result
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Codeforces API error:', error);
    // Return cached data on error
    return getCacheFallback<CodeforcesStats>(cacheKey);
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
