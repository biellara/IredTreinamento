document.addEventListener('DOMContentLoaded', function() {
    
    // --- Elementos do DOM ---
    const toolSelectionView = document.getElementById('view-tool-selection');
    const toolInterfaceView = document.getElementById('view-tool-interface');
    const toolCards = document.querySelectorAll('.tool-card');
    const backToToolsButton = document.getElementById('back-to-tools-button');
    const homeButton = document.getElementById('home-button');

    // --- Templates de HTML para cada ferramenta ---
    const toolTemplates = {
        'diagnostico': `
            <div class="tool-interface-container">
                <header>
                    <h1 class="view-title">✨ Diagnóstico Inteligente</h1>
                    <p class="view-subtitle">Descreva o problema do cliente para receber uma análise rápida e uma sugestão de ação.</p>
                </header>
                <div class="card p-8 mt-8">
                    <label for="problemDescription" class="block text-gray-700 font-semibold mb-2">Descrição do problema:</label>
                    <textarea id="problemDescription" rows="4" class="form-textarea" placeholder="Ex: 'Minha internet está caindo toda hora na TV...'"></textarea>
                    <button id="analyzeBtn" class="button button-red mt-4 w-full">Analisar Problema</button>
                    <div id="ai-loader" class="loader-container">
                        <i class="fa-solid fa-circle-notch fa-spin text-red-600 text-3xl"></i>
                        <p class="text-gray-600 mt-2">Aguardando resposta da IA...</p>
                    </div>
                    <div id="ai-results" class="hidden mt-6 space-y-6">
                        <div>
                            <h3 class="results-title">📋 Análise Rápida:</h3>
                            <div id="diagnosis-output" class="results-box prose max-w-none"></div>
                        </div>
                        <div>
                            <h3 class="results-title">💬 Sugestão de Abertura:</h3>
                            <div id="script-output" class="results-box bg-red-50 border-red-200 prose max-w-none"></div>
                        </div>
                    </div>
                </div>
            </div>
        `,
        'simulador': `
            <div class="tool-interface-container">
                <div id="sim-setup-view">
                    <header>
                        <h1 class="view-title">💬 Simulador de Atendimento</h1>
                        <p class="view-subtitle">Escolha um cenário e pratique suas habilidades de comunicação.</p>
                    </header>
                    <div class="card p-8 mt-8">
                        <label for="scenarioSelect" class="block text-gray-700 font-semibold mb-2">Selecione um cenário para praticar:</label>
                        <select id="scenarioSelect" class="w-full p-3 border border-gray-300 rounded-lg">
                            <option value="lentidao-frustrado">Cliente frustrado com lentidão</option>
                            <option value="wifi-nao-funciona-leigo">Cliente leigo com Wi-Fi que "não funciona no quarto"</option>
                            <option value="quedas-constantes-irritado">Cliente irritado com quedas constantes de conexão</option>
                            <option value="velocidade-baixa-cabo">Cliente com velocidade baixa no computador (via cabo)</option>
                        </select>
                        <button id="startSimBtn" class="button button-blue mt-4 w-full">Iniciar Simulação</button>
                    </div>
                </div>
                <div id="sim-chat-view" class="hidden flex flex-col h-[calc(100vh-8rem)]">
                     <h1 class="view-title">Simulação em Andamento...</h1>
                     <div class="flex-1 flex flex-col mt-8 overflow-hidden">
                        <div id="chat-history" class="flex-1 mb-4"></div>
                        <div id="sim-loader" class="loader-container"><p class="text-gray-500 italic">Cliente-robô está digitando...</p></div>
                        <div class="mt-auto flex gap-2">
                            <input type="text" id="chat-input" class="form-input flex-grow" placeholder="Digite sua resposta...">
                            <button id="sendChatBtn" class="button button-blue flex-shrink-0"><i class="fa-solid fa-paper-plane"></i></button>
                        </div>
                     </div>
                     <button id="endSimBtn" class="button button-red mt-4 w-full">Finalizar e Pedir Feedback</button>
                </div>
                <div id="sim-feedback-view" class="hidden">
                     <h1 class="view-title">⭐ Avaliação do Atendimento</h1>
                     <div class="card p-8 mt-8">
                         <div id="feedback-results" class="prose max-w-none"></div>
                         <button id="restartSimBtn" class="button button-blue mt-6 w-full">Iniciar Nova Simulação</button>
                    </div>
                </div>
            </div>
        `,
        'relatorio': `
            <div class="tool-interface-container">
                 <header>
                    <h1 class="view-title">📝 Gerador de Relatório</h1>
                    <p class="view-subtitle">Transforme um resumo simples em um relatório técnico completo.</p>
                 </header>
                 <div class="card p-8 mt-8">
                    <label for="reportSummary" class="block text-gray-700 font-semibold mb-2">Resumo informal do atendimento:</label>
                    <textarea id="reportSummary" rows="4" class="form-textarea" placeholder="Ex: cliente com lentidão na netflix, alterado canal do wi-fi para 11, problema resolvido."></textarea>
                    <button id="generateReportBtn" class="button button-green mt-4 w-full">Gerar Relatório Técnico</button>
                    <div id="report-loader" class="loader-container">
                        <i class="fa-solid fa-circle-notch fa-spin text-green-600 text-3xl"></i>
                        <p class="text-gray-600 mt-2">Aguardando resposta da IA...</p>
                    </div>
                    <div id="report-results" class="hidden mt-6">
                        <h3 class="results-title">Relatório Gerado:</h3>
                        <textarea id="report-output" rows="10" class="results-textarea mt-2" readonly></textarea>
                        <button id="copyReportBtn" class="button button-gray mt-2 w-full">
                            <span id="copyBtnTextContainer" class="flex items-center justify-center">
                                <i class="fa-solid fa-copy mr-2"></i>
                                <span>Copiar Relatório</span>
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        `
    };

    // --- Funções de Controle da UI ---
    function showToolSelection() {
        backToToolsButton.style.display = 'none';
        homeButton.style.display = 'inline-flex';
        toolInterfaceView.classList.remove('active');
        toolSelectionView.classList.add('active');
    }

    function showTool(targetId) {
        toolSelectionView.classList.remove('active');
        toolInterfaceView.innerHTML = toolTemplates[targetId];
        toolInterfaceView.classList.add('active');
        homeButton.style.display = 'none';
        backToToolsButton.style.display = 'inline-flex';
        activateToolListeners(targetId);
    }
    
    // --- Listeners de Navegação ---
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

    // --- Lógica Específica de Cada Ferramenta ---
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
        aiLoader.style.display = 'none';

        analyzeBtn.addEventListener('click', async () => {
            if (!problemDescription.value.trim()) return;
            aiLoader.style.display = 'block';
            aiResults.classList.add('hidden');
            analyzeBtn.disabled = true;
            try {
                // PROMPT ATUALIZADO PARA SER MAIS RESUMIDO
                const diagnosisPrompt = `Como especialista de suporte IRED, analise o seguinte problema e forneça uma "Causa Provável" e uma "Ação Imediata" (1-2 passos curtos). Formato: **Causa Provável:** [texto]. **Ação Imediata:** [texto]. Problema: "${problemDescription.value}"`;
                const diagnosis = await callGemini(diagnosisPrompt);
                document.getElementById('diagnosis-output').innerHTML = parseSimpleMarkdown(diagnosis);

                // PROMPT ATUALIZADO PARA SER MAIS RESUMIDO
                const scriptPrompt = `Com base no problema "${problemDescription.value}", crie uma única frase de abertura empática para o atendente usar.`;
                const script = await callGemini(scriptPrompt);
                document.getElementById('script-output').innerHTML = parseSimpleMarkdown(script);
                
                aiResults.classList.remove('hidden');
            } catch (error) {
                document.getElementById('diagnosis-output').innerHTML = `Erro: ${error.message}`;
            } finally {
                aiLoader.style.display = 'none';
                analyzeBtn.disabled = false;
            }
        });
    }

    function setupSimulador() {
        // (O código completo do simulador permanece aqui, sem alterações nesta etapa)
        const simSetupView = document.getElementById('sim-setup-view');
        const startSimBtn = document.getElementById('startSimBtn');

        startSimBtn.addEventListener('click', () => {
            const simChatView = document.getElementById('sim-chat-view');
            const simFeedbackView = document.getElementById('sim-feedback-view');
            const scenarioSelect = document.getElementById('scenarioSelect');
            const chatHistoryEl = document.getElementById('chat-history');
            const chatInput = document.getElementById('chat-input');
            const sendChatBtn = document.getElementById('sendChatBtn');
            const endSimBtn = document.getElementById('endSimBtn');
            const simLoader = document.getElementById('sim-loader');
            const feedbackResults = document.getElementById('feedback-results');
            const restartSimBtn = document.getElementById('restartSimBtn');
            let conversationHistory = [];
            const scenarios = { 'lentidao-frustrado': "Cliente frustrado com lentidão.", 'wifi-nao-funciona-leigo': "Cliente leigo com Wi-Fi que não funciona no quarto.", 'quedas-constantes-irritado': "Cliente irritado com quedas constantes.", 'velocidade-baixa-cabo': "Cliente com velocidade baixa no cabo."};
            
            simLoader.style.display = 'none';

            function appendMessage(text, sender) {
                const bubble = document.createElement('div');
                bubble.classList.add('chat-bubble', sender);
                bubble.innerHTML = parseSimpleMarkdown(text);
                chatHistoryEl.appendChild(bubble);
                chatHistoryEl.scrollTop = chatHistoryEl.scrollHeight;
            }

            async function start() {
                simSetupView.style.display = 'none';
                simChatView.style.display = 'flex';
                simLoader.style.display = 'block';
                const systemPrompt = `Vamos simular um atendimento. Você é o CLIENTE. Eu serei o ATENDENTE. Siga o perfil: ${scenarios[scenarioSelect.value]}. Comece com sua primeira reclamação.`;
                conversationHistory.push({ role: 'user', parts: [{ text: systemPrompt }] });
                try {
                    const firstResponse = await callGeminiWithHistory(conversationHistory);
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
                    const customerResponse = await callGeminiWithHistory(conversationHistory);
                    conversationHistory.push({ role: 'model', parts: [{ text: customerResponse }] });
                    appendMessage(customerResponse, 'customer');
                } finally {
                     simLoader.style.display = 'none';
                }
            }

            async function end() {
                simLoader.style.display = 'block';
                const feedbackPrompt = `Pare a simulação. Agora você é um coach de atendimento. Analise o diálogo a seguir e forneça um feedback construtivo sobre o desempenho do ATENDENTE, avaliando empatia, clareza e técnica. Dê pontos a melhorar.\n\nDiálogo: ${JSON.stringify(conversationHistory)}`;
                try {
                    const feedback = await callGemini(feedbackPrompt);
                    feedbackResults.innerHTML = parseSimpleMarkdown(feedback);
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

        reportLoader.style.display = 'none';
        generateReportBtn.addEventListener('click', async () => {
            if (!reportSummary.value.trim()) return;
            reportLoader.style.display = 'block';
            reportResults.classList.add('hidden');
            generateReportBtn.disabled = true;
            const prompt = `Converta este resumo informal em um relatório técnico formal para um sistema de tickets, com as seções "Relato do Cliente:", "Procedimentos Realizados:" e "Conclusão:". Use termos técnicos apropriados.\n\nResumo: "${reportSummary.value}"`;
            try {
                const formalReport = await callGemini(prompt);
                reportOutput.value = formalReport.replace(/<br>/g, '\n');
                reportResults.classList.remove('hidden');
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
            } else { throw new Error("Resposta da API inválida."); }
        } catch (error) {
            console.error("Erro na chamada da API:", error);
            return `Erro de comunicação: ${error.message}`;
        }
    }

    function parseSimpleMarkdown(text) {
        if (!text) return '';
        return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/\n/g, '<br>');
    }
});
