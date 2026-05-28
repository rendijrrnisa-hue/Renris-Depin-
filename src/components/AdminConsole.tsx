import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { Sliders, Activity, CheckCircle, ShieldAlert, RefreshCw, Terminal } from 'lucide-react';

export default function AdminConsole() {
  const [loading, setLoading] = useState(false);
  const [telemetryLogs, setTelemetryLogs] = useState<any[]>([]);

  // Simulation historical metrics over last 12 hours for AreaChart
  const activeNodesHistory = [
    { time: '05:00', nodes: 3, capacityPB: 1.1, bandwidthTbps: 0.95 },
    { time: '06:00', nodes: 3, capacityPB: 1.1, bandwidthTbps: 1.02 },
    { time: '07:00', nodes: 4, capacityPB: 2.5, bandwidthTbps: 1.15 },
    { time: '08:00', nodes: 4, capacityPB: 2.5, bandwidthTbps: 1.12 },
    { time: '09:00', nodes: 5, capacityPB: 3.1, bandwidthTbps: 1.25 },
    { time: '10:00', nodes: 5, capacityPB: 3.2, bandwidthTbps: 1.34 },
    { time: '11:00', nodes: 7, capacityPB: 3.6, bandwidthTbps: 1.48 },
    { time: '12:00', nodes: 8, capacityPB: 3.78, bandwidthTbps: 1.55 }
  ];

  // Allocation Composition PieChart
  const compositionData = [
    { name: 'AI compute (GPU)', value: 45, color: '#10b981' },
    { name: 'Distributed Storage', value: 30, color: '#3b82f6' },
    { name: 'Fiber Bandwidth', value: 15, color: '#ef4444' },
    { name: 'Validator Nodes', value: 10, color: '#eab308' }
  ];

  // Telemetry load profiles across categories
  const categoryUptimes = [
    { name: 'Bandwidth', target: 98.4, validated: 99.1 },
    { name: 'Storage', target: 95.0, validated: 97.4 },
    { name: 'AI GPU', target: 99.0, validated: 99.8 },
    { name: 'Validator', target: 100, validated: 100 }
  ];

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/transactions');
      const data = await res.json();
      if (Array.isArray(data)) {
        setTelemetryLogs(data.slice(0, 8));
      }
    } catch (e) {
      console.log('Failed to fetch telemetry auditing logs.', e);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Admin Header with decentralised warning */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-sm font-semibold tracking-wider text-slate-300 uppercase">Operational Telemetry Console</h3>
          <p className="text-[11px] text-slate-500 mt-1">Real-time validation maps, resource allocations, and node ledger monitoring. Minting logic has been fully deactivated to maintain zero-intervention blockchain consensus.</p>
        </div>
        <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[9px] font-bold rounded-full uppercase tracking-wider shrink-0 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          No Admin Mint Backdoor
        </span>
      </div>

      {/* Grid of Interactive Analytics Charts */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Chart 1: Scale Graph over time (Area CHART) */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl md:col-span-8 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold font-mono uppercase text-slate-400 flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              Network Resource Growth Index (12H)
            </h4>
          </div>
          
          <div className="h-[220px] w-full bg-slate-950 p-2 rounded-lg border border-slate-800/40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeNodesHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNodes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBandwidth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#52525b" fontSize={9} fontClassName="font-mono" />
                <YAxis stroke="#52525b" fontSize={9} fontClassName="font-mono" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: 10 }} />
                <Area type="monotone" dataKey="nodes" stroke="#10b981" fillOpacity={1} fill="url(#colorNodes)" name="Active Nodes" />
                <Area type="monotone" dataKey="capacityPB" stroke="#3b82f6" fillOpacity={1} fill="url(#colorBandwidth)" name="Storage capacity (PB)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Category Pie Composition */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl md:col-span-4 shadow-xl">
          <h4 className="text-xs font-bold font-mono uppercase text-slate-400 mb-4 flex items-center gap-2">
            <Sliders className="h-4 w-4 text-emerald-400" />
            Infrastructure Composition
          </h4>

          <div className="h-[140px] w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={compositionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={55}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {compositionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: 9 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-1.5 mt-4 text-[9px] font-mono">
            {compositionData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-400 truncate">{item.name}</span>
                <span className="text-slate-500 font-bold ml-auto">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Category validation uptimes & system log audits */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Chart 3: Validator Uptime comparisons (Bar Chart) */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl md:col-span-6 shadow-xl">
          <h4 className="text-xs font-bold font-mono uppercase text-slate-400 mb-4">Uptime Validation Performance</h4>
          
          <div className="h-[205px] w-full bg-slate-950 p-2 rounded-lg border border-slate-800/40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryUptimes} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#52525b" fontSize={9} fontClassName="font-mono" />
                <YAxis stroke="#52525b" fontSize={9} fontClassName="font-mono" domain={[90, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: 10 }} />
                <Bar dataKey="validated" fill="#10b981" radius={[3, 3, 0, 0]} name="Measured Uptime %" />
                <Bar dataKey="target" fill="#52525b" radius={[3, 3, 0, 0]} name="SLA Target %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Admin Telemetry Audit Trail Logs */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl md:col-span-6 shadow-xl flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold font-mono uppercase text-slate-400 mb-2 flex items-center gap-2">
              <Terminal className="h-4 w-4 text-emerald-400" />
              Validator telemetry Logs audit
            </h4>
            <p className="text-[11px] text-slate-500 leading-normal mb-3">Auditing verification loop events completed by the validator server wallet signatures on LiteForge.</p>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 h-[178px] overflow-y-auto space-y-1.5 scrollbar-thin text-left font-mono text-[9px]">
            {telemetryLogs.length === 0 ? (
              <span className="text-slate-500">[Audit Logs Idle] Active nodes will post audits here...</span>
            ) : (
              telemetryLogs.map((log) => (
                <div key={log.txHash} className="p-1.5 hover:bg-slate-900/60 border-b border-slate-800/40 rounded flex items-center justify-between text-slate-450 text-slate-450 leading-tight">
                  <div className="flex flex-col">
                    <span className="text-slate-400 font-bold uppercase truncate max-w-[140px]">
                      {log.type === 'claim' ? '💸 CLM SUBMIT' : log.type === 'stake' ? '📥 STK DELEGATE' : log.type === 'register' ? '🔧 REG DEPIN' : '🎛️ TLM BEAT'}
                    </span>
                    <span className="text-slate-500 truncate max-w-[160px]">TX: {log.txHash}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-emerald-400 font-bold">{log.amount === '0' ? 'VAL SIGN' : `${log.amount} RNG`}</span>
                    <span className="block text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
