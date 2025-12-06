const { m_runSession } = require('../../lib/g_runner');

export const config = {
  maxDuration: 300
};

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const s_authHeader = req.headers.authorization;
  const s_secret = process.env.CRON_SECRET;
  
  if (s_secret && s_authHeader !== `Bearer ${s_secret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (!process.env.GITHUB_TOKEN || !process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Missing configuration' });
  }
  
  try {
    const s_result = await m_runSession();
    
    return res.status(200).json({
      status: 'completed',
      ...s_result
    });
  } catch (e) {
    console.error('Session error:', e);
    
    return res.status(500).json({
      status: 'error',
      error: e.message
    });
  }
}