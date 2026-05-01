import React, { useState } from "react";
import { MessageSquare, Sparkles, Copy, RefreshCw, Send, Check, Lightbulb, Image } from "lucide-react";
import { generateAIPrompt } from "../services/geminiService";
import ReactMarkdown from "react-markdown";
import { cn } from "../lib/utils";
import { db, auth, OperationType, handleFirestoreError } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { motion } from "motion/react";

export default function PromptGenerator() {
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedPrompts, setGeneratedPrompts] = useState("");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleGenerate = async () => {
    if (!idea) return;
    setLoading(true);
    setGeneratedPrompts("");
    setSaved(false);
    try {
      const result = await generateAIPrompt(idea);
      setGeneratedPrompts(result || "");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPrompts);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!auth.currentUser || !generatedPrompts) return;
    try {
      await addDoc(collection(db, "projects"), {
        userId: auth.currentUser.uid,
        name: idea.substring(0, 30) + "...",
        type: "prompt",
        content: generatedPrompts,
        description: idea,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setSaved(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "projects");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <section className="glass-card text-center py-12 px-8">
        <div className="w-16 h-16 bg-orange-500/20 text-orange-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Lightbulb size={32} />
        </div>
        <h3 className="text-3xl font-bold mb-4">Idea into Prompt</h3>
        <p className="text-neutral-400 mb-8 max-w-md mx-auto">
          Generate premium AI image prompts and viral YouTube title ideas from any rough sketch of a thought.
        </p>

        <div className="relative max-w-xl mx-auto">
          <textarea 
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="Type your core idea here (e.g. 'A futuristic city in the style of Cyberpunk with neon cats')"
            className="w-full glass-input h-32 pr-12 pt-4 resize-none text-lg"
          />
          <button 
            onClick={handleGenerate}
            disabled={loading || !idea}
            className="absolute bottom-4 right-4 p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
          >
            {loading ? <RefreshCw size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
      </section>

      {generatedPrompts && (
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card space-y-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles size={20} className="text-blue-400" />
              <h4 className="font-bold uppercase tracking-tight">Generated Inspiration</h4>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleCopy}
                className="p-2 glass hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-colors"
              >
                {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
              </button>
              <button 
                onClick={handleSave}
                className={cn(
                  "p-2 glass rounded-lg transition-colors",
                  saved ? "text-green-500" : "text-neutral-400 hover:text-white hover:bg-white/10"
                )}
              >
                {saved ? <Check size={18} /> : <MessageSquare size={18} />}
              </button>
            </div>
          </div>

          <div className="bg-neutral-900/50 rounded-xl p-6 border border-white/5 leading-relaxed">
            <div className="markdown-body prose prose-invert max-w-none">
              <ReactMarkdown>{generatedPrompts}</ReactMarkdown>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-center gap-3">
              <Image size={20} className="text-blue-400" />
              <span className="text-xs font-medium text-blue-300">Optimized for Midjourney v6</span>
            </div>
            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10 flex items-center gap-3">
              <Sparkles size={20} className="text-purple-400" />
              <span className="text-xs font-medium text-purple-300">Ready for DALL·E 3 High-Quality</span>
            </div>
          </div>
        </motion.section>
      )}
    </div>
  );
}
