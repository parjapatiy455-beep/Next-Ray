export async function onRequestGet(context: any): Promise<Response> {
  const envKey = context.env?.NVIDIA_API_KEY || "";
  return new Response(
    JSON.stringify({
      nvidiaConfigured: !!envKey,
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}
