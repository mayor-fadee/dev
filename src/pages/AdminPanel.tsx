import React, { useState, useEffect } from "react";
import { 
  Shield, 
  Users, 
  Cpu, 
  TrendingUp, 
  DollarSign, 
  Settings, 
  CheckCircle, 
  XCircle,
  Activity,
  ArrowRight
} from "lucide-react";
import { fetchWithAuth, db } from "../lib/firebase";
import { motion } from "motion/react";
import toast from "react-hot-toast";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminPanel() {
  const [stats, setStats] = useState<any>(null);
  const [aiRouterStatus, setAiRouterStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsData, routerData] = await Promise.all([
        fetchWithAuth("/api/admin/stats"),
        fetchWithAuth("/api/admin/ai-models")
      ]);
      setStats(statsData);
      setAiRouterStatus(routerData);
    } catch (error: any) {
      toast.error("Failed to fetch admin data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tighter flex items-center gap-3">
            <Shield className="text-indigo-500" size={32} />
            Control Center
          </h2>
          <p className="text-neutral-500 text-sm uppercase font-black tracking-widest mt-1">System Administration & AI Routing</p>
        </div>
        <button 
          onClick={fetchData}
          className="glass-button px-4 py-2 text-xs font-bold uppercase tracking-widest"
        >
          Refresh Data
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Total Users", value: stats?.totalUsers, icon: Users, color: "text-blue-500" },
          { label: "Revenue", value: `$${stats?.revenue?.toFixed(2)}`, icon: DollarSign, color: "text-emerald-500" },
          { label: "AI Requests", value: stats?.totalRequests, icon: Activity, color: "text-purple-500" },
          { label: "Projects", value: stats?.totalProjects, icon: TrendingUp, color: "text-amber-500" },
        ].map((s, i) => (
          <div key={i} className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg bg-${s.color.split("-")[1]}-500/10 ${s.color}`}>
                <s.icon size={20} />
              </div>
              <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Global</span>
            </div>
            <div className="text-2xl font-black text-neutral-100">{s.value || 0}</div>
            <div className="text-[10px] font-bold text-neutral-500 uppercase mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* AI Routing Panel - READ ONLY VIEW */}
        <div className="lg:col-span-2 space-y-6">
          <section className="glass-card">
            <div className="flex items-center gap-3 mb-8">
              <Cpu className="text-indigo-500" size={24} />
              <div className="flex flex-col">
                <h3 className="text-xl font-bold uppercase tracking-tight">AI Model Usage Viewer</h3>
                <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Status: Ready-only (Backend Controlled)</span>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-neutral-500 font-black uppercase tracking-widest border-b border-white/5">
                    <th className="pb-4 pt-2 px-4">Feature</th>
                    <th className="pb-4 pt-2 px-4">Model Used</th>
                    <th className="pb-4 pt-2 px-4">Description</th>
                    <th className="pb-4 pt-2 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {aiRouterStatus && aiRouterStatus.map((config: any) => (
                    <tr key={config.id} className="group hover:bg-white/2 transition-colors">
                      <td className="py-4 px-4 font-black text-neutral-200 uppercase tracking-widest">{config.id.replace("-", " ")}</td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-bold font-mono">
                          {config.model}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-neutral-500 max-w-xs truncate" title={config.description}>
                        {config.description}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                            config.status === "Active" 
                              ? "bg-emerald-500/10 text-emerald-500" 
                              : "bg-red-500/10 text-red-500"
                          )}>
                            {config.status}
                          </span>
                          <Shield size={12} className="text-neutral-700" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="glass-card">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Users className="text-indigo-500" size={20} />
              <span>User Base Health</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-neutral-500 font-black uppercase tracking-widest border-b border-white/5">
                    <th className="pb-4">Status</th>
                    <th className="pb-4">Email</th>
                    <th className="pb-4">Plan</th>
                    <th className="pb-4">Usage</th>
                    <th className="pb-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <tr key={i} className="group hover:bg-white/2 transition-colors">
                      <td className="py-4">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      </td>
                      <td className="py-4 font-medium text-neutral-300">user_{i}@example.com</td>
                      <td className="py-4">
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-bold uppercase tracking-tighter">Premium</span>
                      </td>
                      <td className="py-4 text-neutral-500">128 gens</td>
                      <td className="py-4 text-right">
                        <button className="p-2 hover:bg-white/10 rounded-lg text-neutral-500 hover:text-white transition-colors">
                          <Settings size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          <div className="glass-card bg-indigo-600/5 border-indigo-500/30">
            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Maintenance Mode</h4>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-neutral-300">Global API Lock</span>
              <button className="w-10 h-5 bg-neutral-800 rounded-full relative">
                <div className="absolute left-1 top-1 w-3 h-3 bg-neutral-600 rounded-full"></div>
              </button>
            </div>
            <p className="text-[10px] text-neutral-500 mt-4 leading-relaxed">
              Enabling this will prevent all users from making AI requests. Use only during major updates.
            </p>
          </div>

          <div className="glass-card">
            <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-6">Service Health</h4>
            <div className="space-y-4">
              {[
                { name: "Gemini Pro", status: "Operational", color: "text-emerald-500" },
                { name: "Gemini Flash", status: "Operational", color: "text-emerald-500" },
                { name: "Auth Engine", status: "Operational", color: "text-emerald-500" },
                { name: "Project Storage", status: "Slow", color: "text-amber-500" },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-400">{s.name}</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${s.color}`}>{s.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-0 overflow-hidden">
            <div className="p-6">
              <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ">AI Cost Estimate</h4>
              <div className="text-2xl font-black text-neutral-100 mt-2">$24.81</div>
              <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-tight mt-1">Budget safe (42% used)</div>
            </div>
            <div className="h-24 w-full bg-black/20">
               <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[
                  { v: 10 }, { v: 15 }, { v: 12 }, { v: 25 }, { v: 20 }, { v: 30 }
                ]}>
                  <Line type="monotone" dataKey="v" stroke="#6366f1" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
