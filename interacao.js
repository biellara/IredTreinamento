document.addEventListener('DOMContentLoaded', function() {
    const slides = Array.from(document.querySelectorAll('.slide'));
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const slideCounter = document.getElementById('slideCounter');
    let currentSlide = 0;

    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
        });
        if (slideCounter) {
            slideCounter.textContent = `${index + 1} / ${slides.length}`;
        }
        if (prevBtn) {
            prevBtn.disabled = index === 0;
        }
        if (nextBtn) {
            nextBtn.disabled = index === slides.length - 1;
        }
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentSlide < slides.length - 1) {
                currentSlide++;
                showSlide(currentSlide);
            }
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentSlide > 0) {
                currentSlide--;
                showSlide(currentSlide);
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (document.activeElement.tagName === 'TEXTAREA') return;
        if (e.key === 'ArrowRight' && nextBtn && !nextBtn.disabled) {
            nextBtn.click();
        } else if (e.key === 'ArrowLeft' && prevBtn && !prevBtn.disabled) {
            prevBtn.click();
        }
    });

    showSlide(currentSlide);
    
    function parseSimpleMarkdown(text) {
        if (!text) return '';
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        text = text.replace(/\n/g, '<br>');
        return text;
    }

    // --- Gemini AI Modal Logic ---
    const aiModal = document.getElementById('aiModal');
    const openAiModalBtn = document.querySelector('#openAiModalBtn');
    const closeAiModalBtn = document.getElementById('closeAiModalBtn');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const problemDescription = document.getElementById('problemDescription');
    const aiLoader = document.getElementById('ai-loader');
    const aiResults = document.getElementById('ai-results');
    const diagnosisOutput = document.getElementById('diagnosis-output');
    const scriptOutput = document.getElementById('script-output');

    if(openAiModalBtn) {
        openAiModalBtn.addEventListener('click', () => {
            if(aiModal) aiModal.classList.add('visible');
        });
    }

    if (closeAiModalBtn) {
        closeAiModalBtn.addEventListener('click', () => {
            if(aiModal) aiModal.classList.remove('visible');
        });
    }
    
    if (aiModal) {
        aiModal.addEventListener('click', (e) => {
            if(e.target === aiModal) {
                 aiModal.classList.remove('visible');
            }
        });
    }

    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', async () => {
            if (!problemDescription.value.trim()) {
                alert('Por favor, descreva o problema do cliente.');
                return;
            }
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
    
    // --- Tech Assistant Modal Logic ---
    const techAssistantModal = document.getElementById('techAssistantModal');
    const closeTechAssistantModalBtn = document.getElementById('closeTechAssistantModalBtn');
    const techTopicContent = document.getElementById('tech-topic-content');
    const explainForMeBtn = document.getElementById('explainForMeBtn');
    const explainForCustomerBtn = document.getElementById('explainForCustomerBtn');
    const techAssistantLoader = document.getElementById('tech-assistant-loader');
    const techAssistantResults = document.getElementById('tech-assistant-results');
    const techAssistantResultTitle = document.getElementById('tech-assistant-result-title');
    const techAssistantOutput = document.getElementById('tech-assistant-output');

    document.querySelectorAll('.openTechAssistantBtn').forEach(button => {
        button.addEventListener('click', (e) => {
            const topic = e.target.dataset.topic;
            if(techTopicContent) techTopicContent.textContent = topic;
            if(techAssistantResults) techAssistantResults.classList.add('hidden');
            if(techAssistantModal) techAssistantModal.classList.add('visible');
        });
    });

    if (closeTechAssistantModalBtn) {
        closeTechAssistantModalBtn.addEventListener('click', () => {
            if(techAssistantModal) techAssistantModal.classList.remove('visible');
        });
    }
    
    if (techAssistantModal) {
        techAssistantModal.addEventListener('click', (e) => {
            if(e.target === techAssistantModal) {
                 techAssistantModal.classList.remove('visible');
            }
        });
    }

    if (explainForMeBtn) {
        explainForMeBtn.addEventListener('click', async () => {
            const topic = techTopicContent.textContent;
            techAssistantResultTitle.textContent = "Explicação para o Atendente:";
            const prompt = `Como um instrutor sênior de suporte técnico, explique o seguinte tópico de forma simples e clara para um novo atendente. Use Markdown para destacar pontos-chave com negrito. Tópico: "${topic}"`;
            await generateTechExplanation(prompt);
        });
    }

    if (explainForCustomerBtn) {
        explainForCustomerBtn.addEventListener('click', async () => {
            const topic = techTopicContent.textContent;
            techAssistantResultTitle.textContent = "Sugestão de Fala para o Cliente:";
            const prompt = `Gere uma explicação curta, empática e muito fácil de entender para um cliente leigo sobre o seguinte tópico técnico. Evite jargões. Use Markdown para negrito para enfatizar termos importantes. Tópico: "${topic}"`;
            await generateTechExplanation(prompt);
        });
    }
    
    async function generateTechExplanation(prompt) {
        techAssistantLoader.style.display = 'block';
        techAssistantResults.classList.add('hidden');
        explainForMeBtn.disabled = true;
        explainForCustomerBtn.disabled = true;

        try {
            const explanation = await callGemini(prompt);
            techAssistantOutput.innerHTML = parseSimpleMarkdown(explanation);
            techAssistantResults.classList.remove('hidden');
        } catch (error) {
            console.error('Error calling Gemini API for tech explanation:', error);
            techAssistantOutput.innerHTML = 'Ocorreu um erro ao gerar a explicação. Tente novamente.';
            techAssistantResults.classList.remove('hidden');
        } finally {
            techAssistantLoader.style.display = 'none';
            explainForMeBtn.disabled = false;
            explainForCustomerBtn.disabled = false;
        }
    }

    async function callGemini(prompt) {
         const apiKey = ""; 
         const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
         const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
         const response = await fetch(apiUrl, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(payload)
         });
         if (!response.ok) { throw new Error(`API call failed with status: ${response.status}`); }
         const result = await response.json();
         if (result.candidates && result.candidates.length > 0 && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts.length > 0) {
             return result.candidates[0].content.parts[0].text;
         } else {
            return "Não foi possível gerar uma resposta. A estrutura do retorno da API é inesperada.";
         }
    }
});