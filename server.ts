import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import OpenAI from "openai";

// Ensure env variables are loaded
dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: "20mb" }));

// 1. API: Server configurations
app.get("/api/config", (req, res) => {
  res.json({
    nvidiaConfigured: !!process.env.NVIDIA_API_KEY,
  });
});

// 2. API: Safe NVIDIA completion with streaming proxy using OpenAI SDK
app.post("/api/chat/nvidia", async (req, res) => {
  try {
    const { messages, temperature, maxTokens, modelId, customKey } = req.body;
    
    // Key hierarchy: user provided Custom Key in App Settings UI > server environment key
    const apiKey = customKey || process.env.NVIDIA_API_KEY;

    if (!apiKey) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      const errorMsg = "NVIDIA API Key is unconfigured. Please configure NVIDIA_API_KEY in the cloud run environment, local .env file, or paste a Custom NIM Session Key in the Options panel.";
      res.write(`data: ${JSON.stringify({ error: errorMsg })}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }

    // Set up SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Initialize OpenAI SDK pointing to NVIDIA's base URL
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://integrate.api.nvidia.com/v1",
    });

    // Strip out non-OpenAI properties if they exist and align roles
    const cleanedMessages = messages.map((m: any) => ({
      role: m.role === "model" || m.role === "assistant" ? "assistant" : "user",
      content: m.content
    }));

    // Create a streaming completion using the OpenAI SDK
    const stream = await openai.chat.completions.create({
      model: modelId || "meta/llama-3.3-70b-instruct",
      messages: cleanedMessages,
      temperature: typeof temperature === "number" ? temperature : 0.7,
      max_tokens: typeof maxTokens === "number" ? maxTokens : 1024,
      stream: true,
    });

    for await (const chunk of stream) {
      const textToken = chunk.choices[0]?.delta?.content;
      if (textToken) {
        res.write(`data: ${JSON.stringify({ text: textToken })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error: any) {
    console.error("NVIDIA API error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || "NVIDIA service error" });
    } else {
      res.write(`data: ${JSON.stringify({ error: `NVIDIA Service Error: ${error.message || "Unknown error"}` })}\n\n`);
      res.write("data: [DONE]\n\n");
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
