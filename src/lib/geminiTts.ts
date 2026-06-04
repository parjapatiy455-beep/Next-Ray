export function addWavHeaderClient(pcmBuffer: Uint8Array, sampleRate: number = 24000): Uint8Array {
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

export function arrayBufferToBase64(buffer: Uint8Array): string {
  let binary = '';
  const len = buffer.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
}

export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function speakWithGeminiClientDirect(text: string, voiceName: string, apiKey: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent?key=${apiKey}`;
  
  // Clean text from markdown formatters and code strings for nice audio speech flow
  const cleanText = text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]+`/g, "")
    .replace(/[*#_~`-]/g, "")
    .replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '')
    .trim();

  if (!cleanText) {
    throw new Error("No pronounceable text remaining.");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: cleanText }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName || "Kore" }
          }
        }
      }
    })
  });

  if (!response.ok) {
    const errorDetails = await response.json().catch(() => ({}));
    const message = errorDetails.error?.message || `HTTP Code ${response.status}`;
    throw new Error(`Direct synthesis response failed: ${message}`);
  }

  const data = await response.json();
  const rawBase64 = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  
  if (!rawBase64) {
    throw new Error("No voice synthesis returned from Direct Google API.");
  }

  const rawPcm = base64ToUint8Array(rawBase64);
  const wavBytes = addWavHeaderClient(rawPcm, 24000);
  const base64Wav = arrayBufferToBase64(wavBytes);
  
  return `data:audio/wav;base64,${base64Wav}`;
}
