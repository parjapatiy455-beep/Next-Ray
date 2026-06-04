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

// PWA routes served directly from the server to guarantee consistency
app.get("/manifest.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.json({
    name: "Next Ray — AI Companion",
    short_name: "Next Ray",
    description: "An advanced AI model client platform for free NVIDIA NIM models and multimodal Google Gemini API, including Google authentication and Chat completions.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    orientation: "any",
    icons: [
      {
        src: "/icon-pwa.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/icon-pwa.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  });
});

app.get("/sw.js", (req, res) => {
  res.setHeader("Content-Type", "application/javascript");
  res.send(`
    self.addEventListener('install', (e) => {
      self.skipWaiting();
    });

    self.addEventListener('activate', (e) => {
      e.waitUntil(clients.claim());
    });

    self.addEventListener('fetch', (e) => {
      e.respondWith(fetch(e.request));
    });
  `);
});

app.get("/icon-pwa.png", (req, res) => {
  res.sendFile(path.join(process.cwd(), "src/assets/images/next_ray_logo_1780536552543.png"));
});

// Image Generation API
app.post("/api/image/generate", async (req, res) => {
  try {
    const { prompt, aspectRatio } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: "Gemini API key is unconfigured. Please configure GEMINI_API_KEY." });
    }

    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: aspectRatio || '1:1',
      },
    });

    if (response.generatedImages?.[0]?.image?.imageBytes) {
      const base64Bytes = response.generatedImages[0].image.imageBytes;
      return res.json({ imageUrl: `data:image/jpeg;base64,${base64Bytes}` });
    } else {
      throw new Error("No image was returned by Gemini Imagen.");
    }
  } catch (error: any) {
    console.error("Image generation error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate image." });
  }
});

// 1. API: Server configurations
app.get("/api/config", (req, res) => {
  res.json({
    nvidiaConfigured: !!process.env.NVIDIA_API_KEY,
  });
});

// Server-side slug generation endpoint (similar to ChatGPT slug service)
app.post("/api/chats/slug", (req, res) => {
  const { title, id } = req.body;
  const sanitized = (title || 'New Conversation')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')     // remove non-alphanumeric except hyphen and space
    .replace(/[\s_]+/g, '-')       // replace spaces or underscore with single hyphen
    .replace(/^-+|-+$/g, '');      // trim leading/trailing hyphens
  
  const shortId = id ? id.substring(id.length - 6) : 'unknown';
  const slug = sanitized ? `${sanitized}-${shortId}` : shortId;
  res.json({ slug });
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
        model: modelId || "meta/llama-3.3-70b-instruct",
        messages: cleanedMessages,
        temperature: typeof temperature === "number" ? temperature : 0.2,
        max_tokens: typeof maxTokens === "number" ? maxTokens : 1024,
        stream: true,
      });
    } catch (err: any) {
      if (err.status === 404 || err.message?.includes("404")) {
        console.warn(`[Next Ray] Model ${modelId} returned 404. Falling back to meta/llama-3.3-70b-instruct`);
        stream = await openai.chat.completions.create({
          model: "meta/llama-3.3-70b-instruct",
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
