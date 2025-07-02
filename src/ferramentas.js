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

/**
 * Configura toda a lógica e os event listeners para o simulador de chat.
 * Esta função deve ser chamada uma vez quando a página é carregada.
 */
function setupSimulador() {
    // --- Seleção de Elementos do DOM ---
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

    // --- Estado da Simulação ---
    let conversationHistory = [];
    let isSimulating = false;

    const scenarios = {
        'lentidao-frustrado': "Cliente frustrado com lentidão.",
        'wifi-nao-funciona-leigo': "Cliente leigo com Wi-Fi que não funciona no quarto.",
        'quedas-constantes-irritado': "Cliente irritado com quedas constantes.",
        'velocidade-baixa-cabo': "Cliente com velocidade baixa no cabo.",
        'problemas-com-dvr': "Cliente com problemas no DVR"
    };

    // --- Funções Auxiliares ---

    function appendMessage(text, sender) {
        const bubble = document.createElement('div');
        bubble.classList.add('chat-bubble', sender);
        bubble.innerHTML = typeof converter !== 'undefined' ? converter.makeHtml(text) : text;
        chatHistoryEl.appendChild(bubble);
        chatHistoryEl.scrollTop = chatHistoryEl.scrollHeight;
    }

    function showError(message) {
        console.error(message);
        // RECOMENDAÇÃO: Substitua o alert por um elemento de UI não-bloqueante.
    }

    // --- Funções Principais da Simulação ---

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
        
        const systemPrompt = `**INSTRUÇÕES DE PERSONA (VOCÊ DEVE SEGUIR ISSO EM TODAS AS RESPOSTAS):**
- Você é o CLIENTE em uma simulação de atendimento.
- Seu perfil é: "${scenarios[scenarioValue]}".
- Você deve manter esse personagem durante toda a conversa. Não saia do personagem.
- Eu serei o ATENDENTE.

Agora, inicie a conversa com a sua primeira reclamação, agindo como o cliente descrito.`;

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

        const feedbackPrompt = `Assuma o papel de um Analista de Qualidade (QA). Avalie o diálogo a seguir sob a ótica da satisfação do cliente. Forneça um feedback estruturado, atribuindo uma nota de 0 a 10 para cada um dos seguintes pilares do atendimento. Justifique cada nota e aponte melhorias.\n\nPilares de Análise:\n1.  **Empatia e Cordialidade:** O atendente demonstrou interesse genuíno e uma comunicação amigável?\n2.  **Clareza e Eficiência:** A solução foi comunicada de forma clara e o atendimento foi ágil?\n3.  **Resolução do Problema:** O atendente identificou e resolveu a necessidade central do cliente?\n4.  **Técnica e Conhecimento:** O atendente demonstrou domínio dos procedimentos e da informação?\n\nDiálogo para Análise:\n${JSON.stringify(conversationHistory.slice(1))}`;

        try {
            const feedbackText = await callGeminiAPI(feedbackPrompt);
            feedbackResults.innerHTML = typeof converter !== 'undefined' ? converter.makeHtml(feedbackText) : feedbackText;

            const token = localStorage.getItem('token');
            if (!token) throw new Error('Usuário não autenticado.');

            const scenario = document.getElementById('scenarioSelect').value;

            const response = await fetch('/api/tools/simulador', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    scenario,
                    chatHistory: conversationHistory,
                    feedback: feedbackText,
                }),
            });

            if (!response.ok) {
                throw new Error(`Erro ao salvar simulação: ${response.statusText}`);
            }

            simChatView.style.display = 'none';
            simFeedbackView.style.display = 'block';

        } catch (error) {
            showError('Houve um problema ao finalizar a simulação. Tente novamente.');
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

    // --- Adiciona os Event Listeners (SEÇÃO ATUALIZADA) ---
    startSimBtn.addEventListener('click', startSimulation);
    sendChatBtn.addEventListener('click', sendMessage);
    endSimBtn.addEventListener('click', endSimulation);
    restartSimBtn.addEventListener('click', restartSimulation);

    // O listener de 'submit' é mantido como uma garantia para outros métodos de envio
    // (ex: botão 'Go' em teclados de celular), mas a lógica principal do Enter será tratada abaixo.
    if (chatForm) {
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Previne o recarregamento da página.
            sendMessage();      // Garante que a submissão do formulário envie a mensagem.
        });
    }

    // ATUALIZAÇÃO: Adicionado um listener para a tecla 'Enter' diretamente no campo de input.
    // Esta é uma abordagem mais robusta para controlar o comportamento da tecla.
    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            // Verifica se a tecla pressionada é 'Enter' E a tecla 'Shift' NÃO está pressionada.
            if (e.key === 'Enter' && !e.shiftKey) {
                // Previne o comportamento padrão do Enter (que é submeter o formulário ou criar nova linha).
                e.preventDefault();
                
                // Chama a função para enviar a mensagem.
                sendMessage();
            }
        });
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