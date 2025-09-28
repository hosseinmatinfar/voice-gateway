// api/voice-agent.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { audio_data, format = 'wav' } = req.body;

    if (!audio_data) {
      return res.status(400).json({ error: 'Audio data required' });
    }

    console.log(`Processing ${format} audio...`);

    // Step 1: Speech-to-Text
    const audioBuffer = Buffer.from(audio_data, 'base64');
    const audioFile = new File([audioBuffer], `audio.${format}`, { 
      type: `audio/${format}` 
    });
    
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
    });

    const userText = transcription.text.trim();
    console.log('Transcribed:', userText);

    if (!userText) {
      return res.status(400).json({ error: 'No speech detected' });
    }

    // Step 2: Chat Completion
    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are Mia, a helpful voice assistant. Keep responses natural, conversational, and concise since this will be spoken aloud.'
        },
        {
          role: 'user',
          content: userText
        }
      ],
      max_tokens: 150,
      temperature: 0.8,
    });

    const assistantText = chatResponse.choices[0]?.message?.content;
    
    if (!assistantText) {
      throw new Error('No response from chat model');
    }

    console.log('Response:', assistantText);

    // Step 3: Text-to-Speech
    const ttsResponse = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: assistantText,
      response_format: 'mp3',
    });

    const audioArrayBuffer = await ttsResponse.arrayBuffer();
    const audioBase64 = Buffer.from(audioArrayBuffer).toString('base64');

    return res.status(200).json({
      transcribed_text: userText,
      response_text: assistantText,
      audio_data: audioBase64,
      audio_format: 'mp3',
    });

  } catch (error: any) {
    console.error('Voice agent error:', error);
    return res.status(500).json({
      error: 'Voice processing failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}