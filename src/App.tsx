import React, { useState, useEffect } from "react";
import { 
  Bot, 
  Terminal, 
  Zap, 
  MessageSquare, 
  Settings, 
  LogOut, 
  LayoutDashboard, 
  Plus, 
  Key,
  Flame,
  Menu,
  X,
  Shield
} from "lucide-react";
import { auth } from "./lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { cn } from "./lib/utils";
import { AnimatePresence, motion } from "motion/react";

import { Toaster } from "react-hot-toast";
import { useSubscription } from "./hooks/useSubscription";

// Pages
import Dashboard from "./pages/Dashboard";
import TelegramBotGenerator from "./pages/TelegramBotGenerator";
import APITester from "./pages/APITester";
import PromptGenerator from "./pages/PromptGenerator";
import Projects from "./pages/Projects";
import Auth from "./pages/Auth";
import AdminPanel from "./pages/AdminPanel";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { subscription, refresh } = useSubscription();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "telegram-bot", label: "Bot Engine", icon: Bot },
    { id: "api-tester", label: "API Tester", icon: Terminal },
    { id: "prompt-generator", label: "Idea Prompts", icon: MessageSquare },
    { id: "projects", label: "My Projects", icon: Zap },
  ];

  if (subscription?.isAdmin) {
    menuItems.push({ id: "admin", label: "Admin Panel", icon: Shield });
  }

  const handleSignOut = () => signOut(auth);

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-neutral-100 flex overflow-hidden">
      {/* Mobile Menu Trigger */}
      <button 
        onClick={() => setIsSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 glass rounded-lg"
      >
        <Menu size={20} />
      </button>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:relative inset-y-0 left-0 w-64 border-r border-white/10 bg-[#0d0d0f] z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col p-4">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap size={20} className="text-white fill-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Fadixa <span className="text-indigo-400">Devs</span></h1>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden ml-auto p-1.5 hover:bg-white/5 rounded-lg"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="flex-1 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id);
                  setIsSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 group",
                  currentPage === item.id 
                    ? "bg-white/10 text-white" 
                    : "text-neutral-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon size={18} className={cn(
                  "transition-colors",
                  currentPage === item.id ? "text-indigo-400" : "group-hover:text-white"
                )} />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="p-4 mb-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] text-neutral-400 uppercase tracking-widest">Usage Plan</span>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold",
                  subscription?.plan === "premium" ? "bg-amber-500/20 text-amber-500" : "bg-indigo-500/20 text-indigo-400"
                )}>
                  {subscription?.plan?.toUpperCase() || "FREE"}
                </span>
              </div>
              <div className="text-[10px] text-neutral-300 mb-2">
                {subscription?.plan === "premium" ? "Unlimited generations" : `${subscription?.generationsUsed || 0}/${subscription?.maxGenerations || 3} generations used`}
              </div>
              <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-1000" 
                  style={{ width: subscription?.plan === "premium" ? "100%" : `${((subscription?.generationsUsed || 0) / (subscription?.maxGenerations || 3)) * 100}%` }}
                ></div>
              </div>
              {subscription?.plan !== "premium" && (
                <button className="w-full mt-3 py-2 rounded-lg bg-indigo-600 text-[11px] font-bold hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20">
                  Upgrade to Premium
                </button>
              )}
            </div>
            
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-neutral-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
            >
              <LogOut size={18} />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <Toaster position="bottom-right" toastOptions={{
        style: {
          background: '#171717',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.1)',
        },
      }} />
      <main className="flex-1 relative overflow-y-auto px-4 lg:px-10 py-10">
        <div className="max-w-5xl mx-auto">
          <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">
                {menuItems.find(i => i.id === currentPage)?.label}
              </h2>
              <p className="text-neutral-400">
                Welcome back, {user.displayName || user.email?.split('@')[0]}
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-sm font-medium">
                <span className={cn(
                  "w-2 h-2 rounded-full animate-pulse",
                  subscription?.plan === "premium" ? "bg-amber-500" : "bg-indigo-500"
                )}></span>
                <span>{subscription?.plan === "premium" ? "Premium Plan" : "Free Plan"}</span>
              </div>
              <button className="p-2.5 glass rounded-xl hover:bg-white/10 transition-colors">
                <Settings size={20} />
              </button>
            </div>
          </header>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {currentPage === "dashboard" && <Dashboard onNav={setCurrentPage} />}
              {currentPage === "telegram-bot" && <TelegramBotGenerator />}
              {currentPage === "api-tester" && <APITester />}
              {currentPage === "prompt-generator" && <PromptGenerator />}
              {currentPage === "projects" && <Projects />}
              {currentPage === "admin" && <AdminPanel />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
