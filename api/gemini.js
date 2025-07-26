const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key não configurada.' });
  }

  let contents;
  try {
    const bodyData = req.body;
    const history = Array.isArray(bodyData.history) ? bodyData.history : [];
    const newContents = Array.isArray(bodyData.contents) ? bodyData.contents : [];

    contents = history.concat(newContents);

    if (!Array.isArray(contents) || contents.length === 0) {
      throw new Error("Formato inválido de conteúdo. Esperado um array não vazio.");
    }
  } catch (parseError) {
    return res.status(400).json({ error: 'Corpo da requisição inválido.', detalhe: parseError.message });
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents })
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
