async function test() {
  console.log("Testing speech endpoint...");
  try {
    const res = await fetch("http://localhost:3000/api/voice/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Hello", voiceName: "Kore" }),
    });

    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response text body:", text.slice(0, 500));
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

test();
