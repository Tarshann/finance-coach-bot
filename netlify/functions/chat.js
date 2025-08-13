exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method not allowed' };
  }

  try {
    const { messages, systemPrompt } = JSON.parse(event.body || '{}');
    if (!messages || !Array.isArray(messages) || !systemPrompt) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid payload' }) };
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    // Try Anthropic first
    if (anthropicKey) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20240620',
          max_tokens: 1000,
          system: systemPrompt,
          messages
        })
      });

      if (response.ok) {
        const data = await response.json();
        return { statusCode: 200, headers, body: JSON.stringify(data) };
      }
    }

    // Fallback to OpenAI
    if (openaiKey) {
      const openAIMessages = [
        { role: "system", content: systemPrompt },
        ...messages
      ];
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: openAIMessages,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        return { statusCode: response.status, headers, body: JSON.stringify({ error: errText || 'OpenAI error' }) };
      }
      const data = await response.json();
      const result = { content: [{ text: data.choices?.[0]?.message?.content ?? '' }] };
      return { statusCode: 200, headers, body: JSON.stringify(result) };
    }

    return { statusCode: 500, headers, body: JSON.stringify({ error: 'No API keys available' }) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error?.message || 'Unknown server error' }) };
  }
};
