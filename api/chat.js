// Vercel serverless function. Set GEMINI_API_KEY in Vercel project settings.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: 'Server key is not set.' });
  const msgs = (req.body && req.body.messages) || [];
  if (!Array.isArray(msgs) || !msgs.length) return res.status(400).json({ error: 'No messages.' });
  const contents = msgs.slice(-20).map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: String(m.content).slice(0, 3000) }]
  }));
  try {
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({ contents })
    });
    const j = await r.json();
    if (!r.ok) return res.status(502).json({ error: (j.error && j.error.message) || 'Gemini request failed.' });
    const text = ((j.candidates && j.candidates[0] && j.candidates[0].content.parts) || []).map(p => p.text || '').join('') || '(Empty reply)';
    res.status(200).json({ text });
  } catch (e) { res.status(500).json({ error: 'Server error.' }); }
}
