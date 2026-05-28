import React, { useState, useEffect } from 'react';
import { BrowserProvider } from 'ethers';
import { motion, AnimatePresence } from 'motion/react';
import { Layers, Server, Award, Trophy, Settings, RefreshCw, Cpu, Activity, Database, Sparkles, ChevronRight, MonitorDot, ArrowUpRight } from 'lucide-react';

import WalletConnect from './components/WalletConnect.tsx';
import NetworkDashboard from './components/NetworkDashboard.tsx';
import DeviceConsole from './components/DeviceConsole.tsx';
import RewardsPanel from './components/RewardsPanel.tsx';
import LeaderboardPanel from './components/LeaderboardPanel.tsx';
import AdminConsole from './components/AdminConsole.tsx';
import { NetworkStats, DePINNode } from './types.ts';

export default function App() {
  const [connectedAddress, setConnectedAddress] = useState<string>('');
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  
  const [activeTab, setActiveTab] = useState<'network' | 'devices' | 'rewards' | 'leaderboard' | 'admin'>('network');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<NetworkStats>({
    totalNodes: 0,
    activeNodes: 0,
    totalBandwidthTbps: 0,
    totalStoragePB: 0,
    totalGPUPowerTflops: 0,
    totalValidators: 0,
    totalStakedTokens: '0.00',
    globalUptimePercent: 100,
    renrisCirculatingSupply: '0.00',
    rewardPoolBalance: '0.00'
  });
  
  const [nodes, setNodes] = useState<DePINNode[]>([]);
  const [tickerBlock, setTickerBlock] = useState(14028302);

  // Network metrics polling loader
  useEffect(() => {
    fetchGlobalStats();
    fetchUserNodes();
    
    const statsInterval = setInterval(fetchGlobalStats, 8000);
    const blockInterval = setInterval(() => {
      setTickerBlock(prev => prev + 1);
    }, 4500);

    return () => {
      clearInterval(statsInterval);
      clearInterval(blockInterval);
    };
  }, [connectedAddress]);

  const fetchGlobalStats = async () => {
    try {
      const response = await fetch('/api/network/stats');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.log('Failed to fetch protocol global statistics.', err);
    }
  };

  const fetchUserNodes = async () => {
    try {
      const url = connectedAddress ? `/api/nodes?ownerAddress=${connectedAddress}` : '/api/nodes';
      const response = await fetch(url);
      const data = await response.json();
      if (Array.isArray(data)) {
        setNodes(data);
      }
    } catch (err) {
      console.log('Failed to pull user nodes inventory.', err);
    }
  };

  const handleWalletConnected = (address: string, web3Provider: BrowserProvider | null, netId: number | null) => {
    setConnectedAddress(address);
    setProvider(web3Provider);
    setChainId(netId);
  };

  const handleWalletDisconnected = () => {
    setConnectedAddress('');
    setProvider(null);
    setChainId(null);
  };

  const handleRegisterNode = async (nodeData: any) => {
    try {
      const response = await fetch('/api/nodes/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(nodeData)
      });
      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Server validation failed during registration.');
      }
      await fetchUserNodes();
      await fetchGlobalStats();
    } catch (e) {
      throw e;
    }
  };

  // Calculate user-oriented pending sum across active nodes
  const calculateAggregatePendingClaims = () => {
    if (!connectedAddress) return '0.0000';
    let total = 0;
    nodes.forEach(n => {
      if (n.ownerAddress.toLowerCase() === connectedAddress.toLowerCase()) {
        total += Number(n.pendingClaimable);
      }
    });
    return total.toFixed(4);
  };

  const handleRefreshAll = () => {
    setLoading(true);
    fetchGlobalStats();
    fetchUserNodes();
    setTimeout(() => {
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased relative">
      {/* Cybernetic glowing background gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-blue-500/5 blur-[150px] pointer-events-none rounded-full" />

      {/* 1. Header Navigation Bar */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur z-40 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-slate-900 to-emerald-950 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-950/40">
              <Layers className="h-5 w-5 text-emerald-400 animate-pulse" />
            </div>
            <div className="text-left flex flex-col leading-none">
              <span className="text-sm font-bold tracking-widest text-slate-100 font-mono">RENRIS</span>
              <span className="text-[10px] tracking-wider uppercase text-emerald-400 font-semibold font-mono mt-0.5">DePIN Network</span>
            </div>
          </div>

          {/* Quick Metrics Ticker Block */}
          <div className="hidden lg:flex items-center gap-6 text-[11px] font-mono text-slate-400 border-l border-slate-900 pl-6 mr-auto ml-6">
            <div className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              <span>LitVM consensus: <span className="text-slate-200 font-bold">Stable</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <ChevronRight className="h-3 w-3 text-slate-600" />
              <span>Block Height: <span className="text-emerald-400 font-bold">{tickerBlock}</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Portal: <a href="http://win1054.site4now.net" target="_blank" rel="noopener noreferrer" className="text-slate-200 font-semibold hover:text-emerald-400 underline decoration-emerald-500/30 transition">win1054.site4now.net</a></span>
            </div>
          </div>

          {/* Refresh & Quick Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefreshAll}
              disabled={loading}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-emerald-400 rounded-lg transition"
              title="Sync Ledger Stats"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Horizontal Alert/Status Bar */}
      <div className="bg-slate-950 border-b border-slate-900/60 py-2 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-left text-[10px] font-mono text-slate-400 uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Telemetry Active: <span className="text-slate-300 font-bold font-sans capitalize">{activeTab} node views</span></span>
          </div>
          <span className="text-slate-500 select-all font-mono">LitVM: 0x140845412Dd216AA935B1723eB99CdCA9537bD90</span>
        </div>
      </div>

      {/* 3. Main Stage Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left Control Column (always fixed) */}
        <div className="md:col-span-4 lg:col-span-3 space-y-6">
          <WalletConnect
            onWalletConnected={handleWalletConnected}
            onWalletDisconnected={handleWalletDisconnected}
            connectedAddress={connectedAddress}
          />

          {/* Applet Menu Tab Navigation */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-2.5 shadow-xl">
            <span className="block px-3 py-1.5 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest text-left">Protocol Menus</span>
            <nav className="flex flex-col gap-1 mt-1.5">
              <button
                onClick={() => setActiveTab('network')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${activeTab === 'network' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/50'}`}
              >
                <Activity className="h-4 w-4 shrink-0" />
                Network Topology
              </button>

              <button
                onClick={() => setActiveTab('devices')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${activeTab === 'devices' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/50'}`}
              >
                <Server className="h-4 w-4 shrink-0" />
                Device Console
              </button>

              <button
                onClick={() => setActiveTab('rewards')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${activeTab === 'rewards' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/50'}`}
              >
                <Award className="h-4 w-4 shrink-0" />
                Rewards & Stake
              </button>

              <button
                onClick={() => setActiveTab('leaderboard')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${activeTab === 'leaderboard' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/50'}`}
              >
                <Trophy className="h-4 w-4 shrink-0" />
                Rank Leaderboard
              </button>

              <button
                onClick={() => setActiveTab('admin')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${activeTab === 'admin' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/50'}`}
              >
                <Settings className="h-4 w-4 shrink-0" />
                Telemetry Analytics
              </button>
            </nav>
          </div>
        </div>

        {/* Right Dynamic Column stage */}
        <div id="depin-stage-container" className="md:col-span-8 lg:col-span-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {activeTab === 'network' && (
                <NetworkDashboard
                  stats={stats}
                  loading={loading}
                  onRefresh={handleRefreshAll}
                />
              )}

              {activeTab === 'devices' && (
                <DeviceConsole
                  ownerAddress={connectedAddress}
                  nodes={nodes}
                  onRegisterNode={handleRegisterNode}
                  onRefresh={handleRefreshAll}
                />
              )}

              {activeTab === 'rewards' && (
                <RewardsPanel
                  ownerAddress={connectedAddress}
                  provider={provider}
                  chainId={chainId}
                  pendingTotal={calculateAggregatePendingClaims()}
                  onRefresh={handleRefreshAll}
                />
              )}

              {activeTab === 'leaderboard' && (
                <LeaderboardPanel />
              )}

              {activeTab === 'admin' && (
                <AdminConsole />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* 4. Footer credits */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-5">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-mono text-slate-600">
          <div>
            &copy; 2026 RENRIS DePIN Project. All rights reserved. Deployed to LiteForge LitVM Ledger.
          </div>
          <div className="flex gap-4 uppercase font-semibold">
            <a href="http://win1054.site4now.net" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition mb-0.5 flex items-center gap-1">
              Public Portal <ArrowUpRight className="h-3 w-3 inline shrink-0" />
            </a>
            <span className="text-slate-800">|</span>
            <a href="https://scan.litvm.liteforge.network" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition mb-0.5 flex items-center gap-1">
              LitVM Explorer <ArrowUpRight className="h-3 w-3 inline shrink-0" />
            </a>
            <span className="text-slate-800">|</span>
            <a href="https://github.com/jrr46313/renris-depin" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition mb-0.5 flex items-center gap-1">
              GitHub Repo <ArrowUpRight className="h-3 w-3 inline shrink-0" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
