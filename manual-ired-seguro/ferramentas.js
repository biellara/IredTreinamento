document.addEventListener('DOMContentLoaded', function() {
    
    // --- Lógica de Navegação da página de Ferramentas ---
    const toolLinks = document.querySelectorAll('.sidebar-link');
    const toolViews = document.querySelectorAll('.view');

    function switchToolView(targetId) {
        toolViews.forEach(view => {
            view.classList.remove('active');
        });

        const targetView = document.getElementById(targetId);
        if (targetView) {
            targetView.classList.add('active');
        }

        toolLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.target === targetId);
        });
    }

    toolLinks.forEach(link => {
        if (link.getAttribute('href') === 'index.html') return;

        link.addEventListener('click', function(event) {
            event.preventDefault();
            const targetId = this.dataset.target;
            if (targetId) {
                switchToolView(targetId);
            }
        });
    });

    // --- Lógica da Ferramenta de Diagnóstico ---
    const analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn) {
        const problemDescription = document.getElementById('problemDescription');
        const aiLoader = document.getElementById('ai-loader');
        const aiResults = document.getElementById('ai-results');
        const diagnosisOutput = document.getElementById('diagnosis-output');
        const scriptOutput = document.getElementById('script-output');

        aiLoader.style.display = 'none';

        analyzeBtn.addEventListener('click', async () => {
            if (!problemDescription.value.trim()) {
                problemDescription.focus();
                return;
            }
            aiLoader.style.display = 'block';
            aiResults.classList.add('hidden');
            analyzeBtn.disabled = true;

            try {
                const diagnosisPrompt = `Você é um assistente especialista para um atendente de suporte técnico da IRED. Sua tarefa é analisar a descrição do problema de um cliente e, com base no Manual Técnico da IRED, sugerir um checklist estruturado de passos de verificação. O manual cobre: 1. Diagnóstico de Conexão (status do sistema, falhas massivas, níveis de sinal), 2. Diagnóstico de Lentidão (testes de velocidade, categoria de cabo, bandas Wi-Fi), 3. Diagnóstico de Cobertura Wi-Fi (força do sinal, interferências). Com base no seguinte problema do cliente, forneça a causa provável e um checklist curto e priorizado do que o atendente deve investigar. Formate a resposta de forma clara, com tópicos e usando Markdown para negrito. Problema do cliente: "${problemDescription.value}"`;
                const diagnosis = await callGemini(diagnosisPrompt);
                diagnosisOutput.innerHTML = parseSimpleMarkdown(diagnosis);

                const scriptPrompt = `Com base no seguinte diagnóstico e problema do cliente, gere um script de atendimento curto, empático e claro para o atendente de suporte usar para iniciar a solução do problema. O tom deve ser profissional e prestativo. Use Markdown para negrito para destacar termos importantes. Diagnóstico: "${diagnosis}". Problema do cliente: "${problemDescription.value}"`;
                const script = await callGemini(scriptPrompt);
                scriptOutput.innerHTML = parseSimpleMarkdown(script);

                aiResults.classList.remove('hidden');
            } catch (error) {
                console.error('Error calling Gemini API:', error);
                diagnosisOutput.innerHTML = 'Ocorreu um erro ao analisar o problema. Por favor, tente novamente.';
            } finally {
                aiLoader.style.display = 'none';
                analyzeBtn.disabled = false;
            }
        });
    }

    // --- Funções de API e Utilitários ---
    async function callGemini(prompt) {
        return callGeminiWithHistory([{ role: "user", parts: [{ text: prompt }] }]);
    }
    
    async function callGeminiWithHistory(history) {
        // Esta é a rota que seu servidor local ou a função Netlify usará.
        const apiEndpoint = '/.netlify/functions/gemini.js'; 
        try {
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ history: history })
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`A chamada para a API falhou: ${response.status} - ${errorBody}`);
            }

            const result = await response.json();

            if (result.candidates && result.candidates.length > 0) {
                return result.candidates[0].content.parts[0].text;
            } else if (result.error) {
                 throw new Error(`Erro da API do Gemini: ${result.error.message}`);
            } else {
                throw new Error("Não foi possível processar a resposta do servidor.");
            }
        } catch (error) {
            console.error("Erro na função callGeminiWithHistory:", error);
            return `Erro de comunicação com o servidor. Verifique o console. (${error.message})`;
        }
    }

    function parseSimpleMarkdown(text) {
        if (!text) return '';
        let newText = text;
        newText = newText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        newText = newText.replace(/\*(.*?)\*/g, '<em>$1</em>');
        newText = newText.replace(/\n/g, '<br>');
        return newText;
    }

});
