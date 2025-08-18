// netlify/functions/send-order.js
// Uses Resend (https://resend.com); set RESEND_API_KEY in Netlify env.
export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method not allowed' };

  try {
    const { to, order } = JSON.parse(event.body || '{}');
    if (!to || !order) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing "to" or "order"' }) };
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'RESEND_API_KEY not configured' }) };
    }

    const subject = `New Fairytale Farms Order — ${order?.customer?.name || 'Customer'}`;
    const pretty = JSON.stringify(order, null, 2)
      .replace(/[<>&]/g, (c) => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]));

    const html = `
      <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">
        <h2>New Order</h2>
        <p><strong>Name:</strong> ${order?.customer?.name || ''}</p>
        <p><strong>Email:</strong> ${order?.customer?.email || ''}</p>
        <p><strong>Phone:</strong> ${order?.customer?.phone || ''}</p>
        <p><strong>Instagram:</strong> ${order?.customer?.instagram || ''}</p>

        <h3>Pickup</h3>
        <p>${order?.pickup?.date || ''} @ ${order?.pickup?.time || ''} (${order?.pickup?.method || ''})</p>
        ${order?.pickup?.address ? `<p><strong>Address:</strong> ${order.pickup.address}</p>` : ''}

        <h3>Items</h3>
        <ul>
          ${(order?.items || []).map((it) => {
            if (it.type === 'cookie') return `<li>Cookie — ${it.flavor} x ${it.qty}</li>`;
            if (it.type === 'brownie') return `<li>Brownie — ${it.variant} x ${it.qty}</li>`;
            if (it.type === 'cake') return `<li>Cake — ${it.flavor} ${it.size ? `(${it.size})` : ''} x ${it.qty}</li>`;
            return `<li>${it.type} x ${it.qty}</li>`;
          }).join('')}
        </ul>

        <h3>Add-ons</h3>
        <p>Milk: ${order?.add_ons?.milk ? 'Yes' : 'No'}</p>

        ${order?.notes ? `<h3>Notes</h3><p>${order.notes}</p>` : ''}

        <h3>Raw JSON</h3>
        <pre style="background:#f6f8fa;padding:12px;border-radius:8px;border:1px solid #e5e7eb;white-space:pre-wrap;">${pretty}</pre>
      </div>
    `;

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Fairytale Farms <orders@yourdomain.dev>',
        to: [to],
        subject,
        html
      })
    });

    if (!resp.ok) {
      const t = await resp.text().catch(() => '');
      return { statusCode: 502, headers, body: JSON.stringify({ error: t || 'Resend error' }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e?.message || 'Unknown error' }) };
  }
};
