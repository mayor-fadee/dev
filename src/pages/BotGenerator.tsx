import React, { useState } from "react";
import { Bot, Sparkles, Copy, Download, Save, RefreshCw, Send, Check, Terminal, FileCode, Archive, AlertTriangle, ShieldCheck } from "lucide-react";
import { generateBotCode } from "../services/geminiService";
import { cn } from "../lib/utils";
import { db, auth, OperationType, handleFirestoreError } from "../lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import toast from "react-hot-toast";
import JSZip from "jszip";
import { useSubscription } from "../hooks/useSubscription";

export default function BotGenerator() {
  const [botName, setBotName] = useState("");
  const [botType, setBotType] = useState("Auto-reply");
  const [description, setDescription] = useState("");
  const [isSmartMode, setIsSmartMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedData, setGeneratedData] = useState<any>(null);
  const [activeFile, setActiveFile] = useState("main.py");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const { subscription, incrementUsage } = useSubscription();

  const handleGenerate = async () => {
    if (!botName) return;
    
    if (subscription && subscription.plan === "free" && subscription.generationsUsed >= subscription.maxGenerations) {
      toast.error("Daily limit reached. Upgrade to premium for unlimited generations!");
      return;
    }

    setLoading(true);
    setGeneratedData(null);
    setSaved(false);
    
    try {
      const result = await generateBotCode(botName, botType, description, isSmartMode);
      setGeneratedData(result);
      incrementUsage();
      toast.success("Bot logic generated successfully!");
    } catch (error: any) {
      toast.error("Generation failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedData) return;
    navigator.clipboard.writeText(generatedData.files[activeFile]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard");
  };

  const handleExportZip = async () => {
    if (!generatedData) return;
    const zip = new JSZip();
    
    Object.entries(generatedData.files).forEach(([name, content]: [string, any]) => {
      zip.file(name, content);
    });
    
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${botName.toLowerCase().replace(/\s+/g, "_")}_project.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Project exported as ZIP");
  };

  const handleSave = async () => {
    if (!auth.currentUser || !generatedData) return;
    
    // Limit projects for free users
    if (subscription?.plan === "free") {
        const q = query(collection(db, "projects"), where("userId", "==", auth.currentUser.uid));
        const snap = await getDocs(q);
        if (snap.size >= 5) {
            toast.error("Free users are limited to 5 saved projects. Upgrade to premium!");
            return;
        }
    }

    try {
      await addDoc(collection(db, "projects"), {
        userId: auth.currentUser.uid,
        name: botName,
        type: "bot",
        content: JSON.stringify(generatedData),
        description: description,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setSaved(true);
      toast.success("Project saved to dashboard");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "projects");
    }
  };

  const files = generatedData ? Object.keys(generatedData.files) : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-20">
      {/* Configuration Section */}
      <section className="lg:col-span-5 glass-card space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
            <Bot size={20} />
          </div>
          <h3 className="text-xl font-bold uppercase tracking-tight">Bot Architect</h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Bot Identity</label>
            <input 
              type="text" 
              value={botName}
              onChange={(e) => setBotName(e.target.value)}
              placeholder="e.g. MySuperBot" 
              className="glass-input"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Template Type</label>
            <select 
              value={botType}
              onChange={(e) => setBotType(e.target.value)}
              className="glass-input bg-[#0d0d0f] border-none appearance-none cursor-pointer"
            >
              <option value="Auto-reply">Standard Auto-reply</option>
              <option value="Advanced AI">Advanced GPT-style AI</option>
              <option value="E-commerce">E-commerce / Order Bot</option>
              <option value="Admin Tools">Admin / Utility Bot</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Behavioral Prompt</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain how the bot should behave..." 
              className="glass-input h-32 resize-none"
            />
          </div>

          {/* AI Smart Mode Toggle */}
          <div className="p-4 rounded-xl bg-indigo-600/5 border border-indigo-500/20 flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg transition-colors",
                isSmartMode ? "bg-amber-500/20 text-amber-500" : "bg-neutral-800 text-neutral-500"
              )}>
                <Sparkles size={18} fill={isSmartMode ? "currentColor" : "none"} />
              </div>
              <div>
                <div className="text-sm font-bold text-neutral-200">AI Smart Mode</div>
                <div className="text-[10px] text-neutral-500 uppercase font-black tracking-widest">Enhanced Logic Generation</div>
              </div>
            </div>
            <button 
              disabled={subscription?.plan === "free"}
              onClick={() => setIsSmartMode(!isSmartMode)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                isSmartMode ? "bg-amber-500" : "bg-neutral-800",
                subscription?.plan === "free" && "opacity-50 cursor-not-allowed"
              )}
            >
              <span className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                isSmartMode ? "translate-x-6" : "translate-x-1"
              )} />
            </button>
          </div>
          
          {subscription?.plan === "free" && (
            <p className="text-[10px] text-center text-amber-500 font-bold uppercase tracking-tighter">
              <AlertTriangle size={10} className="inline mr-1" />
              Upgrade to unlock AI Smart Mode
            </p>
          )}

          <button 
            onClick={handleGenerate}
            disabled={loading || !botName}
            className={cn(
              "w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl active:scale-[0.98]",
              loading ? "bg-indigo-600/50 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30"
            )}
          >
            {loading ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>Constructing Modules...</span>
              </>
            ) : (
              <>
                <FileCode size={18} className="fill-white" />
                <span>Assemble Project</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* Code Preview Section */}
      <section className="lg:col-span-7 flex flex-col h-[700px] glass-card overflow-hidden p-0">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/2">
          <div className="flex items-center gap-3">
             <div className="flex gap-1.5 mr-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50"></div>
            </div>
            <Terminal size={16} className="text-neutral-500" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-400">Modular Filesystem</h3>
          </div>
          <div className="flex gap-2">
            {generatedData && (
              <>
                <button 
                  onClick={handleCopy}
                  className="glass-button h-9 px-3 text-xs bg-transparent border-white/10"
                >
                  {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  <span>Copy</span>
                </button>
                <button 
                  onClick={handleExportZip}
                  className="glass-button h-9 px-3 text-xs bg-indigo-600 border-none hover:bg-indigo-500 shadow-lg shadow-indigo-600/20"
                >
                  <Archive size={14} />
                  <span>ZIP Export</span>
                </button>
                <button 
                  onClick={handleSave}
                  className={cn(
                    "glass-button h-9 px-3 text-xs border-white/10",
                    saved ? "text-green-500" : ""
                  )}
                >
                  {saved ? <Check size={14} /> : <Save size={14} />}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* File Explorer Sidebar */}
          <div className="w-40 border-r border-white/5 bg-black/20 overflow-y-auto">
            {files.map(file => (
              <button
                key={file}
                onClick={() => setActiveFile(file)}
                className={cn(
                  "w-full text-left px-4 py-3 text-xs font-mono transition-colors border-b border-white/5 flex items-center gap-2",
                  activeFile === file ? "bg-indigo-600/10 text-indigo-400 border-r-2 border-r-indigo-500" : "text-neutral-500 hover:bg-white/5"
                )}
              >
                <FileCode size={12} />
                <span className="truncate">{file}</span>
              </button>
            ))}
          </div>

          {/* Editor Area */}
          <div className="flex-1 bg-black/40 font-mono text-sm overflow-auto p-6 relative custom-scrollbar">
            {!generatedData && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-neutral-600 text-center px-6">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-indigo-500/10 blur-2xl rounded-full"></div>
                  <Bot size={64} className="relative z-10 opacity-10" />
                </div>
                <p className="font-bold text-lg text-neutral-700">Waiting for instructions...</p>
                <p className="text-xs mt-2 opacity-50 uppercase tracking-widest">Input bot details to generate architecture</p>
              </div>
            )}

            {loading && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <RefreshCw size={14} className="animate-spin text-indigo-500" />
                  <span className="text-xs text-indigo-400 font-bold uppercase tracking-widest">AI architect is drawing...</span>
                </div>
                {[1, 2, 3, 4, 5, 6, 7].map(i => (
                  <div key={i} className="h-4 bg-white/5 rounded animate-pulse" style={{ width: `${Math.random() * 60 + 40}%` }}></div>
                ))}
              </div>
            )}

            {generatedData && (
              <pre className="text-neutral-300 leading-relaxed whitespace-pre-wrap">
                <code className="text-indigo-400"># {activeFile}</code>
                {"\n"}
                {generatedData.files[activeFile]}
              </pre>
            )}
          </div>
        </div>

        {generatedData && (
          <div className="px-6 py-3 border-t border-white/5 bg-emerald-500/5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500">
              <ShieldCheck size={14} />
              <span>Project Build Ready</span>
            </div>
            <button className="text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-white transition-colors">
              Deploy to Render →
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

