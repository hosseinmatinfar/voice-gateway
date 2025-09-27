// File: api/create-voice-session.ts

import { NextRequest } from "next/server";

export const config = { runtime: "edge" };

export default async function handler(req: NextRequest) {
  // فقط متد POST را می‌پذیریم
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    // SDP Offer را از بدنه درخواست JSON می‌خوانیم
    const { sdp } = (await req.json()) as { sdp: string };
    if (!sdp) {
      return new Response("SDP offer is required in the JSON body", { status: 400 });
    }

    // خواندن متغیرهای محیطی از تنظیمات Vercel
    const agentId = process.env.OPENAI_AGENT_ID;
    if (!agentId) {
      return new Response("OPENAI_AGENT_ID environment variable is not set", { status: 500 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response("OPENAI_API_KEY environment variable is not set", { status: 500 });
    }

    // ارسال درخواست به اندپوینت جدید و اختصاصی Agents API
    const response = await fetch(
      `https://api.openai.com/v1/agents/${agentId}/sessions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "OpenAI-Beta": "voice-agents=v1", // این هدر ممکن است لازم باشد
        },
        body: JSON.stringify({
          offer: sdp, // SDP Offer کلاینت را اینجا قرار می‌دهیم
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
        "Access-Control-Allow-Origin": "*", // برای تست (در نسخه نهایی آدرس دامنه خود را بگذارید)
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
       },
    });

  } catch (e: any) {
    console.error("Gateway Error:", e);
    return new Response(`Gateway error: ${e?.message || e}`, { status: 500 });
  }
}
