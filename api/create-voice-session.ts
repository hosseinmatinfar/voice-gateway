import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { sdp } = req.body as { sdp: string };
    if (!sdp) {
      return res.status(400).json({ error: 'SDP offer is required' });
    }

    const agentId = process.env.OPENAI_AGENT_ID;
    if (!agentId) {
      return res.status(500).json({ error: 'OPENAI_AGENT_ID is not set' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OPENAI_API_KEY is not set' });
    }

    const response = await fetch(
      `https://api.openai.com/v1/agents/${agentId}/sessions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'OpenAI-Beta': 'voice-agents=v1',
        },
        body: JSON.stringify({ offer: sdp }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('OpenAI API Error:', errorBody);
      return res.status(response.status).json({ error: `OpenAI API Error: ${errorBody}` });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (e: any) {
    console.error('Gateway Error:', e);
    return res.status(500).json({ error: `Gateway error: ${e?.message || e}` });
  }
}