import React, { useState } from "react";
import { Terminal, Send, Play, RefreshCw, Trash2, Globe, Clock, ShieldCheck, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";

export default function APITester() {
  const [url, setUrl] = useState("https://jsonplaceholder.typicode.com/posts/1");
  const [method, setMethod] = useState("GET");
  const [headers, setHeaders] = useState('{\n  "Content-Type": "application/json"\n}');
  const [body, setBody] = useState('{\n  "title": "foo",\n  "body": "bar",\n  "userId": 1\n}');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("response");

  const handleSend = async () => {
    setLoading(true);
    setResponse(null);
    try {
      let parsedHeaders = {};
      let parsedBody = {};
      
      try {
        parsedHeaders = JSON.parse(headers);
        if (method !== "GET" && body) {
          parsedBody = JSON.parse(body);
        }
      } catch (err) {
        alert("Invalid JSON in headers or body");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          method,
          headers: parsedHeaders,
          body: parsedBody
        }),
      });

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      console.error(err);
      setResponse({ error: "Failed to connect to proxy server" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card">
        <div className="flex gap-2 p-2 bg-neutral-900 rounded-xl border border-white/10">
          <select 
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="bg-transparent border-none outline-none font-bold text-indigo-400 px-4 py-2 cursor-pointer"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>
          <div className="h-6 w-px bg-white/10 my-auto"></div>
          <input 
            type="text" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none px-4 py-2 font-mono text-sm"
            placeholder="Enter API Endpoint URL"
          />
          <button 
            onClick={handleSend}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
            <span>Send</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Config */}
        <section className="glass-card space-y-6">
          <div className="flex items-center gap-3">
            <Globe size={18} className="text-blue-400" />
            <h4 className="font-bold uppercase tracking-tight text-sm">Request Setup</h4>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">Headers (JSON)</label>
              <textarea 
                value={headers}
                onChange={(e) => setHeaders(e.target.value)}
                className="w-full bg-neutral-900/50 rounded-xl p-4 font-mono text-sm h-32 border border-white/5 outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
            
            {method !== "GET" && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">Body (JSON)</label>
                <textarea 
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full bg-neutral-900/50 rounded-xl p-4 font-mono text-sm h-64 border border-white/5 outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>
            )}
          </div>
        </section>

        {/* Response View */}
        <section className="glass-card flex flex-col h-[600px]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Terminal size={18} className="text-purple-400" />
              <h4 className="font-bold uppercase tracking-tight text-sm">Response Outcome</h4>
            </div>
            {response && (
              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-green-500/10 text-green-500">
                  <ShieldCheck size={14} />
                  <span>{response.status}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-blue-500/10 text-blue-500">
                  <Clock size={14} />
                  <span>{response.responseTime}ms</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 bg-neutral-900/50 rounded-xl border border-white/5 overflow-hidden flex flex-col">
            <div className="flex border-b border-white/5">
              <button 
                onClick={() => setActiveTab("response")}
                className={cn(
                  "px-6 py-3 text-xs font-bold uppercase tracking-widest transition-colors",
                  activeTab === "response" ? "text-blue-400 bg-white/5" : "text-neutral-500 hover:text-neutral-300"
                )}
              >
                Data
              </button>
              <button 
                onClick={() => setActiveTab("headers")}
                className={cn(
                  "px-6 py-3 text-xs font-bold uppercase tracking-widest transition-colors",
                  activeTab === "headers" ? "text-blue-400 bg-white/5" : "text-neutral-500 hover:text-neutral-300"
                )}
              >
                Headers
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-4 font-mono text-sm custom-scrollbar">
              {!response && !loading && (
                <div className="h-full flex flex-col items-center justify-center text-neutral-600 text-center space-y-4">
                  <Terminal size={40} className="opacity-10" />
                  <p>Send a request to see the response data.</p>
                </div>
              )}

              {loading && (
                <div className="space-y-4 opacity-50">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-4 bg-white/5 rounded animate-pulse" style={{ width: `${Math.random() * 60 + 40}%` }}></div>
                  ))}
                </div>
              )}

              {response && (
                <pre className="whitespace-pre-wrap break-all text-neutral-300">
                  {activeTab === "response" 
                    ? JSON.stringify(response.data, null, 2) 
                    : JSON.stringify(response.headers, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
