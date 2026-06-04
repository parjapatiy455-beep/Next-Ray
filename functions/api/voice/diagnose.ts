export async function onRequestPost(context: any): Promise<Response> {
  try {
    const req = context.request;
    const body: any = await req.json().catch(() => ({}));
    const { customGeminiKey } = body;

    const apiKey = customGeminiKey || context.env?.GEMINI_API_KEY || "";
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          status: "missing_key",
          message: "No Gemini API key detected. Please add GEMINI_API_KEY as an environment variable in Cloudflare, or provide it in the input box."
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Look for bad formatting
    if (!apiKey.startsWith("AIzaSy")) {
      return new Response(
        JSON.stringify({
          success: false,
          status: "invalid_format",
          message: "API Key format is invalid. A real Google Gemini API Key usually starts with 'AIzaSy'."
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 1. Test Text Completion using gemini-2.5-flash
    const textTestUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    let textSuccess = false;
    let textError = "";
    
    try {
      const textRes = await fetch(textTestUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Respond 'OK' only." }] }]
        })
      });

      if (textRes.ok) {
        textSuccess = true;
      } else {
        const errJson = await textRes.json().catch(() => ({}));
        textError = errJson.error?.message || `HTTP Code ${textRes.status}`;
      }
    } catch (err: any) {
      textError = err.message || "Network / Fetch error";
    }

    // 2. Test TTS voice completion using gemini-3.1-flash-tts-preview
    const ttsTestUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent?key=${apiKey}`;
    let ttsSuccess = false;
    let ttsError = "";

    try {
      const ttsRes = await fetch(ttsTestUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "OK" }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: "Kore" }
              }
            }
          }
        })
      });

      if (ttsRes.ok) {
        const bodyData = await ttsRes.json().catch(() => ({}));
        const rawAudio = bodyData.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (rawAudio) {
          ttsSuccess = true;
        } else {
          ttsError = "Audio candidate not returned in output payload.";
        }
      } else {
        const errJson = await ttsRes.json().catch(() => ({}));
        ttsError = errJson.error?.message || `HTTP Code ${ttsRes.status}`;
      }
    } catch (err: any) {
      ttsError = err.message || "Network / Fetch error";
    }

    if (textSuccess && ttsSuccess) {
      return new Response(
        JSON.stringify({
          success: true,
          status: "active",
          message: "Excellent! Your Gemini API Key is working perfectly. Both text and high-fidelity vocal synthesis are fully active and reachable."
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    } else {
      let debugMessage = "Gemini Key Status Check Failure:\n";
      if (!textSuccess) {
        debugMessage += `❌ Text Test Failed: ${textError}\n`;
      } else {
        debugMessage += `✅ Text Test Successful!\n`;
      }

      if (!ttsSuccess) {
        debugMessage += `❌ Advanced TTS Vocal Synthesis Failed: ${ttsError}\n`;
        if (ttsError.toLowerCase().includes("quota") || ttsError.toLowerCase().includes("limit")) {
          debugMessage += "👉 Hint: Your model is rate-limited or out of free credits. Try creating a fresh API key in Google AI Studio.\n";
        } else if (ttsError.toLowerCase().includes("permission") || ttsError.toLowerCase().includes("not found")) {
          debugMessage += "👉 Hint: The Gemini tts model (gemini-3.1-flash-tts-preview) might be restricted on your project. Ensure you have activated general model access or use a fresh Gemini API key created under a standard Google AI Studio account.\n";
        }
      } else {
        debugMessage += `✅ Advanced TTS Vocal Synthesis Successful!\n`;
      }

      return new Response(
        JSON.stringify({
          success: false,
          status: "partial_failure",
          message: debugMessage
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        status: "error",
        message: `System diagnostic runner failed: ${err.message || "Unknown error"}`
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
