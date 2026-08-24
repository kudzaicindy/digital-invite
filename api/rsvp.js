export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
  if (!scriptUrl) {
    return res.status(503).json({ ok: false, error: 'RSVP not configured' });
  }

  const params = new URLSearchParams();
  for (const key of ['name', 'email', 'attend', 'message']) {
    const value = req.body?.[key];
    if (value != null && String(value).trim() !== '') {
      params.append(key, String(value).trim());
    }
  }

  try {
    const upstream = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: params.toString(),
    });

    if (!upstream.ok) {
      return res.status(502).json({ ok: false, error: 'Sheet write failed' });
    }

    return res.status(200).json({ ok: true });
  } catch {
    return res.status(502).json({ ok: false, error: 'Sheet write failed' });
  }
}
