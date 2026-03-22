const https = require('https');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  try {
    let body = req.body;
    if (typeof body === 'string') body = JSON.parse(body);

    const payload = JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: body.system },
        ...body.messages
      ],
      max_tokens: 1000
    });

    const data = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.deepseek.com',
        path: '/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(payload)
        }
      };
      const request = https.request(options, (response) => {
        let raw = '';
        response.on('data', chunk => raw += chunk);
        response.on('end', () => {
          try { resolve(JSON.parse(raw)); }
          catch(e) { reject(new Error('Invalid JSON response')); }
        });
      });
      request.on('error', reject);
      request.write(payload);
      request.end();
    });

    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
