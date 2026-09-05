import express from 'express'
import { PairingRecord } from './db.js'

const PAGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>TZ PREMIUM BOT - Pairing</title>
<style>
  body { font-family: Arial, sans-serif; background:#0f172a; color:#e2e8f0; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; }
  .card { background:#1e293b; padding:32px 28px; border-radius:14px; width:100%; max-width:360px; box-shadow:0 10px 30px rgba(0,0,0,.4); }
  h1 { font-size:20px; margin-top:0; text-align:center; }
  label { font-size:13px; color:#94a3b8; }
  input { width:100%; padding:10px; margin:8px 0 16px; border-radius:8px; border:1px solid #334155; background:#0f172a; color:#e2e8f0; box-sizing:border-box; font-size:15px; }
  button { width:100%; padding:11px; border:none; border-radius:8px; background:#22c55e; color:#052e16; font-weight:bold; font-size:15px; cursor:pointer; }
  button:disabled { opacity:.6; cursor:not-allowed; }
  #result { margin-top:18px; text-align:center; font-size:14px; word-break:break-word; }
  .code { font-size:26px; letter-spacing:3px; font-weight:bold; color:#4ade80; margin-top:6px; }
  .err { color:#f87171; }
  small { display:block; margin-top:14px; color:#64748b; font-size:11px; text-align:center; }
</style>
</head>
<body>
  <div class="card">
    <h1>TZ PREMIUM BOT — Pair</h1>
    <form id="f">
      <label for="number">WhatsApp number (with country code, no + or spaces)</label>
      <input id="number" name="number" placeholder="923001234567" required />
      <button type="submit" id="btn">Get Pairing Code</button>
    </form>
    <div id="result"></div>
    <small>Enter this code in WhatsApp: Linked Devices &rarr; Link with phone number</small>
  </div>

<script>
  const form = document.getElementById('f');
  const btn = document.getElementById('btn');
  const result = document.getElementById('result');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const number = document.getElementById('number').value.trim();
    result.innerHTML = '';
    btn.disabled = true;
    btn.textContent = 'Requesting...';
    try {
      const res = await fetch('/api/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get pairing code');
      result.innerHTML = 'Your pairing code:<div class="code">' + data.code + '</div>';
    } catch (err) {
      result.innerHTML = '<span class="err">' + err.message + '</span>';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Get Pairing Code';
    }
  });
</script>
</body>
</html>`

export function startPairingWebsite({ requestPairingCode, port = process.env.PORT || 3000 }) {
    const app = express()
    app.use(express.json())

    app.get('/', (req, res) => {
        res.send(PAGE_HTML)
    })

    app.post('/api/pair', async (req, res) => {
        try {
            const { number } = req.body || {}
            if (!number) {
                return res.status(400).json({ error: 'Number is required.' })
            }
            const code = await requestPairingCode(number)

            // Save the pairing request to MongoDB (skipped silently if DB isn't connected)
            try {
                await PairingRecord.create({ number, code })
            } catch (dbError) {
                console.warn('Could not save pairing record:', dbError.message)
            }

            res.json({ code })
        } catch (error) {
            res.status(400).json({ error: error.message || 'Failed to generate pairing code.' })
        }
    })

    app.listen(port, () => {
        console.log(`🌐 Pairing website running on port ${port}`)
    })
}
