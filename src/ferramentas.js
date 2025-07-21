document.addEventListener('DOMContentLoaded', function() {
    // --- Elementos do DOM ---
    const toolSelectionView = document.getElementById('view-tool-selection');
    const toolInterfaceView = document.getElementById('view-tool-interface');
    const toolCards = document.querySelectorAll('.tool-card');
    const backToToolsButton = document.getElementById('back-to-tools-button');
    const homeButton = document.getElementById('home-button');
    const converter = new showdown.Converter({ strikethrough: true, tables: true });

    function showToolSelection() {
        backToToolsButton.style.display = 'none';
        homeButton.style.display = 'inline-flex';
        toolInterfaceView.classList.remove('active');
        toolSelectionView.classList.add('active');
        toolInterfaceView.innerHTML = '';
    }

    function showTool(targetId) {
        const template = document.getElementById(`template-${targetId}`);
        if (!template) {
            console.error(`Template para a ferramenta "${targetId}" não foi encontrado no HTML.`);
            return;
        }
        const clone = template.content.cloneNode(true);
        toolSelectionView.classList.remove('active');
        toolInterfaceView.innerHTML = '';
        toolInterfaceView.appendChild(clone);
        toolInterfaceView.classList.add('active');
        homeButton.style.display = 'none';
        backToToolsButton.style.display = 'inline-flex';
        activateToolListeners(targetId);
    }

    toolCards.forEach(card => {
        card.addEventListener('click', function(event) {
            event.preventDefault();
            const targetId = this.dataset.target;
            showTool(targetId);
        });
    });

    backToToolsButton.addEventListener('click', (e) => {
        e.preventDefault();
        showToolSelection();
    });

    function activateToolListeners(toolId) {
        if (toolId === 'diagnostico') setupDiagnostico();
        if (toolId === 'simulador') setupSimulador();
        if (toolId === 'relatorio') setupRelatorio();
    }

    function setupDiagnostico() {
        const analyzeBtn = document.getElementById('analyzeBtn');
        const problemDescription = document.getElementById('problemDescription');
        const aiLoader = document.getElementById('ai-loader');
        const aiResults = document.getElementById('ai-results');
        analyzeBtn.addEventListener('click', async () => {
            if (!problemDescription.value.trim()) return;
            aiLoader.style.display = 'block';
            aiResults.style.display = 'none';
            analyzeBtn.disabled = true;
            try {
                const diagnosisPrompt = `Como especialista de suporte IRED, analise o problema a seguir e forneça uma resposta com os tópicos "Hipótese Principal (Causa Provável):", "Perguntas de Diagnóstico (2-3 perguntas):" e "Ação Imediata (Plano de Resolução Rápida):". Problema: "${problemDescription.value}"`;
                const diagnosis = await callGeminiAPI(diagnosisPrompt);
                document.getElementById('diagnosis-output').innerHTML = converter.makeHtml(diagnosis);
                const scriptPrompt = `Com base no problema "${problemDescription.value}", crie uma frase empática para o atendente usar.`;
                const script = await callGeminiAPI(scriptPrompt);
                document.getElementById('script-output').innerHTML = converter.makeHtml(script);
                aiResults.style.display = 'block';
            } catch (error) {
                document.getElementById('diagnosis-output').innerHTML = `<strong>Erro ao contactar a IA:</strong> ${error.message}`;
                aiResults.style.display = 'block';
            } finally {
                aiLoader.style.display = 'none';
                analyzeBtn.disabled = false;
            }
        });
    }

    function setupSimulador() {
        const simSetupView = document.getElementById('sim-setup-view');
        const startSimBtn = document.getElementById('startSimBtn');
        const simChatView = document.getElementById('sim-chat-view');
        const chatHistoryEl = document.getElementById('chat-history');
        const chatInput = document.getElementById('chat-input');
        const sendChatBtn = document.getElementById('sendChatBtn');
        const endSimBtn = document.getElementById('endSimBtn');
        const simLoader = document.getElementById('sim-loader');
        const feedbackResults = document.getElementById('feedback-results');
        const restartSimBtn = document.getElementById('restartSimBtn');
        const simFeedbackView = document.getElementById('sim-feedback-view');
        const chatForm = document.getElementById('chat-form');
        let conversationHistory = [];
        let isSimulating = false;
        const scenarios = {
            'lentidao-frustrado': "Cliente frustrado com lentidão.",
            'wifi-nao-funciona-leigo': "Cliente leigo com Wi-Fi que não funciona no quarto.",
            'quedas-constantes-irritado': "Cliente irritado com quedas constantes.",
            'velocidade-baixa-cabo': "Cliente com velocidade baixa no cabo.",
            'problemas-com-dvr': "Cliente com problemas no DVR"
        };

        function appendMessage(text, sender) {
            const bubble = document.createElement('div');
            bubble.classList.add('chat-bubble', sender);
            bubble.innerHTML = converter.makeHtml(text);
            chatHistoryEl.appendChild(bubble);
            chatHistoryEl.scrollTop = chatHistoryEl.scrollHeight;
        }

        function showError(message) {
            console.error(message);
            alert(message);
        }

        async function startSimulation() {
            if (isSimulating) return;
            isSimulating = true;
            chatHistoryEl.innerHTML = '';
            feedbackResults.innerHTML = '';
            conversationHistory = [];
            simSetupView.style.display = 'none';
            simChatView.style.display = 'flex';
            simLoader.style.display = 'block';
            const scenarioValue = document.getElementById('scenarioSelect').value;
            const systemPrompt = `**INSTRUÇÕES DE PERSONA (SIGA RIGOROSAMENTE):**

Você está participando de uma simulação de atendimento da empresa **Ired Internet**, um provedor com mais de 25 anos de história, presente na região centro-norte do Paraná e atendendo mais de 20 cidades.

- **Você deve assumir o papel de um CLIENTE da Ired Internet**, com o perfil descrito a seguir: "${scenarios[scenarioValue]}".
- Comporte-se como esse cliente em uma situação real. Traga reclamações, dúvidas ou frustrações de forma natural e coerente com o perfil.
- Seja autêntico, como se estivesse falando com um atendente humano da central de suporte.
- Mantenha-se 100% no personagem durante toda a conversa. **Não revele que é uma simulação**.
- O outro participante será o ATENDENTE da Ired.

**Agora, inicie a conversa com sua primeira manifestação (reclamação, dúvida ou solicitação), de acordo com o perfil descrito.**`;

            try {
                const historyForFirstCall = [{ role: 'user', parts: [{ text: systemPrompt }] }];
                const firstResponse = await callGeminiAPI(historyForFirstCall);
                conversationHistory.push({ role: 'user', parts: [{ text: systemPrompt }] });
                conversationHistory.push({ role: 'model', parts: [{ text: firstResponse }] });
                appendMessage(firstResponse, 'customer');
            } catch (error) {
                showError('Erro ao iniciar a simulação. Tente novamente.');
                restartSimulation();
            } finally {
                simLoader.style.display = 'none';
                isSimulating = false;
            }
        }

        async function sendMessage() {
            if (isSimulating) return;
            const messageText = chatInput.value.trim();
            if (!messageText) return;
            isSimulating = true;
            appendMessage(messageText, 'attendant');
            conversationHistory.push({ role: 'user', parts: [{ text: messageText }] });
            chatInput.value = '';
            simLoader.style.display = 'block';
            try {
                const customerResponse = await callGeminiAPI(conversationHistory);
                conversationHistory.push({ role: 'model', parts: [{ text: customerResponse }] });
                appendMessage(customerResponse, 'customer');
            } catch (error) {
                showError('Erro na comunicação com o cliente-robô. Tente novamente.');
            } finally {
                simLoader.style.display = 'none';
                isSimulating = false;
            }
        }

        async function endSimulation() {
            if (isSimulating) return;
            isSimulating = true;
            simLoader.style.display = 'block';

            // ATUALIZAÇÃO: Prompt ajustado para solicitar uma resposta JSON estruturada.
            const feedbackPrompt = `
Assuma o papel de um Analista de Qualidade (QA) e avalie o diálogo de atendimento a seguir.

Sua resposta deve ser **apenas** um objeto JSON com duas chaves: "scores" e "feedbackText".

1.  **"scores"**: Um objeto com as notas numéricas de 0 a 10 para:
    * "empathy"
    * "clarity"
    * "resolution"

2.  **"feedbackText"**: Uma string em formato Markdown, **curta e direta**, com a seguinte estrutura:
    * **Resumo Geral:** (Uma única frase objetiva resumindo o atendimento).
    * **Pontos Fortes:** (2 ou 3 pontos positivos principais em formato de lista).
    * **Pontos a Melhorar:** (2 ou 3 pontos construtivos para melhoria em formato de lista).
    * **Recomendação Principal:** (Uma única ação clara e prática para o colaborador focar).

**Importante**: Não inclua nenhum texto, explicação ou formatação de código (como \`\`\`json) antes ou depois do objeto JSON.

Diálogo para Análise:
${JSON.stringify(conversationHistory.slice(1), null, 2)}
`;


            try {
                const feedbackResponseText = await callGeminiAPI(feedbackPrompt);
                
                // ATUALIZAÇÃO: Processa a resposta JSON da IA.
                let feedbackData;
                try {
                    // Tenta limpar o texto e fazer o parse do JSON
                    const cleanedText = feedbackResponseText.replace(/```json/g, '').replace(/```/g, '').trim();
                    feedbackData = JSON.parse(cleanedText);
                } catch (e) {
                    console.error("Falha ao fazer parse do JSON da IA. Usando texto completo.", e);
                    // Plano B: Se o JSON falhar, usa o texto completo e notas zeradas.
                    feedbackData = {
                        feedbackText: feedbackResponseText,
                        scores: { empathy: 0, clarity: 0, resolution: 0 }
                    };
                }

                const feedbackText = feedbackData.feedbackText || "Não foi possível gerar o feedback em texto.";
                const feedbackScores = feedbackData.scores || { empathy: 0, clarity: 0, resolution: 0 };

                feedbackResults.innerHTML = converter.makeHtml(feedbackText);

                const token = localStorage.getItem('token');
                if (!token) throw new Error('Utilizador não autenticado.');

                const scenario = document.getElementById('scenarioSelect').value;
                const url = '/api/getSimulations';
                const bodyPayload = {
                    scenario,
                    chatHistory: conversationHistory,
                    feedback: feedbackText,
                    feedbackScores: feedbackScores // Envia o objeto de notas estruturado
                };
                
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(bodyPayload),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `Erro ao salvar simulação: ${response.statusText}`);
                }

                simChatView.style.display = 'none';
                simFeedbackView.style.display = 'block';

            } catch (error) {
                showError(error.message || 'Houve um problema ao finalizar a simulação. Tente novamente.');
            } finally {
                simLoader.style.display = 'none';
                isSimulating = false;
            }
        }

        function restartSimulation() {
            simFeedbackView.style.display = 'none';
            simChatView.style.display = 'none';
            simSetupView.style.display = 'block';
            isSimulating = false;
        }

        startSimBtn.addEventListener('click', startSimulation);
        sendChatBtn.addEventListener('click', sendMessage);
        endSimBtn.addEventListener('click', endSimulation);
        restartSimBtn.addEventListener('click', restartSimulation);

        if (chatForm) {
            chatForm.addEventListener('submit', (e) => { e.preventDefault(); sendMessage(); });
        }
        if (chatInput) {
            chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
        }
    }

    function setupRelatorio() {
        const generateReportBtn = document.getElementById('generateReportBtn');
        const reportSummary = document.getElementById('reportSummary');
        const reportLoader = document.getElementById('report-loader');
        const reportResults = document.getElementById('report-results');
        const reportOutput = document.getElementById('report-output');
        const copyReportBtn = document.getElementById('copyReportBtn');

        generateReportBtn.addEventListener('click', async () => {
            if (!reportSummary.value.trim()) return;
            reportLoader.style.display = 'block';
            reportResults.style.display = 'none';
            generateReportBtn.disabled = true;
            const prompt = `Formate o seguinte resumo para um ticket, usando as seções 'Relato do Cliente', 'Procedimentos Realizados' e 'Conclusão'. Resumo: "${reportSummary.value}"`;
            try {
                const formalReport = await callGeminiAPI(prompt);
                reportOutput.value = formalReport.replace(/<br\s*\/?>/gi, '\n');
                reportResults.style.display = 'block';
            } finally {
                reportLoader.style.display = 'none';
                generateReportBtn.disabled = false;
            }
        });

        copyReportBtn.addEventListener('click', () => {
            reportOutput.select();
            document.execCommand('copy');
            const copyBtnTextContainer = document.getElementById('copyBtnTextContainer');
            const originalText = copyBtnTextContainer.innerHTML;
            copyBtnTextContainer.innerHTML = '<span>Copiado!</span>';
            setTimeout(() => { copyBtnTextContainer.innerHTML = originalText; }, 2000);
        });
    }

    async function callGeminiAPI(promptOrHistory) {
        const apiEndpoint = '/api/gemini';
        const contents = Array.isArray(promptOrHistory) ? promptOrHistory : [{ role: "user", parts: [{ text: promptOrHistory }] }];
        try {
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: contents })
            });
            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`A chamada para a API falhou: ${response.status} - ${errorBody}`);
            }
            const result = await response.json();
            if (result?.candidates?.[0]?.content?.parts?.[0]?.text) {
                return result.candidates[0].content.parts[0].text;
            }
            throw new Error("Formato de resposta da API inesperado.");
        } catch (error) {
            console.error("Erro na chamada da API:", error);
            throw error;
        }
    }

    showToolSelection();
});
