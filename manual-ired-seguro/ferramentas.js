document.addEventListener('DOMContentLoaded', function() {
    
    // --- Lógica de Navegação do Dashboard de Ferramentas ---
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
        link.addEventListener('click', function(event) {
            event.preventDefault();
            // Ignora o link de "Voltar" que é um link real
            if (this.getAttribute('href') === 'index.html') {
                window.location.href = 'index.html';
                return;
            }
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

        aiLoader.innerHTML = '<p class="text-gray-600">Analisando...</p>';
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
                const diagnosis = "Resposta simulada para o diagnóstico."; // await callGemini(diagnosisPrompt);
                diagnosisOutput.innerHTML = diagnosis;

                const scriptPrompt = `Com base no seguinte diagnóstico e problema do cliente, gere um script de atendimento curto, empático e claro para o atendente de suporte usar para iniciar a solução do problema. O tom deve ser profissional e prestativo. Use Markdown para negrito para destacar termos importantes. Diagnóstico: "${diagnosis}". Problema do cliente: "${problemDescription.value}"`;
                const script = "Script de atendimento simulado."; // await callGemini(scriptPrompt);
                scriptOutput.innerHTML = script;

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

    // --- (A lógica para as outras ferramentas será adicionada aqui) ---

});
