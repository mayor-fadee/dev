import React from "react";
import { Bot, Terminal, MessageSquare, Zap, ArrowRight, Star, Clock, Brain, TrendingUp, ShieldCheck, Flame } from "lucide-react";
import { motion } from "motion/react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { useSubscription } from "../hooks/useSubscription";

interface DashboardProps {
  onNav: (page: string) => void;
}

const data = [
  { name: 'Mon', usage: 12 },
  { name: 'Tue', usage: 18 },
  { name: 'Wed', usage: 15 },
  { name: 'Thu', usage: 22 },
  { name: 'Fri', usage: 30 },
  { name: 'Sat', usage: 25 },
  { name: 'Sun', usage: 35 },
];

export default function Dashboard({ onNav }: DashboardProps) {
  const { subscription } = useSubscription();

  const tools = [
    { id: "telegram-bot", label: "Bot Engine", icon: Bot, color: "text-indigo-400", bg: "bg-indigo-500/10", desc: "Telegram automation architect." },
    { id: "api-tester", label: "Pro API Tester", icon: Terminal, color: "text-purple-400", bg: "bg-purple-500/10", desc: "CORS-free REST debugging." },
    { id: "prompt-generator", label: "Idea Foundry", icon: MessageSquare, color: "text-orange-400", bg: "bg-orange-500/10", desc: "AI optimization prompts." },
  ];

  return (
    <div className="space-y-10 pb-20">
      {/* Hero Widget */}
      <section className="relative overflow-hidden glass-card p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 bg-gradient-to-br from-indigo-600/10 to-transparent border-indigo-500/20">
        <div className="flex-1 text-center md:text-left z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-6">
            <Star size={12} className="fill-indigo-400" />
            <span>Developer Power Pack</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 leading-none">
            Architect your tools <span className="text-indigo-500">instantly.</span>
          </h2>
          <p className="text-neutral-400 text-lg mb-8 max-w-lg leading-relaxed">
            Fadixa DevTools uses state-of-the-art AI to build modular bot projects and developer utilities in seconds.
          </p>
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            <button 
              onClick={() => onNav("bot-generator")}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-xl shadow-indigo-600/30"
            >
              Launch Architect
            </button>
            <button 
              onClick={() => onNav("projects")}
              className="px-8 py-3 glass hover:bg-white/10 transition-all font-bold rounded-xl"
            >
              My Archive
            </button>
          </div>
        </div>
        <div className="w-full md:w-1/3 flex items-center justify-center">
          <div className="relative">
            <motion.div 
               animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute inset-0 bg-indigo-500/20 rounded-full blur-[80px]"
            ></motion.div>
            <Zap size={140} className="text-indigo-500 relative z-10 drop-shadow-[0_0_30px_rgba(99,102,241,0.5)] scale-125" />
          </div>
        </div>
      </section>

      {/* Analytics & Tools Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Analytics Section */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <TrendingUp className="text-indigo-500" size={18} />
                  <span>Productivity Metric</span>
                </h3>
                <p className="text-xs text-neutral-500 uppercase font-black tracking-widest">Weekly Tool Generations</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg text-xs font-mono text-neutral-400">
                <span>+24.5%</span>
              </div>
            </div>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="usage" stroke="#6366f1" fillOpacity={1} fill="url(#colorUsage)" strokeWidth={3} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0d0d0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    labelStyle={{ color: '#6366f1', fontWeight: 'bold' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tools.map((tool, idx) => (
              <motion.button
                key={tool.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => onNav(tool.id)}
                className="glass-card p-6 text-left group"
              >
                <div className={`w-10 h-10 ${tool.bg} ${tool.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <tool.icon size={20} />
                </div>
                <h4 className="font-bold text-sm mb-1 uppercase tracking-tighter">{tool.label}</h4>
                <p className="text-[10px] text-neutral-500 leading-relaxed">{tool.desc}</p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Sidebar Widgets on Right */}
        <div className="space-y-6">
          {subscription?.plan === "free" && (
            <div className="glass-card bg-indigo-600 border-none relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-12 translate-x-12 blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                   <div className="p-2 bg-white/20 rounded-lg">
                    <Flame size={20} className="text-white fill-white" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-white/80">Premium Access</span>
                </div>
                <h4 className="text-2xl font-black text-white mb-4 tracking-tighter">Unlimited Architecting.</h4>
                <p className="text-white/70 text-sm mb-6">Unlock Smart AI Mode, unlimited workspace, and priority generation speeds.</p>
                <button className="w-full py-3 bg-white text-indigo-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-neutral-100 transition-colors shadow-2xl">
                  Upgrade — $2.99/mo
                </button>
              </div>
            </div>
          )}

          <div className="glass-card">
            <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-6">Recent Activity</h4>
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5"></div>
                  <div>
                    <div className="text-xs font-bold text-neutral-300">Generated Telegram Bot</div>
                    <div className="text-[10px] text-neutral-500 uppercase font-black tracking-tighter">Project "SupportMax" created 2h ago</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 py-2 text-[10px] font-black text-neutral-500 uppercase tracking-widest border border-white/5 rounded-lg hover:bg-white/5 transition-colors">
              View All logs
            </button>
          </div>

          <div className="glass-card flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                <ShieldCheck size={18} />
              </div>
              <span className="text-xs font-bold text-neutral-400">Security Guard</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}

