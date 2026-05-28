import React, { useEffect, useState } from 'react';
import { Trophy, HelpCircle, Server, Award, Sliders, ShieldAlert } from 'lucide-react';
import { LeaderboardItem } from '../types';

export default function LeaderboardPanel() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      if (Array.isArray(data)) {
        setLeaderboard(data);
      }
    } catch (err) {
      console.log('Failed to fetch node rankings', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 shadow-2xl text-left">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-emerald-400" />
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-widest">Network Rankings Leaderboard</h2>
        </div>
        <button
          onClick={fetchLeaderboard}
          className="px-3 py-1 bg-slate-800 text-[10px] text-slate-400 font-mono rounded hover:bg-slate-7050 hover:text-emerald-400 transition"
        >
          {loading ? 'Refreshing...' : 'Pull Ledger'}
        </button>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed mb-4">
        REN Node operators ranked dynamically by validated uptime records, physical resource contribution magnitude (TB/TFLOPS), and verifiable accrued reputation points.
      </p>

      <div className="overflow-x-auto space-y-1">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500 pb-2 text-left">
              <th className="py-2 w-16 text-center">Rank</th>
              <th>Operator Address</th>
              <th className="text-center">Nodes</th>
              <th>Core Focus</th>
              <th className="text-center">Contributions</th>
              <th className="text-center">Reliability</th>
              <th className="text-right">Rewards (REN)</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((operator) => (
              <tr key={operator.address} className="border-b border-slate-800/40 hover:bg-slate-950/40 transition">
                <td className="py-3 text-center">
                  {operator.rank === 1 ? (
                    <span className="inline-block px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-bold text-[10px]">
                      👑 1st
                    </span>
                  ) : operator.rank === 2 ? (
                    <span className="inline-block px-2 py-0.5 rounded bg-slate-400/10 text-slate-300 border border-slate-400/20 font-bold text-[10px]">
                      🥈 2nd
                    </span>
                  ) : operator.rank === 3 ? (
                    <span className="inline-block px-2 py-0.5 rounded bg-amber-600/10 text-amber-500 border border-amber-600/20 font-bold text-[10px]">
                      🥉 3rd
                    </span>
                  ) : (
                    <span className="text-slate-500 font-bold">#{operator.rank}</span>
                  )}
                </td>
                <td className="truncate max-w-[130px] text-slate-300 hover:text-emerald-400 font-mono cursor-pointer transition select-all font-semibold" title={operator.address}>
                  {operator.address}
                </td>
                <td className="text-center font-bold text-slate-300">
                  {operator.nodeCount}
                </td>
                <td className="capitalize">
                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-950 border border-slate-800 text-slate-400 uppercase font-bold">
                    {operator.category}
                  </span>
                </td>
                <td className="text-center text-slate-400">
                  {operator.contributionsGigabytes.toLocaleString()} <span className="text-slate-500 text-[9px]">G-POINTS</span>
                </td>
                <td className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full inline-block shrink-0" />
                    <span className="text-slate-300">{operator.reliabilityPercent}%</span>
                  </div>
                </td>
                <td className="text-right text-emerald-400 font-bold">
                  {Number(operator.rewardsEarned).toFixed(4)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 p-3.5 bg-slate-950 rounded-lg border border-slate-850 flex items-start gap-2.5">
        <HelpCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
        <div className="text-[10px] text-slate-500 leading-normal font-mono uppercase tracking-wide">
          Reputation weight increases by 1% per continuous day of zero-packet loss heartbeats. Faulty hardware or offline signals trigger reputation slashing logs.
        </div>
      </div>
    </div>
  );
}
