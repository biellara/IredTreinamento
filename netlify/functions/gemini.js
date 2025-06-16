const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'API key não configurada.' })
    };
  }

  let contents;
  try {
    const bodyData = JSON.parse(event.body);
    contents = bodyData.history || bodyData.contents;

    if (!Array.isArray(contents)) {
      throw new Error("Formato inválido de conteúdo. Esperado um array.");
    }

  } catch (parseError) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Corpo da requisição inválido.', detalhe: parseError.message })
    };
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents })
    });

    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
