import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bot, Terminal, Copy, Check, Sparkles, Send, Zap, Menu, MessageSquare, AlertCircle } from "lucide-react";
import { fetchWithAuth } from "../lib/firebase";
import { toast } from "react-hot-toast";
import { cn } from "../lib/utils";

export default function TelegramBotGenerator() {
  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [copied, setCopied] = useState(false);
  
  const [formData, setFormData] = useState({
    botName: "",
    botType: "auto-reply",
    description: ""
  });

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.botName || !formData.description) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    setGeneratedCode("");
    
    try {
      const response = await fetchWithAuth("/api/ai/generate", {
        method: "POST",
        body: JSON.stringify({
          feature: "bot-generator",
          prompt: `Generate telegram bot: ${formData.botName}`,
          metadata: formData
        })
      });

      setGeneratedCode(response.result);
      toast.success("Bot code generated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate bot");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-10">
        <div className="space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
            <Zap size={12} className="fill-current" />
            V3.0 Intelligence
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none text-white">
            Telegram <span className="text-neutral-500">Bot</span> Generator
          </h1>
          <p className="text-neutral-400 font-medium">
            Generate production-ready Python Telegram bots in seconds. Just define your logic and download the code.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Input Form */}
        <div className="glass-card space-y-8 p-8">
          <form onSubmit={handleGenerate} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                <Bot size={14} /> Bot Identity Name
              </label>
              <input
                type="text"
                value={formData.botName}
                onChange={(e) => setFormData({ ...formData, botName: e.target.value })}
                placeholder="e.g. FadixaSupportBot"
                className="w-full bg-neutral-900 border border-white/5 rounded-xl px-5 py-4 text-white focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-neutral-600"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Bot Archetype</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "auto-reply", icon: MessageSquare, label: "Auto-Reply" },
                  { id: "menu", icon: Menu, label: "Menu UI" },
                  { id: "ai-chat", icon: Sparkles, label: "AI Brain" },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, botType: type.id })}
                    className={cn(
                      "flex flex-col items-center justify-center gap-3 p-4 rounded-xl border transition-all",
                      formData.botType === type.id
                        ? "bg-indigo-500/10 border-indigo-500 text-indigo-400"
                        : "bg-neutral-900 border-white/5 text-neutral-500 hover:border-white/20"
                    )}
                  >
                    <type.icon size={20} />
                    <span className="text-[9px] font-black uppercase tracking-widest">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                <Terminal size={14} /> Logic Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe exactly what your bot should do..."
                rows={6}
                className="w-full bg-neutral-900 border border-white/5 rounded-xl px-5 py-4 text-white focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-neutral-600 resize-none"
              />
            </div>

            <button
              disabled={loading}
              className="w-full py-5 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:grayscale"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Engineering Bot Logic...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Initiate Generation
                </>
              )}
            </button>
          </form>

          {/* Tips */}
          <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 flex gap-4">
            <AlertCircle size={20} className="text-orange-500 shrink-0" />
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Security Warning</p>
              <p className="text-[11px] text-neutral-400 leading-relaxed font-medium">
                Never hardcode your <span className="text-white">TELEGRAM_TOKEN</span> in the code. We generate code that expects your token as an environment variable for safety.
              </p>
            </div>
          </div>
        </div>

        {/* Output Area */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4">
             <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                <Terminal size={14} /> Generated Source Code
              </label>
              {generatedCode && (
                <button 
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copied" : "Copy Code"}
                </button>
              )}
          </div>

          <div className="relative group min-h-[500px]">
             <div className="absolute inset-0 bg-indigo-500/5 blur-3xl rounded-full opacity-30 group-hover:opacity-50 transition-opacity" />
             <div className="relative h-full bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden font-mono text-[13px] leading-relaxed select-all">
                {!generatedCode && !loading && (
                   <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-10 space-y-4 opacity-50 grayscale">
                      <Bot size={60} className="text-neutral-700" />
                      <div className="space-y-1">
                        <p className="text-sm font-black text-neutral-400 uppercase tracking-widest">Waiting for input</p>
                        <p className="text-[11px] text-neutral-600 uppercase tracking-widest font-bold">Configure your bot on the left to start</p>
                      </div>
                   </div>
                )}

                {loading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-20">
                     <div className="space-y-6 text-center">
                        <div className="relative">
                          <div className="w-16 h-16 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                          <Bot size={24} className="absolute inset-0 m-auto text-indigo-400 animate-pulse" />
                        </div>
                        <div className="space-y-2">
                           <p className="text-xs font-black uppercase tracking-[0.2em] text-white">Synthesizing Logic</p>
                           <div className="flex gap-1 justify-center">
                              {[1,2,3].map(i => (
                                <div key={i} className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>
                )}

                {generatedCode && (
                  <pre className="p-8 text-neutral-300 overflow-auto h-[600px] scrollbar-hide">
                    <code>{generatedCode}</code>
                  </pre>
                )}
             </div>
          </div>
          
          <AnimatePresence>
            {generatedCode && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <Check size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white uppercase tracking-widest">Deployment Ready</p>
                    <p className="text-[10px] text-neutral-500 uppercase font-black">Installation sequence generated</p>
                  </div>
                </div>
                <div className="bg-black/50 p-4 rounded-xl font-mono text-[12px] text-neutral-400 border border-white/5">
                  <span className="text-neutral-600"># Run this in your terminal:</span>
                  <div className="mt-2 text-emerald-400">$ pip install pyTelegramBotAPI python-dotenv</div>
                  <div className="mt-1 text-emerald-400">$ python bot.py</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
