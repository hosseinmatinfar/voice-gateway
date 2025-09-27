// api/get-openai-token.ts (Vercel Edge Function)
// ⇨ یک کلید موقت (ephemeral key) از OpenAI می‌گیرد و به کلاینت برمی‌گرداند.

export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  // فقط متد GET را برای سادگی می‌پذیریم
  if (req.method !== "GET") {
    return new Response("Only GET method is allowed", { status: 405 });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response("OpenAI API key is not set", { status: 500 });
    }

    const model = "gpt-4o-realtime"; //  نام مدل پایدار و جدید را استفاده کنید
    
    // درخواست ایجاد یک session جدید برای گرفتن کلید موقت
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        voice: "alloy", 
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("OpenAI API Error:", errorBody);
      return new Response(`Failed to get ephemeral key: ${errorBody}`, { status: response.status });
    }

    const data = await response.json();
    const ephemeralKey = data.ephemeral_key;

    // کلید را در یک پاسخ JSON به کلاینت برگردان
    return new Response(JSON.stringify({ token: ephemeralKey }), {
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
