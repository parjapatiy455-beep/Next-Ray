function addWavHeader(pcmBuffer: Uint8Array, sampleRate: number = 24000): Uint8Array {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  
  // "RIFF"
  view.setUint8(0, 0x52); // R
  view.setUint8(1, 0x49); // I
  view.setUint8(2, 0x46); // F
  view.setUint8(3, 0x46); // F
  
  // File size - 8
  view.setUint32(4, pcmBuffer.length + 36, true);
  
  // "WAVE"
  view.setUint8(8, 0x57);  // W
  view.setUint8(9, 0x41);  // A
  view.setUint8(10, 0x56); // V
  view.setUint8(11, 0x45); // E
  
  // "fmt " chunk
  view.setUint8(12, 0x66); // f
  view.setUint8(13, 0x6d); // m
  view.setUint8(14, 0x74); // t
  view.setUint8(15, 0x20); // ' '
  
  // Chunk size (16)
  view.setUint32(16, 16, true);
  
  // Audio format (1 = PCM)
  view.setUint16(20, 1, true);
  
  // Number of channels (1 = Mono)
  view.setUint16(22, 1, true);
  
  // Sample rate (24000)
  view.setUint32(24, sampleRate, true);
  
  // Byte rate (sampleRate * numChannels * bitsPerSample/8 = 24000 * 1 * 2 = 48000)
  view.setUint32(28, sampleRate * 2, true);
  
  // Block align (numChannels * bitsPerSample/8 = 2)
  view.setUint16(32, 2, true);
  
  // Bits per sample (16)
  view.setUint16(34, 16, true);
  
  // "data" chunk
  view.setUint8(36, 0x64); // d
  view.setUint8(37, 0x61); // a
  view.setUint8(38, 0x74); // t
  view.setUint8(39, 0x61); // a
  
  // Chunk size (pcm length)
  view.setUint32(40, pcmBuffer.length, true);
  
  const wavBytes = new Uint8Array(44 + pcmBuffer.length);
  wavBytes.set(new Uint8Array(header), 0);
  wavBytes.set(pcmBuffer, 44);
  
  return wavBytes;
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function arrayBufferToBase64(buffer: Uint8Array): string {
  let binary = '';
  const len = buffer.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
}

export async function onRequestPost(context: any): Promise<Response> {
  try {
    const req = context.request;
    const body: any = await req.json();
    const { text, voiceName } = body;

    // Read API Key from environment or request fallback
    const apiKey = context.env?.GEMINI_API_KEY || "";
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Gemini API key is unconfigured in Cloudflare Pages. Please set GEMINI_API_KEY as an environment variable in Cloudflare dashboard." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!text || !text.trim()) {
      return new Response(
        JSON.stringify({ error: "Text prompt is required for vocal synthesis." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Clean up text formatters for nice audio flow
    const cleanText = text
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`[^`]+`/g, "")
      .replace(/[*#_~`-]/g, "")
      .replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '')
      .trim();

    if (!cleanText) {
      return new Response(
        JSON.stringify({ error: "No synthesisable text content after cleansing." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const selectedVoice = voiceName || "Kore";
    const googleUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent?key=${apiKey}`;

    const googleResponse = await fetch(googleUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: cleanText }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: selectedVoice }
            }
          }
        }
      })
    });

    if (!googleResponse.ok) {
      const errDetails = await googleResponse.json().catch(() => ({}));
      const message = errDetails.error?.message || `Google API returned status ${googleResponse.status}`;
      return new Response(
        JSON.stringify({ error: `Direct Google TTS failed: ${message}` }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const data: any = await googleResponse.json();
    const rawBase64 = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!rawBase64) {
      return new Response(
        JSON.stringify({ error: "Google synthesis engine returned empty speech candidate. Check if the model or voice choice is supported." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const rawPcm = base64ToUint8Array(rawBase64);
    const wavBytes = addWavHeader(rawPcm, 24000);
    const base64Wav = arrayBufferToBase64(wavBytes);

    return new Response(
      JSON.stringify({
        success: true,
        audioDataUrl: `data:audio/wav;base64,${base64Wav}`
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal serverless worker synthesis error." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
