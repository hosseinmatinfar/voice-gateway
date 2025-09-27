// api/create-voice-session.ts (Vercel Edge Function)
// ⇨ SDP Offer کلاینت را به Agents API جدید OpenAI می‌فرستد.

import { NextRequest } from "next/server";

export const config = { runtime: "edge" };

export default async function handler(req: NextRequest) {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { sdp } = (await req.json()) as { sdp: string };
    if (!sdp) {
      return new Response("SDP offer is required", { status: 400 });
    }

    const agentId = process.env.OPENAI_AGENT_ID;
    if (!agentId) {
      return new Response("OPENAI_AGENT_ID is not set", { status: 500 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response("OPENAI_API_KEY is not set", { status: 500 });
    }

    // ارسال درخواست به اندپوینت جدید Agents API
    const response = await fetch(
      `https://api.openai.com/v1/agents/${agentId}/sessions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          // SDP Offer کلاینت را در بدنه درخواست می‌فرستیم
          offer: sdp,
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("OpenAI API Error:", errorBody);
      return new Response(errorBody, { status: response.status });
    }

    // پاسخ کامل OpenAI (شامل SDP Answer و ICE servers) را به کلاینت برمی‌گردانیم
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", // برای تست
       },
    });

  } catch (e: any) {
    console.error("Gateway Error:", e);
    return new Response(`Gateway error: ${e?.message || e}`, { status: 500 });
  }
}
