import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

// Ensure env variables are loaded
dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: "20mb" }));

// Initialize Google Gemini Client with AI Studio recommended configuration
const geminiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (geminiApiKey) {
  ai = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// 1. API: Server configurations
app.get("/api/config", (req, res) => {
  res.json({
    nvidiaConfigured: !!process.env.NVIDIA_API_KEY,
    geminiConfigured: !!process.env.GEMINI_API_KEY,
  });
});

// 2. API: Safe Gemini Completion with SSE streaming
app.post("/api/chat/gemini", async (req, res) => {
  try {
    const { messages, systemInstruction, temperature, maxTokens, modelId } = req.body;

    if (!ai) {
      return res.status(500).json({ error: "Gemini API Client is not configured on the server." });
    }

    // Set up SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Format messages for @google/genai SDK
    // Our client sends OpenAI-like format or simple structures.
    // Gemni contents can be string or Content objects. Let's build content parts.
    const lastUserMessage = messages[messages.length - 1];
    
    // We can pass the thread context or just the conversation history.
    // Let's pass the conversation history properly formatted!
    const formattedContents: any[] = [];
    
    // For simplicity and extremely robust history feeding:
    for (const msg of messages) {
      const parts: any[] = [];
      
      // If there's file inlineData
      if (msg.fileData && msg.fileType) {
        // Extract base64 clean string
        const base64Data = msg.fileData.split(",")[1] || msg.fileData;
        parts.push({
          inlineData: {
            data: base64Data,
            mimeType: msg.fileType
          }
        });
      }
      
      parts.push({ text: msg.content });

      formattedContents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: parts
      });
    }

    const mId = modelId || "gemini-3.5-flash";

    const responseStream = await ai.models.generateContentStream({
      model: mId,
      contents: formattedContents,
      config: {
        systemInstruction: systemInstruction || "You are Next Ray, an advanced and polite AI companion.",
        temperature: typeof temperature === "number" ? temperature : 0.7,
        maxOutputTokens: typeof maxTokens === "number" ? maxTokens : 2048,
      },
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error: any) {
    console.error("Gemini stream error:", error);
    // Write error output if we are midway in stream, or return status
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || "Gemini streaming completed with server error" });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message || "Stream interrupted by server error" })}\n\n`);
      res.end();
    }
  }
});

// 3. API: Safe NVIDIA completion with streaming proxy
app.post("/api/chat/nvidia", async (req, res) => {
  try {
    const { messages, temperature, maxTokens, modelId, customKey } = req.body;
    
    // Key hierarchy: user provided Custom Key in App Settings UI > server environment key
    const apiKey = customKey || process.env.NVIDIA_API_KEY;

    if (!apiKey) {
      return res.status(400).json({ 
        error: "NVIDIA API Key not configured. Please add NVIDIA_API_KEY in the Secrets panel, or provide it in the App Settings panel." 
      });
    }

    // Set up SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Clean up messages to feed into standard OpenAI-compatible format
    const cleanedMessages = messages.map((m: any) => ({
      role: m.role,
      content: m.content
    }));

    // Free NVIDIA NIM completions endpoint
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelId || "meta/llama-3.1-405b-instruct",
        messages: cleanedMessages,
        temperature: typeof temperature === "number" ? temperature : 0.7,
        max_tokens: typeof maxTokens === "number" ? maxTokens : 1024,
        stream: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {}

      const msg = errorJson?.error?.message || errorText || "Unknown NVIDIA API gateway error";
      res.write(`data: ${JSON.stringify({ error: `NVIDIA Service Error: ${msg}` })}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      res.write(`data: ${JSON.stringify({ error: "Could not establish readable stream from NVIDIA gate." })}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      // Keep last incomplete line in buffer
      buffer = lines.pop() || "";

      for (const line of lines) {
        const cleanLine = line.trim();
        if (!cleanLine) continue;

        // Forward raw OpenAI chunks or process them
        if (cleanLine.startsWith("data:")) {
          const dataContent = cleanLine.substring(5).trim();
          if (dataContent === "[DONE]") {
            res.write("data: [DONE]\n\n");
            continue;
          }

          try {
            const parsed = JSON.parse(dataContent);
            const textToken = parsed.choices?.[0]?.delta?.content;
            if (textToken) {
              res.write(`data: ${JSON.stringify({ text: textToken })}\n\n`);
            }
          } catch (e) {
            // If parsing fails, just forward raw line in data wrapper
            res.write(`${cleanLine}\n\n`);
          }
        }
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error: any) {
    console.error("NVIDIA proxy error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || "NVIDIA proxy stream error" });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message || "NVIDIA server gateway interrupted" })}\n\n`);
      res.end();
    }
  }
});

// Configure Vite middleware in development or static hosting in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Next Ray Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
