'use client';

import { Card, CardContent } from '@/components/ui/card';
import { LeetCodeStats, CodeforcesStats } from '@/lib/types';

interface ProblemStatsProps {
  leetcode: LeetCodeStats | null;
  codeforces: CodeforcesStats | null;
}

export function ProblemStats({ leetcode, codeforces }: ProblemStatsProps) {
  const lcTotal = leetcode?.totalSolved || 0;
  const cfTotal = codeforces?.totalSolved || 0;
  const combined = lcTotal + cfTotal;

  const lcToday = leetcode?.todaySolved || 0;
  const cfToday = codeforces?.todaySolved || 0;
  const todayTotal = lcToday + cfToday;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* LeetCode Stats */}
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 shadow-sm overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 95 111" className="w-8 h-8" fill="none">
                <path d="M68.0063 83.0664C70.5 80.5764 74.5366 80.5829 77.0223 83.0809C79.508 85.579 79.5015 89.6226 77.0078 92.1127L65.9346 103.17C55.7187 113.371 39.06 113.519 28.6718 103.513C28.6117 103.456 23.9861 98.9201 8.72653 83.957C-1.42528 74.0029 -2.43665 58.0749 7.06439 47.8464L24.0913 30.1672C34.1867 19.3568 51.832 19.1068 62.2 29.4439L73.0734 40.2932C75.5504 42.7698 75.5504 46.8134 73.0734 49.29C70.5965 51.7666 66.5529 51.7666 64.076 49.29L53.2052 38.4434C47.5762 32.8263 38.2181 32.9394 32.7234 38.6572L15.6964 56.3364C10.6193 61.6132 10.9862 70.0771 16.5021 74.8379L27.6754 85.9315C28.2478 86.4865 33.4479 91.5809 33.7164 91.8387C40.0233 97.8097 50.0824 97.7543 56.3189 91.8359L67.9998 80.1928L68.0063 83.0664Z" fill="#FFA116"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M41.1067 72.0014C37.5858 72.0014 34.7314 69.147 34.7314 65.6261C34.7314 62.1052 37.5858 59.2508 41.1067 59.2508H88.1245C91.6454 59.2508 94.4997 62.1052 94.4997 65.6261C94.4997 69.147 91.6454 72.0014 88.1245 72.0014H41.1067Z" fill="#B3B3B3"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M49.9118 2.02335C52.3173 -0.55232 56.3517 -0.686894 58.9273 1.71861C61.503 4.12412 61.6376 8.15849 59.232 10.7342L15.5943 57.7891C13.1887 60.3649 9.15434 60.4994 6.57869 58.0939C4.00303 55.6884 3.86846 51.654 6.27397 49.0783L49.9118 2.02335Z" fill="#FFA116"/>
              </svg>
              <span className="font-semibold text-amber-800">LeetCode</span>
            </div>
            <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
              +{lcToday} today
            </span>
          </div>
          <div className="text-4xl font-bold text-amber-700 mb-2">{lcTotal}</div>
          <div className="text-sm text-amber-600">problems solved</div>
          
          {leetcode && (
            <div className="mt-3 pt-3 border-t border-amber-200 flex gap-3 text-xs">
              <span className="text-green-600">Easy: {leetcode.easy}</span>
              <span className="text-amber-600">Med: {leetcode.medium}</span>
              <span className="text-red-600">Hard: {leetcode.hard}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Codeforces Stats */}
      <Card className="bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-200 shadow-sm overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor">
                <path d="M4.5 7.5C5.328 7.5 6 8.172 6 9v10.5c0 .828-.672 1.5-1.5 1.5h-3C.672 21 0 20.328 0 19.5V9c0-.828.672-1.5 1.5-1.5h3zm9-4.5c.828 0 1.5.672 1.5 1.5v15c0 .828-.672 1.5-1.5 1.5h-3c-.828 0-1.5-.672-1.5-1.5v-15c0-.828.672-1.5 1.5-1.5h3zm9 7.5c.828 0 1.5.672 1.5 1.5v7.5c0 .828-.672 1.5-1.5 1.5h-3c-.828 0-1.5-.672-1.5-1.5V12c0-.828.672-1.5 1.5-1.5h3z" fill="#3B82F6"/>
              </svg>
              <span className="font-semibold text-blue-800">Codeforces</span>
            </div>
            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
              +{cfToday} today
            </span>
          </div>
          <div className="text-4xl font-bold text-blue-700 mb-2">{cfTotal}</div>
          <div className="text-sm text-blue-600">problems solved</div>
          
          {codeforces && codeforces.rank && (
            <div className="mt-3 pt-3 border-t border-blue-200 text-xs text-blue-600">
              <span className="capitalize">{codeforces.rank}</span>
              {codeforces.rating && <span> • Rating: {codeforces.rating}</span>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Combined Stats */}
      <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 shadow-sm overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
              <span className="font-semibold text-emerald-800">Combined</span>
            </div>
            <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
              +{todayTotal} today
            </span>
          </div>
          <div className="text-4xl font-bold text-emerald-700 mb-2">{combined}</div>
          <div className="text-sm text-emerald-600">total problems</div>
          
          <div className="mt-3 pt-3 border-t border-emerald-200 flex gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-gray-600">{lcTotal} LC</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-gray-600">{cfTotal} CF</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

