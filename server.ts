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
    const { messages, temperature, maxTokens, modelId, customKey, systemInstruction } = req.body;
    
    // Key hierarchy: user provided Custom Key in App Settings UI > server environment key
    const rawKey = customKey || process.env.NVIDIA_API_KEY;
    const apiKey = (rawKey && rawKey !== "undefined" && rawKey !== "null") ? rawKey : "";

    console.log(`[Next Ray] Incoming request. Mode: ${modelId}. Key length: ${apiKey.length}. Messages count: ${messages?.length}`);

    if (!apiKey) {
      console.warn("[Next Ray] Rejected request: NVIDIA API Key is missing/unconfigured.");
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      const errorMsg = "NVIDIA API Key is unconfigured. Please configure NVIDIA_API_KEY in the cloud run environment / Secrets panel, or paste a Custom NIM Session Key in the Options panel.";
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

    const parsedMessages = messages || [];
    const cleanedMessages: any[] = [];

    // Inject system instruction if present
    if (systemInstruction) {
      cleanedMessages.push({
        role: "system",
        content: systemInstruction,
      });
    }

    // Strip out non-OpenAI properties if they exist and align roles
    parsedMessages.forEach((m: any) => {
      cleanedMessages.push({
        role: m.role === "model" || m.role === "assistant" ? "assistant" : "user",
        content: m.content || ""
      });
    });

    // Create a streaming completion using the OpenAI SDK
    let stream;
    try {
      stream = await openai.chat.completions.create({
        model: modelId || "deepseek-ai/deepseek-r1",
        messages: cleanedMessages,
        temperature: typeof temperature === "number" ? temperature : 0.2,
        max_tokens: typeof maxTokens === "number" ? maxTokens : 1024,
        stream: true,
      });
    } catch (err: any) {
      if (err.status === 404 || err.message?.includes("404")) {
        console.warn(`[Next Ray] Model ${modelId} returned 404. Falling back to deepseek-ai/deepseek-r1`);
        stream = await openai.chat.completions.create({
          model: "deepseek-ai/deepseek-r1",
          messages: cleanedMessages,
          temperature: typeof temperature === "number" ? temperature : 0.2,
          max_tokens: typeof maxTokens === "number" ? maxTokens : 1024,
          stream: true,
        });
      } else {
        throw err;
      }
    }

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
    let userMsg = error.message || "NVIDIA service error";
    
    if (error.status === 410 || userMsg.includes("410") || userMsg.toLowerCase().includes("gone")) {
      userMsg = "NVIDIA API Error (410 Gone): Your NVIDIA API Key seems inactive, has run out of its free trial credits, is expired/revoked, or you're querying a retired model. Please ensure your API Key is correct in your Cloud Run Secrets, or paste a new, active NIM key in the **Options** drawer.";
    }

    if (!res.headersSent) {
      res.status(500).json({ error: userMsg });
    } else {
      res.write(`data: ${JSON.stringify({ error: userMsg })}\n\n`);
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
