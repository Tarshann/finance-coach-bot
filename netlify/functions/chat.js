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
    const { messages, systemPrompt, provider = 'anthropic' } = JSON.parse(event.body);
    
    if (provider === 'anthropic') {
      // Use Anthropic Claude
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.REACT_APP_ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20240620',
          max_tokens: 1000,
          system: systemPrompt,
          messages: messages
        })
      });

      const data = await response.json();
      return {
        statusCode: response.ok ? 200 : response.status,
        headers,
        body: JSON.stringify(data)
      };
      
    } else {
      // Use OpenAI GPT
      const openAIMessages = [
        { role: "system", content: systemPrompt },
        ...messages
      ];
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: openAIMessages,
          max_tokens: 1000
        })
      });

      const data = await response.json();
      
      // Convert to Anthropic-like format
      const result = {
        content: [{ text: data.choices[0].message.content }]
      };
      
      return {
        statusCode: response.ok ? 200 : response.status,
        headers,
        body: JSON.stringify(result)
      };
    }
    
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};