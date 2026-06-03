export async function onRequestPost(context: any): Promise<Response> {
  try {
    const req = context.request;
    const body: any = await req.json();
    const { messages, temperature, maxTokens, modelId, customKey, systemInstruction } = body;

    // Key hierarchy: user provided Custom Key in App Settings UI > Cloudflare env secret
    const rawKey = customKey || context.env?.NVIDIA_API_KEY;
    const apiKey = (rawKey && rawKey !== "undefined" && rawKey !== "null") ? rawKey : "";

    if (!apiKey) {
      const errorMsg = "NVIDIA API Key is unconfigured. Please configure NVIDIA_API_KEY in Cloudflare Pages Variables, or paste a Custom NIM Session Key in the Options panel.";
      return new Response(`data: ${JSON.stringify({ error: errorMsg })}\n\ndata: [DONE]\n\n`, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        }
      });
    }

    const parsedMessages = messages || [];
    const cleanedMessages: any[] = [];

    if (systemInstruction) {
      cleanedMessages.push({
        role: "system",
        content: systemInstruction,
      });
    }

    parsedMessages.forEach((m: any) => {
      cleanedMessages.push({
        role: m.role === "model" || m.role === "assistant" ? "assistant" : "user",
        content: m.content || ""
      });
    });

    let response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelId || "meta/llama-3.3-70b-instruct",
        messages: cleanedMessages,
        temperature: typeof temperature === "number" ? temperature : 0.2,
        max_tokens: typeof maxTokens === "number" ? maxTokens : 1024,
        stream: true,
      }),
    });

    if (response.status === 404) {
      console.warn(`[Next Ray Worker] Model ${modelId} returned 404. Falling back to meta/llama-3.3-70b-instruct`);
      response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "meta/llama-3.3-70b-instruct",
          messages: cleanedMessages,
          temperature: typeof temperature === "number" ? temperature : 0.2,
          max_tokens: typeof maxTokens === "number" ? maxTokens : 1024,
          stream: true,
        }),
      });
    }

    if (!response.ok) {
      const errText = await response.text();
      let userMsg = errText || "NVIDIA gateway error";
      try {
        const errJson = JSON.parse(errText);
        userMsg = errJson.error?.message || errJson.error || userMsg;
      } catch (e) {}

      if (response.status === 410 || userMsg.includes("410") || userMsg.toLowerCase().includes("gone")) {
        userMsg = "NVIDIA API Error (410 Gone): Your NVIDIA API Key seems inactive, has run out of its free trial credits, is expired/revoked, or you're querying a retired model. Please ensure your API Key is correct inside Cloudflare Variables, or paste a new, active NIM key in the Options drawer.";
      }

      return new Response(`data: ${JSON.stringify({ error: userMsg })}\n\ndata: [DONE]\n\n`, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        }
      });
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = "";
        try {
          while (true) {
            const { done, value } = await reader!.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;
              if (trimmed.startsWith("data:")) {
                const dataStr = trimmed.slice(5).trim();
                if (dataStr === "[DONE]") {
                  controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                  continue;
                }

                try {
                  const json = JSON.parse(dataStr);
                  const token = json.choices?.[0]?.delta?.content || "";
                  if (token) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: token })}\n\n`));
                  }
                } catch (e) {
                  // ignore parse issues of individual lines
                }
              }
            }
          }
          if (buffer) {
            const trimmed = buffer.trim();
            if (trimmed.startsWith("data:")) {
              const dataStr = trimmed.slice(5).trim();
              if (dataStr !== "[DONE]") {
                try {
                  const json = JSON.parse(dataStr);
                  const token = json.choices?.[0]?.delta?.content || "";
                  if (token) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: token })}\n\n`));
                  }
                } catch (e) {}
              }
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (e: any) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: e.message || "Streaming error" })}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      }
    });

  } catch (error: any) {
    return new Response(`data: ${JSON.stringify({ error: error.message || "Internal Worker Error" })}\n\ndata: [DONE]\n\n`, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      }
    });
  }
}
