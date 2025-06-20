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
                const diagnosisPrompt = `Como especialista de suporte IRED, analise o seguinte problema e forneça uma "Causa Provável" e uma "Ação Imediata" (1-2 passos curtos). Formato: **Causa Provável:** [texto]. **Ação Imediata:** [texto]. Problema: "${problemDescription.value}"`;
                const diagnosis = await callGeminiAPI(diagnosisPrompt);
                document.getElementById('diagnosis-output').innerHTML = converter.makeHtml(diagnosis);

                const scriptPrompt = `Com base no problema "${problemDescription.value}", crie uma única frase de abertura empática para o atendente usar.`;
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

        startSimBtn.addEventListener('click', () => {
            const simChatView = document.getElementById('sim-chat-view');
            const chatHistoryEl = document.getElementById('chat-history');
            const chatInput = document.getElementById('chat-input');
            const sendChatBtn = document.getElementById('sendChatBtn');
            const endSimBtn = document.getElementById('endSimBtn');
            const simLoader = document.getElementById('sim-loader');
            const feedbackResults = document.getElementById('feedback-results');
            const restartSimBtn = document.getElementById('restartSimBtn');
            const simFeedbackView = document.getElementById('sim-feedback-view');
            let conversationHistory = [];
            const scenarios = {
                'lentidao-frustrado': "Cliente frustrado com lentidão.",
                'wifi-nao-funciona-leigo': "Cliente leigo com Wi-Fi que não funciona no quarto.",
                'quedas-constantes-irritado': "Cliente irritado com quedas constantes.",
                'velocidade-baixa-cabo': "Cliente com velocidade baixa no cabo."
            };

            function appendMessage(text, sender) {
                const bubble = document.createElement('div');
                bubble.classList.add('chat-bubble', sender);
                bubble.innerHTML = converter.makeHtml(text);
                chatHistoryEl.appendChild(bubble);
                chatHistoryEl.scrollTop = chatHistoryEl.scrollHeight;
            }

            async function start() {
                simSetupView.style.display = 'none';
                simChatView.style.display = 'flex';
                simLoader.style.display = 'block';
                const systemPrompt = `Vamos simular um atendimento. Você é o CLIENTE. Eu serei o ATENDENTE. Siga o perfil: ${scenarios[document.getElementById('scenarioSelect').value]}. Comece com sua primeira reclamação.`;
                try {
                    const firstResponse = await callGeminiAPI(systemPrompt);
                    conversationHistory.push({ role: 'user', parts: [{ text: systemPrompt }] });
                    conversationHistory.push({ role: 'model', parts: [{ text: firstResponse }] });
                    appendMessage(firstResponse, 'customer');
                } finally {
                    simLoader.style.display = 'none';
                }
            }

            async function sendMessage() {
                const messageText = chatInput.value.trim();
                if (!messageText) return;
                appendMessage(messageText, 'attendant');
                conversationHistory.push({ role: 'user', parts: [{ text: messageText }] });
                chatInput.value = '';
                simLoader.style.display = 'block';
                try {
                    const customerResponse = await callGeminiAPI(conversationHistory);
                    conversationHistory.push({ role: 'model', parts: [{ text: customerResponse }] });
                    appendMessage(customerResponse, 'customer');
                } finally {
                    simLoader.style.display = 'none';
                }
            }

            async function end() {
                simLoader.style.display = 'block';
                const feedbackPrompt = `Pare a simulação. Agora você é um coach de atendimento. Analise o diálogo a seguir e forneça um feedback construtivo sobre o desempenho do ATENDENTE, avaliando empatia, clareza e técnica. Dê pontos a melhorar.\n\nDiálogo: ${JSON.stringify(conversationHistory.slice(1))}`;
                try {
                    const feedback = await callGeminiAPI(feedbackPrompt);
                    feedbackResults.innerHTML = converter.makeHtml(feedback);
                    simChatView.style.display = 'none';
                    simFeedbackView.style.display = 'block';
                } finally {
                    simLoader.style.display = 'none';
                }
            }

            start();
            sendChatBtn.addEventListener('click', sendMessage);
            chatInput.addEventListener('keydown', (e) => { if(e.key === 'Enter') sendMessage(); });
            endSimBtn.addEventListener('click', end);
            restartSimBtn.addEventListener('click', () => {
                simFeedbackView.style.display = 'none';
                simSetupView.style.display = 'block';
            });
        });
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
            const prompt = `Converta este resumo informal em um relatório técnico formal para um sistema de tickets, com as seções "Relato do Cliente:", "Procedimentos Realizados:" e "Conclusão:". Use termos técnicos apropriados.\n\nResumo: "${reportSummary.value}"`;
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
