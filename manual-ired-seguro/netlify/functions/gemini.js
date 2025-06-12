// netlify/functions/gemini.js

const fetch = require('node-fetch');

// A função principal agora é um 'handler' exportado
exports.handler = async function (event, context) {
    // A chave da API é lida das variáveis de ambiente do Netlify
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'API key not configured on the server.' })
        };
    }
    
    // O Netlify passa os dados da requisição no 'event.body'
    const { history } = JSON.parse(event.body);
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const payload = {
        contents: history,
    };

    try {
        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            throw new Error(`Gemini API call failed with status: ${apiResponse.status} - ${errorText}`);
        }

        const data = await apiResponse.json();

        // A função retorna um objeto com statusCode e body
        return {
            statusCode: 200,
            body: JSON.stringify(data),
        };

    } catch (error) {
        console.error('Error in Gemini function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};