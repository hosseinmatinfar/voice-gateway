// api/realtime-sdp.ts  (Vercel Edge Function)
// ⇨ SDP Offer از اپ می‌گیرد، به OpenAI Realtime می‌فرستد، و SDP Answer خام برمی‌گرداند.

export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  try {
    if (req.method !== "POST") return new Response("Only POST", { status: 405 });

    const offerSdp = await req.text();
    if (!offerSdp || offerSdp.length < 10) {
      return new Response("Empty SDP", { status: 400 });
    }

    const model = "gpt-4o-realtime-preview-2024-12-17";

    const r = await fetch(
      `https://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
          "OpenAI-Beta": "realtime=v1",
          "Content-Type": "application/sdp",
          "Accept": "application/sdp",
        },
        body: offerSdp,
      }
    );

    const answerSdp = await r.text();
    const ok = r.status >= 200 && r.status < 300;
    // موفق که بود، همیشه 200 بده تا کلاینت حسّاس گیر نکنه
    return new Response(answerSdp, {
      status: ok ? 200 : r.status,
      headers: { "Content-Type": "application/sdp" },
    });
  } catch (e: any) {
    return new Response(`gateway error: ${e?.message || e}`, { status: 500 });
  }
}
