import { fetchWithAuth } from "../lib/firebase";

export async function generateBotCode(name: string, type: string, description: string, isSmart: boolean = false) {
  const prompt = `
    Generate a clean, professional, and fully working modular Python Telegram bot project for a bot named "${name}".
    Bot Type: ${type}
    Description: ${description}
    AI Smart Mode: ${isSmart ? "ENABLED (Integrate advanced AI logic/responses using OpenAI/Gemini if applicable)" : "DISABLED"}
    
    Requirements:
    - Use python-telegram-bot (v20+) library.
    - Structure the output as THREE distinct files: main.py, config.py, and handlers.py.
    - Include a requirements.txt file.
    - Provide clear deployment instructions for Render/Railway in a separate README.md section.
    - Include helpful comments.
    - Include a placeholder for the API TOKEN in config.py.
    
    Return the output as a valid JSON object with the following structure:
    {
      "files": {
        "main.py": "content",
        "config.py": "content",
        "handlers.py": "content",
        "requirements.txt": "content",
        "README.md": "content"
      },
      "explanation": "Brief summary of what was generated"
    }
  `;

  return fetchWithAuth("/api/ai/generate", {
    method: "POST",
    body: JSON.stringify({
      feature: "bot-generator",
      prompt,
      config: { responseMimeType: "application/json" }
    })
  });
}

export async function generateAIPrompt(idea: string) {
  const prompt = `
    Create 3 highly detailed and optimized AI image generation prompts (Midjourney/DALL-E style) based on this idea: "${idea}".
    Also, provide 3 catchy YouTube thumbnail title suggestions related to this idea.
    
    Format the output in a clean markdown list.
  `;
 
  return fetchWithAuth("/api/ai/generate", {
    method: "POST",
    body: JSON.stringify({
      feature: "prompt-generator",
      prompt
    })
  }).then(res => res.content || res.text || res);
}
