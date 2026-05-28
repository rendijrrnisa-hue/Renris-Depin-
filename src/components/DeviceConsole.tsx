import React, { useState, useEffect, useRef } from 'react';
import { Server, HardDrive, Cpu, Activity, Plus, RefreshCw, Terminal, Play, Square, Settings, Copy, HelpCircle, ArrowUpRight } from 'lucide-react';
import { DePINNode, NodeCategory } from '../types';

interface DeviceConsoleProps {
  ownerAddress: string;
  nodes: DePINNode[];
  onRegisterNode: (nodeData: any) => Promise<void>;
  onRefresh: () => void;
}

export default function DeviceConsole({ ownerAddress, nodes, onRegisterNode, onRefresh }: DeviceConsoleProps) {
  const [activeTab, setActiveTab] = useState<'enroll' | 'client'>('enroll');
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState('');
  
  // Registration Form State
  const [nodeName, setNodeName] = useState('');
  const [category, setCategory] = useState<NodeCategory>('bandwidth');
  const [hardware, setHardware] = useState('');
  const [storageVal, setStorageVal] = useState(250);
  const [bandwidthVal, setBandwidthVal] = useState(100);
  const [gpuScoresVal, setGpuScoresVal] = useState(30);

  // Background Daemon Client State
  const [isMining, setIsMining] = useState(false);
  const [miningNodeId, setMiningNodeId] = useState<string>('');
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [telemetryCpu, setTelemetryCpu] = useState(0);
  const [telemetryRam, setTelemetryRam] = useState(0);
  const [telemetryNetwork, setTelemetryNetwork] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-fill defaults as they change categories
  useEffect(() => {
    if (category === 'bandwidth') {
      setHardware('Gigabit Fiber Uplink - WAN Oracle');
      setBandwidthVal(500);
      setStorageVal(80);
      setGpuScoresVal(0);
    } else if (category === 'storage') {
      setHardware('Synology NAS Rack Array (BTRFS RAID 5)');
      setBandwidthVal(80);
      setStorageVal(8000);
      setGpuScoresVal(0);
    } else if (category === 'gpu') {
      setHardware('NVIDIA RTX 4090 Adalovelace (24GB VRAM)');
      setBandwidthVal(200);
      setStorageVal(1000);
      setGpuScoresVal(82);
    } else {
      setHardware('Ubuntu VPS Core - 8 Cores AMD EPYC');
      setBandwidthVal(100);
      setStorageVal(150);
      setGpuScoresVal(0);
    }
  }, [category]);

  const addLog = (logText: string) => {
    const time = new Date().toLocaleTimeString();
    setConsoleLogs(prev => [`[${time}] ${logText}`, ...prev.slice(0, 35)]);
  };

  // Launch browser node heartbeat miner thread
  const toggleMiningDaemon = () => {
    if (isMining) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      setIsMining(false);
      addLog('Browser DePIN Node Daemon stopped successfully. Infrastructure telemetry disconnected.');
    } else {
      if (!miningNodeId) {
        setRegisterError('Please select a registered node from your inventory list to run.');
        return;
      }
      setRegisterError('');
      setIsMining(true);
      addLog(`Connecting Browser Node Daemon for Node Target: ${miningNodeId}...`);
      addLog('Verifying local environment WebAssembly virtual network loop...');
      
      // Start the heartbeat loop at 5 second intervals
      timerRef.current = setInterval(async () => {
        // Fluctuations in local specs
        const cpu = Math.floor(Math.random() * 35) + 10;
        const ram = Math.floor(Math.random() * 20) + 40;
        const netBase = category === 'bandwidth' ? bandwidthVal * 0.85 : 45;
        const net = Math.round(netBase + (Math.random() * 15 - 7.5));
        
        setTelemetryCpu(cpu);
        setTelemetryRam(ram);
        setTelemetryNetwork(net);

        addLog(`Submitting node telemetry update: CPU: ${cpu}%, RAM: ${ram}%, Net: ${net} Mbps.`);

        try {
          // Send heartbeat request to full stack Express validator server
          const response = await fetch('/api/nodes/heartbeat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nodeId: miningNodeId,
              timestamp: Date.now(),
              telemetry: { cpu, ram, net }
            })
          });
          const data = await response.json();
          if (data.success) {
            addLog(`Validator signature accepted. Accrued Rewards: ${data.accumulatedRewards} REN (+${(Number(data.pendingClaimable) - (nodes.find(n => n.id === miningNodeId)?.pendingClaimable ? Number(nodes.find(n => n.id === miningNodeId)?.pendingClaimable) : 0)).toFixed(6)} REN)`);
            onRefresh(); // refresh main nodes balances
          } else {
            addLog(`REST telemetry payload rejected: ${data.error}`);
          }
        } catch (err: any) {
          addLog(`Validator error connection failed: ${err.message}`);
        }
      }, 5000) as any;
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleEnrollNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerAddress) {
      setRegisterError('Must connect wallet to enroll devices.');
      return;
    }
    if (!nodeName.trim()) {
      setRegisterError('Please provide a unique, descriptive node name.');
      return;
    }

    setIsRegistering(true);
    setRegisterError('');

    try {
      await onRegisterNode({
        ownerAddress,
        name: nodeName,
        category,
        hardwareSpec: hardware,
        storageGB: category === 'storage' ? storageVal : 100,
        bandwidthMbps: category === 'bandwidth' ? bandwidthVal : 100,
        gpuScores: category === 'gpu' ? gpuScoresVal : 0,
      });
      setNodeName('');
      addLog(`Enrolled active node: ${nodeName} on LiteForge LitVM Ledger.`);
      setActiveTab('client');
      // preselect
      setTimeout(() => {
        onRefresh();
      }, 400);
    } catch (err: any) {
      setRegisterError(err.message || 'Enrollment registration failed.');
    } finally {
      setIsRegistering(false);
    }
  };

  // Pre-fill selection if first node is added
  useEffect(() => {
    if (nodes.length > 0 && !miningNodeId) {
      setMiningNodeId(nodes[0].id);
    }
  }, [nodes]);

  const dockerSnippet = `docker run -d \\
  --name renris-depin-node \\
  -e WALLET_ADDRESS="${ownerAddress || '0x00...YOUR_EVM_WALLET'}" \\
  -e NODE_CATEGORY="${category}" \\
  -e VERIFY_PORT=8080 \\
  -v /var/renris/storage:/data \\
  renris/depin-node-client:latest`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
      {/* Tab controls */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-3 flex gap-2">
          <button
            onClick={() => setActiveTab('enroll')}
            className={`flex-1 py-2 text-center text-xs font-mono font-semibold rounded-lg transition-all duration-300 ${activeTab === 'enroll' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Enroll Device
          </button>
          <button
            onClick={() => setActiveTab('client')}
            className={`flex-1 py-2 text-center text-xs font-mono font-semibold rounded-lg transition-all duration-300 ${activeTab === 'client' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Run Client Core
          </button>
        </div>

        {/* Dynamic Left Columns based on Active Tab */}
        {activeTab === 'enroll' ? (
          <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 shadow-xl">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest mb-4">Enroll Physical Node</h3>
            
            {registerError && (
              <div className="p-3 mb-4 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {registerError}
              </div>
            )}

            <form onSubmit={handleEnrollNode} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">Resource Category</label>
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCategory('bandwidth')}
                    className={`p-2 flex flex-col items-center justify-center gap-1 border rounded transition-all ${category === 'bandwidth' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'}`}
                  >
                    <Activity className="h-4 w-4" />
                    <span className="text-[8px] font-mono font-semibold uppercase">Bandwidth</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategory('storage')}
                    className={`p-2 flex flex-col items-center justify-center gap-1 border rounded transition-all ${category === 'storage' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'}`}
                  >
                    <HardDrive className="h-4 w-4" />
                    <span className="text-[8px] font-mono font-semibold uppercase">Storage</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategory('gpu')}
                    className={`p-2 flex flex-col items-center justify-center gap-1 border rounded transition-all ${category === 'gpu' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'}`}
                  >
                    <Cpu className="h-4 w-4" />
                    <span className="text-[8px] font-mono font-semibold uppercase">AI GPU</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategory('validator')}
                    className={`p-2 flex flex-col items-center justify-center gap-1 border rounded transition-all ${category === 'validator' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'}`}
                  >
                    <Server className="h-4 w-4" />
                    <span className="text-[8px] font-mono font-semibold uppercase">Validator</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">Custom Device Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kyoto-Bandwidth-Server"
                  value={nodeName}
                  onChange={(e) => setNodeName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-300 focus:outline-none focus:border-emerald-500/80 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">Identified Hardware Core</label>
                <input
                  type="text"
                  required
                  placeholder="Ubuntu CPU Xeon e5"
                  value={hardware}
                  onChange={(e) => setHardware(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-400 focus:outline-none font-mono"
                />
              </div>

              {category === 'storage' && (
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                    <span>SHARED STORAGE CAPABILITY</span>
                    <span className="text-emerald-400 font-bold">{storageVal} GB</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="10000"
                    step="50"
                    value={storageVal}
                    onChange={(e) => setStorageVal(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>
              )}

              {category === 'bandwidth' && (
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                    <span>UPLINK SPEED LIMIT</span>
                    <span className="text-emerald-400 font-bold">{bandwidthVal} Mbps</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="2000"
                    step="10"
                    value={bandwidthVal}
                    onChange={(e) => setBandwidthVal(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>
              )}

              {category === 'gpu' && (
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                    <span>WEBML FLOPS METRIC</span>
                    <span className="text-emerald-400 font-bold">{gpuScoresVal} TFLOPS</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="500"
                    step="5"
                    value={gpuScoresVal}
                    onChange={(e) => setGpuScoresVal(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>
              )}

              <button
                type="submit"
                id="btn-register-node"
                disabled={isRegistering || !ownerAddress}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-semibold font-mono rounded text-xs transition uppercase tracking-wider"
              >
                <Plus className="h-4 w-4" />
                {isRegistering ? 'Registering LitVM Node...' : 'Enroll to Blockchain'}
              </button>

              {!ownerAddress && (
                <p className="text-[10px] text-slate-500 text-center font-mono">Connect wallet to authorize enroll transaction keys.</p>
              )}
            </form>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest mb-4">Launch Local Daemon</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Deploy the REN lightweight background daemon in this tab browser instance. It automatically registers resource pings on the Telemetry Layer and accumulates reward tokens.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">Target Node Selection</label>
                  <select
                    value={miningNodeId}
                    onChange={(e) => setMiningNodeId(e.target.value)}
                    disabled={isMining}
                    className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-300 focus:outline-none focus:border-emerald-500/80 font-mono"
                  >
                    <option value="">-- Choose Active Node --</option>
                    {nodes.filter(n => n.ownerAddress.toLowerCase() === ownerAddress.toLowerCase()).map(n => (
                      <option key={n.id} value={n.id}>
                        {n.name} [{n.category.toUpperCase()}]
                      </option>
                    ))}
                  </select>
                </div>

                {isMining && (
                  <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 flex flex-col gap-2 font-mono text-[10px]">
                    <div className="flex justify-between items-center text-slate-400">
                      <span>V-THREAD CPU LOAD</span>
                      <span className="text-emerald-400 font-bold">{telemetryCpu}%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${telemetryCpu}%` }} />
                    </div>

                    <div className="flex justify-between items-center text-slate-400 mt-1">
                      <span>RAM FOOTPRINT</span>
                      <span className="text-emerald-400 font-bold">{telemetryRam}%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${telemetryRam}%` }} />
                    </div>

                    <div className="flex justify-between items-center text-slate-400 mt-1">
                      <span>NET TUNNEL PIPE</span>
                      <span className="text-emerald-400 font-bold">{telemetryNetwork} Mbps</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800/80">
              <button
                type="button"
                id="btn-mining-daemon"
                onClick={toggleMiningDaemon}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded text-xs font-semibold font-mono tracking-wider transition ${isMining ? 'bg-rose-950 text-rose-400 border border-rose-800/50 hover:bg-rose-900/60' : 'bg-emerald-600 hover:bg-emerald-5050 text-slate-950 hover:bg-emerald-500'}`}
              >
                {isMining ? (
                  <>
                    <Square className="h-4 w-4" /> Stop Daemon Thread
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" /> Start Tab Miner Daemon
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Node list / Docker guides */}
      <div className="lg:col-span-8 space-y-6">
        {/* Device Database Table */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest">Operator Node Registries</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Physical telemetry checkpoints registering uptime claims directly under cryptographically checked seeds.</p>
            </div>
            <button
              onClick={onRefresh}
              className="p-1.5 hover:bg-slate-800 rounded border border-slate-800 text-slate-400 hover:text-emerald-400 transition"
              title="Refresh Telemetry Inventory"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono text-left">
              <thead>
                <tr className="border-b border-slate-800/80 text-slate-500 pb-2">
                  <th className="py-2.5">Node ID</th>
                  <th>Category</th>
                  <th>Hardware Model</th>
                  <th>Uptime Status</th>
                  <th className="text-right">Accumulated (REN)</th>
                </tr>
              </thead>
              <tbody>
                {nodes.filter(n => n.ownerAddress.toLowerCase() === ownerAddress.toLowerCase()).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-500">
                      No nodes registered for current session address. Select 'Enroll Device' or connect a seed above to populate.
                    </td>
                  </tr>
                ) : (
                  nodes.filter(n => n.ownerAddress.toLowerCase() === ownerAddress.toLowerCase()).map((n) => (
                    <tr key={n.id} className="border-b border-slate-800/40 hover:bg-slate-950/40 transition">
                      <td className="py-3">
                        <span className="text-emerald-400 font-bold font-mono">{n.name}</span>
                        <span className="block text-[9px] text-slate-500 font-normal">ID: {n.id.slice(0, 14)}...</span>
                      </td>
                      <td>
                        <span className="px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded text-[9px] text-slate-400 font-bold uppercase">
                          {n.category}
                        </span>
                      </td>
                      <td className="text-slate-400 truncate max-w-[150px]" title={n.hardwareSpec}>
                        {n.hardwareSpec}
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${n.status === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                          <span className="capitalize">{n.status}</span>
                        </div>
                        <span className="block text-[8px] text-slate-500">RepScore: {n.reputationScore}%</span>
                      </td>
                      <td className="text-right text-emerald-400 font-bold">
                        {n.accumulatedRewards}
                        <span className="block text-[9px] text-sky-400 font-medium">Pending: {n.pendingClaimable}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Docker CLI Run Guide for physical miners */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Terminal className="h-28 w-28 text-emerald-400" />
          </div>
          <div className="mb-4">
            <h4 className="text-xs font-bold font-mono uppercase text-slate-400">Headless Physical Device Client (Docker Setup)</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">To connect cold high-availability servers, download our precompiled CLI validator and mount the local volumes using Docker container tunnels.</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/80 relative">
            <button
              onClick={() => {
                navigator.clipboard.writeText(dockerSnippet);
                addLog('Docker run commands snippet copied to system clipboard.');
              }}
              className="absolute top-3 right-3 p-1.5 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded text-slate-400 hover:text-emerald-400 transition"
              title="Copy snippet"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <pre className="text-[10px] text-emerald-500 font-mono leading-relaxed overflow-x-auto text-left whitespace-pre">
              {dockerSnippet}
            </pre>
          </div>
        </div>

        {/* Terminal Logs Window */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-xl">
          <div className="flex items-center gap-1.5 mb-3 text-slate-400 pb-2 border-b border-slate-800/60">
            <Terminal className="h-4 w-4 text-emerald-400" />
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">Web Client Telemetry Stream</span>
          </div>
          <div className="h-[140px] overflow-y-auto font-mono text-[10px] text-slate-400 space-y-1 scrollbar-thin text-left">
            {consoleLogs.length === 0 ? (
              <span className="text-slate-500 block">[Console Idle] Launch a Local Daemon or action node queries to monitor protocol actions...</span>
            ) : (
              consoleLogs.map((log, idx) => (
                <div key={idx} className="leading-normal hover:bg-slate-900 py-0.5 transition-colors">
                  <span className="text-emerald-500">✔</span> {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
