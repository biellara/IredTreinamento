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
            // Ignora o link de "Voltar" na lógica de ativação
            if(link.getAttribute('href') !== 'index.html') {
                link.classList.toggle('active', link.dataset.target === targetId);
            }
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
            if (!problemDescription.value.trim()) { problemDescription.focus(); return; }
            aiLoader.style.display = 'block';
            aiResults.classList.add('hidden');
            analyzeBtn.disabled = true;

            try {
                const diagnosisPrompt = `Você é um assistente especialista para um atendente de suporte técnico da IRED. Sua tarefa é analisar a descrição do problema de um cliente e, com base no Manual Técnico da IRED, sugerir um checklist estruturado de passos de verificação. O manual cobre: 1. Diagnóstico de Conexão, 2. Diagnóstico de Lentidão, 3. Diagnóstico de Cobertura Wi-Fi. Com base no problema do cliente, forneça a causa provável e um checklist priorizado de investigação. Formate com Markdown. Problema: "${problemDescription.value}"`;
                const diagnosis = await callGemini(diagnosisPrompt);
                diagnosisOutput.innerHTML = parseSimpleMarkdown(diagnosis);

                const scriptPrompt = `Com base no seguinte diagnóstico e problema, gere um script de atendimento curto e empático para o atendente usar. Tom profissional e prestativo. Use Markdown. Diagnóstico: "${diagnosis}". Problema: "${problemDescription.value}"`;
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
    
    // --- Lógica da Ferramenta de Simulador ---
    const simSetupView = document.getElementById('sim-setup-view');
    const simChatView = document.getElementById('sim-chat-view');
    const simFeedbackView = document.getElementById('sim-feedback-view');
    const scenarioSelect = document.getElementById('scenarioSelect');
    const startSimBtn = document.getElementById('startSimBtn');
    const chatHistoryEl = document.getElementById('chat-history');
    const chatInput = document.getElementById('chat-input');
    const sendChatBtn = document.getElementById('sendChatBtn');
    const endSimBtn = document.getElementById('endSimBtn');
    const simLoader = document.getElementById('sim-loader');
    const feedbackResults = document.getElementById('feedback-results');
    const restartSimBtn = document.getElementById('restartSimBtn');
    
    if (startSimBtn) {
        let conversationHistory = [];
        const scenarios = {
            'lentidao-frustrado': "Você é um cliente chamado Carlos. Você está muito frustrado porque sua internet está lenta há dias, especialmente à noite quando tenta ver filmes. Seja impaciente e um pouco irritado.",
            'wifi-nao-funciona-leigo': "Você é uma cliente chamada Maria. Você não entende muito de tecnologia. Sua queixa é que o 'sinal do wi-fi não chega no seu quarto', que fica no segundo andar. Seja um pouco confusa mas simpática.",
            'quedas-constantes-irritado': "Você é um cliente chamado João. Sua internet cai o tempo todo, várias vezes por hora, atrapalhando seu trabalho home office. Você está muito irritado e ameaça cancelar o plano.",
            'velocidade-baixa-cabo': "Você é uma cliente chamada Sandra. Você contratou um plano de 500 Mega, mas quando testa a velocidade no seu computador de mesa (conectado via cabo) nunca passa de 95 Mega. Você está desconfiada que está sendo enganada."
        };
        
        simLoader.style.display = 'none';

        function appendMessage(text, sender) {
            const bubble = document.createElement('div');
            bubble.classList.add('chat-bubble', sender);
            bubble.innerHTML = parseSimpleMarkdown(text);
            chatHistoryEl.appendChild(bubble);
            chatHistoryEl.scrollTop = chatHistoryEl.scrollHeight;
        }

        async function startSimulation() {
            simSetupView.style.display = 'none';
            simChatView.style.display = 'flex';
            simFeedbackView.style.display = 'none';
            chatHistoryEl.innerHTML = '';
            conversationHistory = [];
            simLoader.style.display = 'block';
            chatInput.disabled = true;
            sendChatBtn.disabled = true;
            const selectedScenario = scenarioSelect.value;
            const systemPrompt = `Vamos simular um atendimento de suporte técnico. Você é o CLIENTE. Eu serei o ATENDENTE. Siga estritamente a personalidade e o problema a seguir. Não revele que você é uma IA. Comece a conversa com sua primeira reclamação.\n\nSEU PERFIL: ${scenarios[selectedScenario]}`;
            conversationHistory.push({ role: 'user', parts: [{ text: systemPrompt }] });
            try {
                const firstResponse = await callGeminiWithHistory(conversationHistory);
                conversationHistory.push({ role: 'model', parts: [{ text: firstResponse }] });
                appendMessage(firstResponse, 'customer');
            } catch (error) {
                console.error("Error starting simulation:", error);
                appendMessage("Desculpe, houve um erro ao iniciar a simulação. Tente novamente.", 'customer');
            } finally {
                simLoader.style.display = 'none';
                chatInput.disabled = false;
                sendChatBtn.disabled = false;
                chatInput.focus();
            }
        }
        
        async function sendChatMessage() {
            const messageText = chatInput.value.trim();
            if (!messageText) return;
            appendMessage(messageText, 'attendant');
            conversationHistory.push({ role: 'user', parts: [{ text: messageText }] });
            chatInput.value = '';
            simLoader.style.display = 'block';
            chatInput.disabled = true;
            sendChatBtn.disabled = true;
            try {
                const customerResponse = await callGeminiWithHistory(conversationHistory);
                conversationHistory.push({ role: 'model', parts: [{ text: customerResponse }] });
                appendMessage(customerResponse, 'customer');
            } catch (error) {
                console.error("Error getting customer response:", error);
                appendMessage("Ocorreu um erro. Por favor, tente responder novamente ou finalize a simulação.", 'customer');
            } finally {
                 simLoader.style.display = 'none';
                chatInput.disabled = false;
                sendChatBtn.disabled = false;
                chatInput.focus();
            }
        }

        async function endSimulation() {
            simLoader.style.display = 'block';
            chatInput.disabled = true;
            sendChatBtn.disabled = true;
            const feedbackPrompt = `Agora, pare a simulação. Seu papel mudou. Você agora é um coach de atendimento. Analise o diálogo completo a seguir entre um atendente e um cliente. Forneça uma avaliação construtiva e detalhada sobre o desempenho do ATENDENTE. Avalie os seguintes pontos:\n1. **Empatia:** O atendente demonstrou empatia? Foi paciente?\n2. **Clareza:** A comunicação foi clara e fácil de entender?\n3. **Técnica:** O atendente seguiu os procedimentos corretos para diagnosticar e resolver o problema?\n4. **Pontos a Melhorar:** Dê sugestões específicas de como o atendente poderia ter agido melhor em certas partes da conversa.\n\nFormate a resposta usando Markdown com títulos e negrito. Diálogo:\n\n${JSON.stringify(conversationHistory)}`;
            try {
                const feedback = await callGemini(feedbackPrompt);
                feedbackResults.innerHTML = parseSimpleMarkdown(feedback);
                simChatView.style.display = 'none';
                simFeedbackView.style.display = 'block';
            } catch (error) {
                console.error("Error getting feedback:", error);
                feedbackResults.innerHTML = "Desculpe, ocorreu um erro ao gerar a avaliação. Por favor, tente finalizar novamente.";
            } finally {
                simLoader.style.display = 'none';
            }
        }
        
        startSimBtn.addEventListener('click', startSimulation);
        sendChatBtn.addEventListener('click', sendChatMessage);
        chatInput.addEventListener('keydown', (e) => { if(e.key === 'Enter' && !sendChatBtn.disabled) sendChatMessage(); });
        endSimBtn.addEventListener('click', endSimulation);
        restartSimBtn.addEventListener('click', () => {
            simChatView.style.display = 'none';
            simFeedbackView.style.display = 'none';
            simSetupView.style.display = 'block';
        });
    }

    // --- Funções de API e Utilitários ---
    async function callGemini(prompt) {
        return callGeminiWithHistory([{ role: "user", parts: [{ text: prompt }] }]);
    }
    
    async function callGeminiWithHistory(history) {
        const apiEndpoint = '/.netlify/functions/gemini'; 
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
