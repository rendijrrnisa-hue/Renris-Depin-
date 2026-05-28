import React, { useEffect, useState } from 'react';
import { Activity, Server, Cpu, Database, HardDrive, ShieldCheck, TrendingUp, Info } from 'lucide-react';
import { NetworkStats } from '../types';

interface NetworkDashboardProps {
  stats: NetworkStats;
  loading: boolean;
  onRefresh: () => void;
}

export default function NetworkDashboard({ stats, loading, onRefresh }: NetworkDashboardProps) {
  // Local decoration states for real-time live telemetry map animation
  const [activePulse, setActivePulse] = useState(0);

  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setActivePulse(prev => (prev + 1) % 5);
    }, 3000);
    return () => clearInterval(pulseInterval);
  }, []);

  // Simplified geographic pins for node clusters showing clean visual network grid
  const nodePins = [
    { name: 'Tokyo-East Core VM', lat: 35.6762, lng: 139.6503, x: 80, y: 35, speed: '420 MB/s', load: 45, color: 'text-emerald-400' },
    { name: 'Frankfurt-West Storage', lat: 50.1109, lng: 8.6821, x: 45, y: 25, speed: '810 MB/s', load: 82, color: 'text-emerald-400' },
    { name: 'SanJose AI-GPU cluster', lat: 37.3382, lng: -121.8863, x: 20, y: 32, speed: '1.2 GB/s', load: 91, color: 'text-emerald-500' },
    { name: 'Sydney-Validator Node', lat: -33.8688, lng: 151.2093, x: 88, y: 75, speed: '180 MB/s', load: 12, color: 'text-emerald-400' },
    { name: 'Reykjavik Cooling Core', lat: 64.1466, lng: -21.9426, x: 38, y: 15, speed: '25 MB/s', load: 8, color: 'text-emerald-400' }
  ];

  return (
    <div className="space-y-6">
      {/* 1. Global Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Nodes */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 bg-emerald-500/5 rounded-bl-xl group-hover:bg-emerald-500/10 transition-colors">
            <Server className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1">Infrastructure Net</span>
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {stats.activeNodes} <span className="text-slate-500 text-xs font-normal">/ {stats.totalNodes} Nodes</span>
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Telemetry online: {stats.globalUptimePercent}%</span>
          </div>
        </div>

        {/* Card 2: Shared Storage */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 bg-emerald-500/5 rounded-bl-xl group-hover:bg-emerald-500/10 transition-colors">
            <Database className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1">Distributed Storage</span>
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {stats.totalStoragePB} <span className="text-slate-500 text-xs font-normal">PB Capacity</span>
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
            <HardDrive className="h-3.5 w-3.5 text-slate-500" />
            <span>P2P storage networks</span>
          </div>
        </div>

        {/* Card 3: Bandwidth Pipe */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 bg-emerald-500/5 rounded-bl-xl group-hover:bg-emerald-500/10 transition-colors">
            <Activity className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1">Global Bandwidth</span>
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {stats.totalBandwidthTbps} <span className="text-slate-500 text-xs font-normal">Tbps Uplink</span>
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500/80" />
            <span>Low-latency routing active</span>
          </div>
        </div>

        {/* Card 4: AI GPU Power */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 bg-emerald-500/5 rounded-bl-xl group-hover:bg-emerald-500/10 transition-colors">
            <Cpu className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1">GPU Compute Power</span>
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {(stats.totalGPUPowerTflops).toLocaleString()} <span className="text-slate-500 text-xs font-normal">TFLOPS F32</span>
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
            <span>Secure WebML cluster</span>
          </div>
        </div>
      </div>

      {/* 2. Map of DePIN Topology */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold tracking-wider text-slate-300 uppercase">LitVM Net Topology</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Real-time geographic distribution score and bandwidth telemetry of verified validator points.</p>
          </div>
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 text-xs font-mono rounded transition-colors"
          >
            Re-mesh Network
          </button>
        </div>

        {/* Grid Topology Graph Canvas */}
        <div className="relative w-full h-[260px] bg-slate-950 rounded-xl border border-slate-800/60 overflow-hidden flex items-center justify-center">
          {/* Subtle Cyber Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(16,185,129,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.02)_1px,transparent_1px)] bg-[size:24px_24px]" />
          
          {/* Node Connections Visual lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-45">
            {nodePins.map((pin, index) => {
              const nextPin = nodePins[(index + 1) % nodePins.length];
              return (
                <line
                  key={`line-${index}`}
                  x1={`${pin.x}%`}
                  y1={`${pin.y}%`}
                  x2={`${nextPin.x}%`}
                  y2={`${nextPin.y}%`}
                  stroke="rgba(16, 185, 129, 0.12)"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
              );
            })}
          </svg>

          {/* Active geographic coordinates markers */}
          {nodePins.map((pin, i) => (
            <div
              key={`pin-${i}`}
              className="absolute group/pin cursor-pointer transition-transform hover:scale-110"
              style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
            >
              {/* Animated concentric rings */}
              {activePulse === i && (
                <span className="absolute -left-3 -top-3 h-10 w-10 rounded-full border border-emerald-500/40 animate-ping pointer-events-none" />
              )}
              
              {/* Ring indicator */}
              <div className="h-4 w-4 bg-slate-950 rounded-full border-2 border-emerald-400 flex items-center justify-center shadow-lg relative z-10">
                <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full" />
              </div>

              {/* Pin tooltip card */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-48 bg-slate-900/95 text-[10px] text-slate-300 border border-slate-700 p-2 rounded shadow-2xl backdrop-blur pointer-events-none opacity-0 group-hover/pin:opacity-100 transition-opacity duration-300 z-50 text-center uppercase tracking-wide">
                <div className="font-bold text-emerald-400 truncate leading-tight">{pin.name}</div>
                <div className="text-slate-500 font-mono mt-0.5">Uplink: <span className="text-slate-300 font-bold">{pin.speed}</span></div>
                <div className="text-slate-500 font-mono">Telemetry Load: <span className="text-slate-300 font-bold">{pin.load}%</span></div>
              </div>
            </div>
          ))}

          {/* Core Telemetry Node Hub Summary on Bottom Left */}
          <div className="absolute bottom-3 left-3 bg-slate-900/80 border border-slate-800 p-3 rounded-lg flex items-center gap-3 backdrop-blur shadow-lg">
            <div className="flex-1 text-left">
              <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Network Routing Mode</div>
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest font-mono">LITVM P2P COMPILATION</div>
            </div>
            <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded font-mono text-[9px] text-emerald-400">
              STABLE
            </div>
          </div>
        </div>
      </div>

      {/* 3. Tokenomics & RPC Connection Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Tokenomics Summary */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 shadow-xl flex flex-col justify-between text-left">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">Tokenomics (100 Juta Supply)</h4>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
              REN operates on a strict, immutable maximum supply of exactly 100,000,000 REN (100 Juta). Mining rewards are dynamically released via verified telemetry block consensus.
            </p>
          </div>

          <div className="space-y-2 mt-2">
            <div className="bg-slate-950 p-2 rounded border border-slate-800/60 flex justify-between items-center">
              <span className="text-[9px] font-mono uppercase text-slate-500">Max Cap Supply:</span>
              <span className="text-xs font-bold font-mono text-emerald-400">
                100,000,000 <span className="text-slate-500 text-[10px]">REN</span>
              </span>
            </div>
            <div className="bg-slate-950 p-2 rounded border border-slate-800/60 flex justify-between items-center">
              <span className="text-[9px] font-mono uppercase text-slate-500">Circulating REN:</span>
              <span className="text-xs font-bold font-mono text-slate-200">
                {Number(stats.renrisCirculatingSupply).toLocaleString()} <span className="text-slate-500 text-[10px]">REN</span>
              </span>
            </div>
            <div className="bg-slate-950 p-2 rounded border border-slate-800/60 flex justify-between items-center">
              <span className="text-[9px] font-mono uppercase text-slate-500">Reward Pool Ref:</span>
              <span className="text-xs font-bold font-mono text-slate-400">
                {Number(stats.rewardPoolBalance).toLocaleString()} <span className="text-slate-500 text-[10px]">REN</span>
              </span>
            </div>
          </div>
        </div>

        {/* LitVM Smart Contract Reference Info */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 shadow-xl flex flex-col justify-between text-left">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">LitVM Smart Lease</h4>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
              Device registrations, telemetric logs, and secure staking pools operate under self-enforcing LiteForge smart contracts. Balances and proof validations are cryptographically recorded.
            </p>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 flex items-start gap-2.5">
            <Info className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-[9px] font-mono text-slate-500 uppercase">On-Chain Contract Address</div>
              <div className="text-[10px] font-mono text-slate-300 break-all leading-normal text-left">
                0x140845412Dd216AA935B1723eB99CdCA9537bD90
              </div>
            </div>
          </div>
        </div>

        {/* RPC & NETWORK SPEC CARD */}
        <div className="bg-slate-900 border border-emerald-500/10 rounded-xl p-5 shadow-xl flex flex-col justify-between text-left">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Server className="h-4 w-4 text-emerald-400" />
              <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300">LitVM LiteForge RPC</h4>
            </div>
            
            <div className="space-y-1.5 mt-2 text-[10px] font-mono text-slate-400">
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span>RPC URL:</span>
                <span className="text-slate-200 select-all">https://rpc.litvm.liteforge.network</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span>Chain ID:</span>
                <span className="text-slate-200">13271 (0x33D7)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span>Network Name:</span>
                <span className="text-slate-200">LiteForge LitVM Testnet</span>
              </div>
              <div className="flex justify-between">
                <span>Ticker:</span>
                <span className="text-emerald-400 font-bold">REN</span>
              </div>
            </div>
          </div>

          <button
            onClick={async () => {
              if (!window.ethereum) {
                alert('No Web3 wallet extension found. Put "https://rpc.litvm.liteforge.network" manually in your MetaMask custom RPC settings.');
                return;
              }
              const LITVM_PARAMS = {
                chainId: '0x33D7',
                chainName: 'LiteForge LitVM Testnet',
                nativeCurrency: {
                  name: 'REN Token',
                  symbol: 'REN',
                  decimals: 18,
                },
                rpcUrls: ['https://rpc.litvm.liteforge.network'],
                blockExplorerUrls: ['https://scan.litvm.liteforge.network'],
              };
              try {
                await window.ethereum.request({
                  method: 'wallet_switchEthereumChain',
                  params: [{ chainId: LITVM_PARAMS.chainId }],
                });
              } catch (switchError: any) {
                if (switchError.code === 4902) {
                  try {
                    await window.ethereum.request({
                      method: 'wallet_addEthereumChain',
                      params: [LITVM_PARAMS],
                    });
                  } catch (addError) {
                    console.error('Failed to add network', addError);
                  }
                } else {
                  console.error('Failed to switch network', switchError);
                }
              }
            }}
            className="w-full mt-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 rounded-md text-xs font-mono font-semibold transition text-center"
          >
            Connect LitVM RPC
          </button>
        </div>

      </div>
    </div>
  );
}
