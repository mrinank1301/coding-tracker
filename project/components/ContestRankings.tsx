'use client';

import { LeetCodeStats, CodeforcesStats } from '@/lib/types';

interface ContestRankingsProps {
  leetcode: LeetCodeStats | null;
  codeforces: CodeforcesStats | null;
}

// LeetCode Logo
const LeetCodeLogo = () => (
  <svg viewBox="0 0 95 111" className="w-16 h-16" fill="none">
    <path d="M68.0063 83.0664C70.5 80.5764 74.5366 80.5829 77.0223 83.0809C79.508 85.579 79.5015 89.6226 77.0078 92.1127L65.9346 103.17C55.7187 113.371 39.06 113.519 28.6718 103.513C28.6117 103.456 23.9861 98.9201 8.72653 83.957C-1.42528 74.0029 -2.43665 58.0749 7.06439 47.8464L24.0913 30.1672C34.1867 19.3568 51.832 19.1068 62.2 29.4439L73.0734 40.2932C75.5504 42.7698 75.5504 46.8134 73.0734 49.29C70.5965 51.7666 66.5529 51.7666 64.076 49.29L53.2052 38.4434C47.5762 32.8263 38.2181 32.9394 32.7234 38.6572L15.6964 56.3364C10.6193 61.6132 10.9862 70.0771 16.5021 74.8379L27.6754 85.9315C28.2478 86.4865 33.4479 91.5809 33.7164 91.8387C40.0233 97.8097 50.0824 97.7543 56.3189 91.8359L67.9998 80.1928L68.0063 83.0664Z" fill="#FFA116"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M41.1067 72.0014C37.5858 72.0014 34.7314 69.147 34.7314 65.6261C34.7314 62.1052 37.5858 59.2508 41.1067 59.2508H88.1245C91.6454 59.2508 94.4997 62.1052 94.4997 65.6261C94.4997 69.147 91.6454 72.0014 88.1245 72.0014H41.1067Z" fill="#B3B3B3"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M49.9118 2.02335C52.3173 -0.55232 56.3517 -0.686894 58.9273 1.71861C61.503 4.12412 61.6376 8.15849 59.232 10.7342L15.5943 57.7891C13.1887 60.3649 9.15434 60.4994 6.57869 58.0939C4.00303 55.6884 3.86846 51.654 6.27397 49.0783L49.9118 2.02335Z" fill="#FFA116"/>
  </svg>
);

// Get Codeforces rank color and name
function getCodeforcesRank(rating: number | undefined): { name: string; color: string } {
  if (!rating) return { name: 'Unrated', color: 'text-gray-500' };
  if (rating < 1200) return { name: 'Newbie', color: 'text-gray-500' };
  if (rating < 1400) return { name: 'Pupil', color: 'text-green-500' };
  if (rating < 1600) return { name: 'Specialist', color: 'text-cyan-500' };
  if (rating < 1900) return { name: 'Expert', color: 'text-blue-500' };
  if (rating < 2100) return { name: 'Candidate Master', color: 'text-violet-500' };
  if (rating < 2300) return { name: 'Master', color: 'text-amber-500' };
  if (rating < 2400) return { name: 'International Master', color: 'text-orange-500' };
  if (rating < 2600) return { name: 'Grandmaster', color: 'text-red-500' };
  if (rating < 3000) return { name: 'International Grandmaster', color: 'text-red-600' };
  return { name: 'Legendary Grandmaster', color: 'text-red-700' };
}

export function ContestRankings({ leetcode, codeforces }: ContestRankingsProps) {
  const cfRank = getCodeforcesRank(codeforces?.rating);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-xl font-bold text-center text-gray-700 mb-8">Contest Rankings</h2>
      
      <div className="space-y-8">
        {/* LeetCode */}
        <div className="border-b border-gray-100 pb-6">
          <p className="text-center text-gray-500 font-medium text-sm tracking-wider mb-4">LEETCODE</p>
          <div className="flex items-center justify-center gap-6">
            <LeetCodeLogo />
            <div className="text-center">
              <div className="text-5xl font-bold text-gray-800">
                {leetcode?.contestRating || '—'}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                (max : {leetcode?.maxContestRating || '—'})
              </div>
            </div>
          </div>
        </div>

        {/* Codeforces */}
        <div className="pb-2">
          <p className="text-center text-gray-500 font-medium text-sm tracking-wider mb-4">CODEFORCES</p>
          <div className="flex items-center justify-center gap-6">
            <div className="flex flex-col items-center">
              <span className={`text-2xl font-bold capitalize ${cfRank.color}`}>
                {codeforces?.rank || cfRank.name}
              </span>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-gray-800">
                {codeforces?.rating || '—'}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                (max : {codeforces?.maxRating || '—'})
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
