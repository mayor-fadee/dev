import React, { useState, useEffect } from "react";
import { Zap, Bot, MessageSquare, Terminal, Search, Trash2, ExternalLink, Calendar, Filter, MoreVertical, Code } from "lucide-react";
import { db, auth, OperationType, handleFirestoreError } from "../lib/firebase";
import { collection, query, where, getDocs, deleteDoc, doc, orderBy } from "firebase/firestore";
import { formatDate, cn } from "../lib/utils";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";
import toast from "react-hot-toast";

export default function Projects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, "projects"),
        where("userId", "==", auth.currentUser.uid),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const p = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(p);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, "projects");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      await deleteDoc(doc(db, "projects", id));
      setProjects(projects.filter(p => p.id !== id));
      if (selectedProject?.id === id) setSelectedProject(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `projects/${id}`);
    }
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "all" || p.type === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search your projects..." 
            className="glass-input pl-12"
          />
        </div>
        <div className="flex gap-2">
          {["all", "bot", "prompt", "api-test"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                filter === f ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "glass text-neutral-400 hover:text-neutral-100"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Project List */}
        <div className="lg:col-span-1 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-32 glass-card animate-pulse"></div>
            ))
          ) : filteredProjects.length === 0 ? (
            <div className="h-64 glass-card border-dashed flex flex-col items-center justify-center text-neutral-600 text-center space-y-4">
              <Code size={40} className="opacity-10" />
              <p>No projects found.</p>
            </div>
          ) : (
            filteredProjects.map((project) => (
              <motion.div
                layoutId={project.id}
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className={cn(
                  "glass-card p-5 cursor-pointer hover:border-indigo-500/30 transition-all group relative overflow-hidden",
                  selectedProject?.id === project.id ? "border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500/20" : ""
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={cn(
                    "p-2 rounded-lg",
                    project.type === "bot" ? "bg-indigo-500/10 text-indigo-400" : 
                    project.type === "prompt" ? "bg-orange-500/10 text-orange-400" : "bg-purple-500/10 text-purple-400"
                  )}>
                    {project.type === "bot" ? <Bot size={18} /> : 
                     project.type === "prompt" ? <MessageSquare size={18} /> : <Terminal size={18} />}
                  </div>
                  <button 
                    onClick={(e) => handleDelete(e, project.id)}
                    className="p-1.5 rounded-lg text-neutral-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <h4 className="font-bold text-neutral-100 mb-1 truncate pr-4">{project.name}</h4>
                <div className="flex items-center gap-4 text-[10px] uppercase font-black tracking-widest text-neutral-500">
                  <div className="flex items-center gap-1">
                    <Calendar size={10} />
                    <span>{project.createdAt?.toDate ? formatDate(project.createdAt.toDate()) : "Date Unknown"}</span>
                  </div>
                </div>
                {selectedProject?.id === project.id && (
                  <motion.div layoutId="active-indicator" className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></motion.div>
                )}
              </motion.div>
            ))
          )}
        </div>

        {/* Project Detail */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedProject ? (
              <motion.div
                key={selectedProject.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass-card h-full min-h-[600px] flex flex-col"
              >
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                       <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {selectedProject.type}
                      </span>
                      <span className="text-xs text-neutral-500">
                        Created {selectedProject.createdAt?.toDate ? formatDate(selectedProject.createdAt.toDate()) : "Just now"}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold">{selectedProject.name}</h3>
                  </div>
                  <button 
                    onClick={() => {
                      let contentToCopy = selectedProject.content;
                      try {
                        const parsed = JSON.parse(selectedProject.content);
                        if (parsed.files) {
                           contentToCopy = parsed.files["main.py"] || Object.values(parsed.files)[0];
                        }
                      } catch(e) {}
                      navigator.clipboard.writeText(contentToCopy);
                      toast.success("Main code copied!");
                    }}
                    className="glass-button bg-indigo-600 text-white border-none hover:bg-indigo-500"
                  >
                    <ExternalLink size={16} />
                    <span>Copy Project</span>
                  </button>
                </div>

                {selectedProject.description && (
                  <div className="mb-8 p-4 rounded-xl bg-white/5 border border-white/5 text-sm text-neutral-400 italic">
                    {selectedProject.description}
                  </div>
                )}

                <div className="flex-1 bg-neutral-900 rounded-xl p-6 border border-white/5 font-mono text-sm overflow-auto custom-scrollbar">
                  <div className="markdown-body prose prose-invert max-w-none">
                    {(() => {
                      try {
                        const content = JSON.parse(selectedProject.content);
                        if (content.files) {
                          return (
                            <div className="space-y-8">
                              {Object.entries(content.files).map(([name, code]: [string, any]) => (
                                <div key={name} className="space-y-2">
                                  <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{name}</div>
                                  <pre className="p-4 bg-black/40 rounded-lg border border-white/5 overflow-x-auto">
                                    <code>{code}</code>
                                  </pre>
                                </div>
                              ))}
                            </div>
                          );
                        }
                      } catch (e) {}
                      return <ReactMarkdown>{selectedProject.content}</ReactMarkdown>;
                    })()}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="glass-card h-full flex flex-col items-center justify-center text-neutral-600 text-center space-y-6">
                <div className="w-20 h-20 rounded-full border-2 border-neutral-800 flex items-center justify-center opacity-30">
                  <ExternalLink size={40} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-neutral-400 mb-2">No Project Selected</h3>
                  <p className="max-w-xs text-neutral-500">
                    Select a project from the left sidebar to view its details and generated code.
                  </p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
