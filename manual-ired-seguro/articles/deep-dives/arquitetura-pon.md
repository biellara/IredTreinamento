
**Descrição Curta:**  
Conheça a estrutura da rede PON e descubra como entender rapidamente seu funcionamento para agilizar o atendimento e resolver problemas com mais segurança.

---

## **O que é uma Rede PON?**

Imagine uma rede que conecta muitos clientes usando um único feixe de luz, sem precisar de equipamentos eletrônicos entre o provedor e o cliente. Essa é a **Rede PON (Passive Optical Network)**, uma solução inteligente e eficiente que usamos na IRED para entregar internet de alta qualidade.

Por ser uma rede **ponto-multiponto passiva**, o sinal óptico sai do provedor e é dividido para atender várias residências ou empresas ao mesmo tempo — tudo isso sem complicações ou manutenção constante no meio do caminho.

> [!NOTE]
> O "passiva" no nome significa justamente isso: **não há componentes ativos entre o provedor e o cliente** — uma das grandes vantagens para estabilidade e custo.

---

## Principais Elementos da Rede PON

Vamos conhecer os protagonistas dessa arquitetura:

- **OLT (Optical Line Terminal):**  
  O cérebro da rede, localizado no data center da IRED. É ele quem gera e gerencia o sinal óptico que vai para os clientes.

- **Splitter Óptico:**  
  Um divisor silencioso e eficiente que “replica” o sinal para vários clientes. Pode dividir o sinal em 2, 4, 8, 16 ou até mais saídas, conforme a necessidade.

- **Drop Fiber:**  
  O cabo de fibra que conecta o splitter até a casa ou empresa do cliente, levando o sinal diretamente até o equipamento do usuário.

- **ONT/ONU (Optical Network Terminal/Unit):**  
  O equipamento instalado no local do cliente que transforma o sinal de luz em dados digitais para uso imediato.

---

## Como o Sinal Viaja pela Rede

O caminho do sinal é simples, mas cheio de cuidados:

1. A **OLT envia o sinal óptico** com força suficiente, geralmente entre **+3 dBm e +5 dBm**.
2. Esse sinal passa pelo **splitter**, que divide a energia para várias conexões — cada divisão reduz a intensidade em cerca de **3 a 4 dB**.
3. No cliente, o **ONT recebe o sinal** dentro de uma faixa segura, que vai de **-8 dBm a -27 dBm**.

> [!WARNING]
> Se o sinal estiver fora dessa faixa, o cliente pode sofrer com **quedas, lentidão ou perda total de conexão**. É importante identificar e agir rápido.

---

## Diagnóstico Prático para Atendimento

Durante o atendimento, use este roteiro para identificar problemas na rede PON:

1. **Verifique o nível do sinal óptico** no sistema da OLT — ele deve estar dentro da faixa operacional.
2. Pergunte ao cliente sobre o status da luz **LOS** no equipamento:
   - **Luz apagada ou piscando lentamente:** sinal normal.
   - **Luz acesa constante ou piscando rápido:** sinal ausente ou falho.

3. Oriente o cliente a conferir:
   - Se há **dobras ou torções fortes** no cabo de fibra.
   - Se o conector está **limpo e bem encaixado**.
   - Se houve **obras, chuvas fortes ou movimentações recentes** no local.

4. Registre todas as informações com detalhes e, se necessário, encaminhe para a equipe técnica externa ou nível superior.

> [!DANGER]
> Nunca peça para o cliente mexer no cabo de fibra sem orientação adequada. A fibra pode causar acidentes e a manipulação incorreta compromete a qualidade do sinal.

---

## Por que a Rede PON facilita nosso trabalho?

- É uma rede mais estável e com menos pontos de falha.
- Diagnósticos ficam mais simples, focando em poucos pontos críticos.
- Expansão rápida: novos clientes são adicionados sem grandes alterações.
- Monitoramento remoto eficiente permite agir antes que o cliente perceba problemas.

---

## Para Encerrar: Como Tirar o Máximo do Atendimento

Conhecer a arquitetura PON não é só uma questão técnica — é uma forma de **agilizar o atendimento e garantir a satisfação do cliente**. Com um olhar atento ao sinal óptico e à luz LOS, o atendente pode diagnosticar problemas com confiança e direcionar soluções certeiras.

> [!NOTE]
> Para aprofundar seu conhecimento, consulte também os artigos “Leitura de Sinal Óptico no Sistema” e “Interpretando as Luzes da ONU”.

---

Com essa base, a equipe IRED estará pronta para enfrentar os desafios do dia a dia, entregando suporte de qualidade com segurança e eficiência.
