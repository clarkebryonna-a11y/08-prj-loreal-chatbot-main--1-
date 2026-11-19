// Copy this code into your Cloudflare Worker script

export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // GET can be used to confirm that the Worker is running.
    if (request.method === 'GET') {
      return Response.json(
        { status: 'Worker is running' },
        { headers: corsHeaders }
      );
    }

    if (request.method !== 'POST') {
      return Response.json(
        { error: 'Only POST requests are supported' },
        { status: 405, headers: corsHeaders }
      );
    }

    // Read the secret from the Cloudflare Workers dashboard.
    const apiKey = env.OPENAI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: 'OPENAI_API_KEY is missing from this Worker' },
        { status: 500, headers: corsHeaders }
      );
    }

    let userInput;
    try {
      userInput = await request.json();
    } catch (error) {
      return Response.json(
        { error: 'The request body must be valid JSON' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!Array.isArray(userInput.messages)) {
      return Response.json(
        { error: 'The request body must include a messages array' },
        { status: 400, headers: corsHeaders }
      );
    }

    const apiUrl = 'https://api.openai.com/v1/chat/completions';

    const requestBody = {
      model: 'gpt-4.1',
      messages: userInput.messages,
      max_completion_tokens: 300,
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      return Response.json(data, {
        status: response.status,
        headers: corsHeaders
      });
    } catch (error) {
      return Response.json(
        { error: 'The OpenAI request failed', details: error.message },
        { status: 502, headers: corsHeaders }
      );
    }
  }
};
