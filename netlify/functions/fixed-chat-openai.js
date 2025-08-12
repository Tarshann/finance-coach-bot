// Fixed Netlify Function for OpenAI API
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
    return { 
      statusCode: 405, 
      headers, 
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { messages, systemPrompt } = JSON.parse(event.body);
    
    // Use correct environment variable name (no REACT_APP_ prefix)
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'OPENAI_API_KEY not configured' })
      };
    }
    
    // Prepare messages for OpenAI format
    const openaiMessages = [
      {
        role: 'system',
        content: systemPrompt || 'You are a helpful assistant.'
      },
      ...messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))
    ];
    
    // Call OpenAI API using built-in fetch
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: openaiMessages,
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          error: `OpenAI API error: ${errorData.error?.message || 'Unknown error'}` 
        })
      };
    }

    const data = await response.json();
    const responseContent = data.choices[0].message.content;
    
    // Return in Claude-compatible format that your frontend expects
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        content: [{ text: responseContent }]
      })
    };
    
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: `Function error: ${error.message}` })
    };
  }
};