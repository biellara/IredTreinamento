document.addEventListener('DOMContentLoaded', function() {
    // --- Navigation ---
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const navCards = document.querySelectorAll('.nav-card');
    const views = document.querySelectorAll('.main-content-area');

    function switchView(targetId) {
        views.forEach(view => {
            view.classList.toggle('active', view.id === targetId);
        });
        sidebarLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.target === targetId);
        });
    }

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchView(link.dataset.target);
        });
    });
    
     navCards.forEach(card => {
        card.addEventListener('click', (e) => {
            e.preventDefault();
            switchView(card.dataset.target);
        });
    });

    // --- AI Tools Logic ---

    // Diagnóstico
    const analyzeBtn = document.getElementById('analyzeBtn');
    const problemDescription = document.getElementById('problemDescription');
    const aiLoader = document.getElementById('ai-loader');
    const aiResults = document.getElementById('ai-results');
    const diagnosisOutput = document.getElementById('diagnosis-output');
    const scriptOutput = document.getElementById('script-output');
    
    if (analyzeBtn) {
        aiLoader.style.display = 'none'; // Garante que o loader comece escondido
        analyzeBtn.addEventListener('click', async () => {
            if (!problemDescription.value.trim()) { problemDescription.focus(); return; }
            aiLoader.style.display = 'block';
            aiResults.classList.add('hidden');
            analyzeBtn.disabled = true;
            try {
                const diagnosisPrompt = `Você é um assistente especialista para um atendente de suporte técnico de um provedor de internet chamado IRED. Sua tarefa é analisar a descrição do problema de um cliente e, com base no Manual Técnico da IRED, sugerir um checklist estruturado de passos de verificação. O manual cobre: 1. Diagnóstico de Conexão (status do sistema, falhas massivas, níveis de sinal), 2. Diagnóstico de Lentidão (testes de velocidade, categoria de cabo, bandas Wi-Fi), 3. Diagnóstico de Cobertura Wi-Fi (força do sinal, interferências). Com base no seguinte problema do cliente, forneça a causa provável e um checklist curto e priorizado do que o atendente deve investigar. Formate a resposta de forma clara, com tópicos e usando Markdown para negrito. Problema do cliente: "${problemDescription.value}"`;
                const diagnosis = await callGemini(diagnosisPrompt);
                diagnosisOutput.innerHTML = parseSimpleMarkdown(diagnosis);
                
                const scriptPrompt = `Com base no seguinte diagnóstico e problema do cliente, gere um script de atendimento curto, empático e claro para o atendente de suporte usar para iniciar a solução do problema. O tom deve ser profissional e prestativo. Use Markdown para negrito para destacar termos importantes. Diagnóstico: "${diagnosis}". Problema do cliente: "${problemDescription.value}"`;
                const script = await callGemini(scriptPrompt);
                scriptOutput.innerHTML = parseSimpleMarkdown(script);
                aiResults.classList.remove('hidden');
            } catch (error) {
                console.error('Error calling Gemini API:', error);
                diagnosisOutput.innerHTML = 'Ocorreu um erro ao analisar o problema. Por favor, tente novamente.';
                scriptOutput.innerHTML = '';
                aiResults.classList.remove('hidden');
            } finally {
                aiLoader.style.display = 'none';
                analyzeBtn.disabled = false;
            }
        });
    }

    // Simulador
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
    let conversationHistory = [];
    const scenarios = {
        'lentidao-frustrado': "Você é um cliente chamado Carlos. Você está muito frustrado porque sua internet está lenta há dias, especialmente à noite quando tenta ver filmes. Seja impaciente e um pouco irritado.",
        'wifi-nao-funciona-leigo': "Você é uma cliente chamada Maria. Você não entende muito de tecnologia. Sua queixa é que o 'sinal do wi-fi não chega no seu quarto', que fica no segundo andar. Seja um pouco confusa mas simpática.",
        'quedas-constantes-irritado': "Você é um cliente chamado João. Sua internet cai o tempo todo, várias vezes por hora, atrapalhando seu trabalho home office. Você está muito irritado e ameaça cancelar o plano.",
        'velocidade-baixa-cabo': "Você é uma cliente chamada Sandra. Você contratou um plano de 500 Mega, mas quando testa a velocidade no seu computador de mesa (conectado via cabo) nunca passa de 95 Mega. Você está desconfiada que está sendo enganada."
    };

    if (simLoader) simLoader.style.display = 'none';

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
    
    if (startSimBtn) startSimBtn.addEventListener('click', startSimulation);
    if (sendChatBtn) sendChatBtn.addEventListener('click', sendChatMessage);
    if (chatInput) chatInput.addEventListener('keydown', (e) => { if(e.key === 'Enter' && !sendChatBtn.disabled) sendChatMessage(); });
    if (endSimBtn) endSimBtn.addEventListener('click', endSimulation);
    if (restartSimBtn) restartSimBtn.addEventListener('click', () => {
        simChatView.style.display = 'none';
        simFeedbackView.style.display = 'none';
        simSetupView.style.display = 'block';
    });

    // Gerador de Relatório
    const generateReportBtn = document.getElementById('generateReportBtn');
    const reportSummary = document.getElementById('reportSummary');
    const reportLoader = document.getElementById('report-loader');
    const reportResults = document.getElementById('report-results');
    const reportOutput = document.getElementById('report-output');
    const copyReportBtn = document.getElementById('copyReportBtn');
    
    if (generateReportBtn) {
        reportLoader.style.display = 'none'; // Garante que o loader comece escondido
        generateReportBtn.addEventListener('click', async () => {
            if (!reportSummary.value.trim()) { reportSummary.focus(); return; }
            reportLoader.style.display = 'block';
            reportResults.classList.add('hidden');
            generateReportBtn.disabled = true;
            const prompt = `Você é um assistente para atendentes de suporte técnico da IRED. Sua tarefa é converter um resumo informal de um atendimento em um relatório técnico formal e bem-estruturado para ser inserido no sistema de tickets. O relatório deve ser claro, conciso e usar terminologia técnica apropriada (ex: "verificado sinal óptico", "ajustado canal da rede Wi-Fi", "cliente orientado a reiniciar equipamentos"). Estruture o relatório com as seções: "Relato do Cliente:", "Procedimentos Realizados:" e "Conclusão:".\n\nResumo do atendente: "${reportSummary.value}"`;
            try {
                const formalReport = await callGemini(prompt);
                reportOutput.value = formalReport.replace(/<br>/g, '\n');
                reportResults.classList.remove('hidden');
            } catch (error) {
                console.error("Error generating report:", error);
                reportOutput.value = "Desculpe, ocorreu um erro ao gerar o relatório. Tente novamente.";
                reportResults.classList.remove('hidden');
            } finally {
                reportLoader.style.display = 'none';
                generateReportBtn.disabled = false;
            }
        });
    }

    if (copyReportBtn) {
        copyReportBtn.addEventListener('click', () => {
            reportOutput.select();
            document.execCommand('copy');
            const copyBtnText = document.getElementById('copyBtnText');
            copyBtnText.textContent = 'Copiado!';
            copyReportBtn.classList.add('bg-green-700');
            setTimeout(() => {
                copyBtnText.textContent = 'Copiar Relatório';
                copyReportBtn.classList.remove('bg-green-700');
            }, 2000);
        });
    }

    // --- Base de Conhecimento ---
    const manualContent = [
        { title: 'Conector da Fibra', content: `A ponta do conector é <strong>extremamente sensível</strong> a poeira, gordura e arranhões. Existem dois tipos: Verde (APC) e Azul (UPC). Nosso padrão é o Verde. <strong>NUNCA</strong> instrua o cliente a desconectá-lo.` },
        { title: 'ONU (Optical Network Unit)', content: `A ONU converte o sinal de luz da fibra para sinal elétrico. Luzes importantes:<ul><li><strong>POWER:</strong> Acesa e estável (OK).</li><li><strong>PON:</strong> Acesa e estável (Sinal da fibra OK).</li><li><strong>LOS:</strong> Apagada (OK). Se estiver acesa ou piscando, há perda de sinal e uma O.S. deve ser agendada.</li><li><strong>LAN:</strong> Piscando (Comunicando com roteador).</li></ul>` },
        { title: 'Cabo de Rede (RJ45)', content: `Pode limitar a velocidade. Verifique a categoria:<ul><li><strong>CAT 5:</strong> Limita a rede em 100 Mbps.</li><li><strong>CAT 5e (ou superior):</strong> Suporta 1 Gbps ou mais. Essencial para planos acima de 100 Mega.</li></ul>` },
        { title: 'Diagnóstico de Lentidão', content: `Primeiro, peça um teste no fast.com ou speedtest.net. Lembre-se que a velocidade garantida só é válida via cabo de rede (CAT 5e+) em um dispositivo compatível. Fatores que limitam a velocidade: cabo de rede antigo, rede Wi-Fi (2.4GHz é mais lenta que 5GHz) e capacidade do dispositivo do cliente.` },
        { title: 'Diagnóstico de Wi-Fi', content: `Causas comuns para sinal fraco são barreiras físicas (paredes, lajes, espelhos, aquários) e interferência de outros eletrônicos (micro-ondas, telefones sem fio, Wi-Fi de vizinhos). Use o app WiFiMan para medir o sinal (dBm) nos cômodos. Quanto mais perto de 0, melhor. Sinal abaixo de -70 dBm é considerado ruim.` },
    ];

    const manualContainer = document.getElementById('manual-content');
    if (manualContainer) {
        manualContent.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card p-6';
            card.innerHTML = `<h3>${item.title}</h3><div class="mt-4 text-gray-600">${item.content}</div>`;
            manualContainer.appendChild(card);
        });
    }

    // --- Central API Call Function ---
    async function callGemini(prompt) {
        return callGeminiWithHistory([{ role: "user", parts: [{ text: prompt }] }]);
    }
    
    async function callGeminiWithHistory(history) {
        // Esta é a rota que seu servidor local ou a função Netlify usará.
        const apiEndpoint = '/api/gemini'; 

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
                console.error("Estrutura de resposta inesperada:", result);
                throw new Error("Não foi possível processar a resposta do servidor.");
            }

        } catch (error) {
            console.error("Erro na função callGeminiWithHistory:", error);
            // Retorna a mensagem de erro para ser exibida na UI
            return `Erro de comunicação com o servidor. Verifique o console para mais detalhes. (${error.message})`;
        }
    }

    function parseSimpleMarkdown(text) {
        if (!text) return '';
        let newText = text;
        // Converte **negrito** para <strong>
        newText = newText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Converte *itálico* para <em>
        newText = newText.replace(/\*(.*?)\*/g, '<em>$1</em>');
        // Converte quebras de linha para <br>
        newText = newText.replace(/\n/g, '<br>');
        return newText;
    }
});
