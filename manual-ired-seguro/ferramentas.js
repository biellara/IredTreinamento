document.addEventListener('DOMContentLoaded', function() {
    
    // --- Elementos do DOM ---
    const toolSelectionView = document.getElementById('view-tool-selection');
    const toolInterfaceView = document.getElementById('view-tool-interface');
    const toolCards = document.querySelectorAll('.tool-card');

    // --- Templates de HTML para cada ferramenta ---
    const toolTemplates = {
        'view-diagnostico': `
            <header>
                <h1 class="view-title">✨ Diagnóstico Inteligente</h1>
                <p class="view-subtitle">Descreva o problema do cliente para receber um checklist de ações e um script de atendimento.</p>
            </header>
            <div class="card p-8 mt-8">
                <label for="problemDescription" class="block text-gray-700 font-semibold mb-2">Descrição do problema:</label>
                <textarea id="problemDescription" rows="4" class="form-textarea" placeholder="Ex: 'Minha internet está caindo toda hora na TV...'"></textarea>
                <button id="analyzeBtn" class="button button-red mt-4 w-full">Analisar Problema</button>
                <div id="ai-loader" class="loader-container"></div>
                <div id="ai-results" class="hidden mt-6 space-y-6">
                    <div>
                        <h3 class="results-title">📋 Diagnóstico Sugerido:</h3>
                        <div id="diagnosis-output" class="results-box"></div>
                    </div>
                    <div>
                        <h3 class="results-title">💬 Script de Atendimento Sugerido:</h3>
                        <div id="script-output" class="results-box bg-red-50 border-red-200"></div>
                    </div>
                </div>
            </div>
        `,
        'view-simulador': `
            <header>
                <h1 class="view-title">💬 Simulador de Atendimento</h1>
                <p class="view-subtitle">Escolha um cenário e pratique suas habilidades de comunicação.</p>
            </header>
             <p class="mt-8 text-center">O conteúdo desta ferramenta será implementado na próxima etapa.</p>
        `,
        'view-relatorio': `
             <header>
                 <h1 class="view-title">📝 Gerador de Relatório</h1>
                 <p class="view-subtitle">Transforme um resumo simples em um relatório técnico completo.</p>
            </header>
            <p class="mt-8 text-center">O conteúdo desta ferramenta será implementado na próxima etapa.</p>
        `
    };

    // --- Funções de Controle da UI ---
    function showToolSelection() {
        toolInterfaceView.innerHTML = '';
        toolInterfaceView.classList.remove('active');
        toolSelectionView.classList.add('active');
    }

    function showTool(targetId) {
        toolSelectionView.classList.remove('active');
        toolInterfaceView.innerHTML = `<div class="tool-interface-container">${toolTemplates[targetId]}</div>`;
        toolInterfaceView.classList.add('active');
        
        // Após injetar o HTML, reativamos os listeners da ferramenta específica
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

    // --- Lógica Específica de Cada Ferramenta ---
    function activateToolListeners(toolId) {
        if (toolId === 'view-diagnostico') {
            const analyzeBtn = document.getElementById('analyzeBtn');
            const problemDescription = document.getElementById('problemDescription');
            const aiLoader = document.getElementById('ai-loader');
            const aiResults = document.getElementById('ai-results');
            const diagnosisOutput = document.getElementById('diagnosis-output');
            const scriptOutput = document.getElementById('script-output');

            aiLoader.style.display = 'none';

            analyzeBtn.addEventListener('click', async () => {
                if (!problemDescription.value.trim()) { return; }
                aiLoader.style.display = 'block';
                aiResults.classList.add('hidden');
                analyzeBtn.disabled = true;

                try {
                    const prompt = `Gere um diagnóstico e um script de atendimento para: "${problemDescription.value}"`;
                    const response = await callGemini(prompt);
                    diagnosisOutput.innerHTML = parseSimpleMarkdown("Diagnóstico simulado para: " + problemDescription.value);
                    scriptOutput.innerHTML = parseSimpleMarkdown("Script simulado para: " + problemDescription.value);
                    aiResults.classList.remove('hidden');
                } catch (error) {
                    diagnosisOutput.innerHTML = `Erro: ${error.message}`;
                } finally {
                    aiLoader.style.display = 'none';
                    analyzeBtn.disabled = false;
                }
            });
        }
        // As lógicas do Simulador e do Gerador de Relatórios serão adicionadas aqui
    }

    // --- Funções de API e Utilitários ---
    async function callGemini(prompt) {
        console.log("Chamando API com o prompt:", prompt);
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simula delay
        return `Resposta da IA para: ${prompt}`;
    }

    function parseSimpleMarkdown(text) {
        if (!text) return '';
        return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
    }
});
