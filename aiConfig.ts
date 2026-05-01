
export interface AIModelConfig {
  feature: string;
  model: string;
  description: string;
  status: "Active" | "Maintenance" | "Offline";
}

export const CENTRAL_AI_CONFIG: Record<string, AIModelConfig> = {
  "bot-generator": { 
    feature: "Bot Generator",
    model: "gemini-2.5-flash", 
    description: "High-reasoning code generation for modular bots",
    status: "Active" 
  },
  "prompt-generator": { 
    feature: "Prompt Generator",
    model: "gemini-2.5-flash-lite", 
    description: "Fast creative text generation for thumbnails/ideas",
    status: "Active" 
  },
  "api-helper": { 
    feature: "API Helper",
    model: "gemini-2.0-flash-lite", 
    description: "Lightweight context analysis for REST debugging",
    status: "Active" 
  },
  "admin-ai": { 
    feature: "Admin Intel",
    model: "gemini-2.5-flash", 
    description: "Deep analytics reasoning for platform insights",
    status: "Active" 
  }
};
