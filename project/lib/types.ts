export interface PlatformStats {
  totalSolved: number;
  todaySolved: number;
  username: string;
  rating?: number;
  rank?: string;
}

export interface LeetCodeStats extends PlatformStats {
  easy: number;
  medium: number;
  hard: number;
  globalRanking?: number;
  contestRating?: number;
  maxContestRating?: number;
  submissionCalendar: Record<string, number>;
}

export interface CodeforcesStats extends PlatformStats {
  maxRating?: number;
  contributions: number;
  submissionCalendar: Record<string, number>;
}

export interface DailyActivity {
  date: string;
  leetcode: number;
  codeforces: number;
  total: number;
}

export interface HeatmapData {
  [date: string]: {
    leetcode: boolean;
    codeforces: boolean;
    count: number;
  };
}
