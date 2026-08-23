import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...vals] = trimmed.split('=');
      process.env[key.trim()] = vals.join('=').trim();
    }
  }
}

const apiKey = (process.env.GEMINI_API_KEY || '').trim();

async function testBearerToken() {
  console.log('Testing Authorization: Bearer token format with key prefix:', apiKey.substring(0, 10));

  // 1. Test URL without ?key= and with Bearer token
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent`;
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Respond with "SUCCESS" if online.' }] }]
      }),
    });

    const text = await res.text();
    console.log('HTTP Status (Bearer):', res.status);
    console.log('Response body:', text);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testBearerToken();
