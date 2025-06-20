# Como Identificar Qual Banda o Dispositivo Está Usando

**Descrição Curta:**  
Aprenda a identificar se o dispositivo do cliente está conectado à rede 2.4GHz ou 5GHz e oriente corretamente durante o atendimento.

---

## Como o Nome da Rede Pode Ajudar

Na maioria dos roteadores dual band, as redes vêm com nomes diferentes, como:

- `IRED_24G` → Rede 2.4GHz
- `IRED_5G` → Rede 5GHz

> [!NOTE]
> Se o cliente não sabe qual está usando, oriente a **esquecer as redes** e conectar manualmente à rede desejada.

---

## Checando no Dispositivo

### Android:

1. Acesse **Configurações > Wi-Fi**.
2. Toque na rede conectada.
3. Verifique a **frequência** ou **detalhes da conexão** — estará como 2.4GHz ou 5GHz.

### iPhone:

No iOS não é exibido diretamente. Mas se a rede tiver “5G” no nome, isso indica que está conectada à banda 5GHz.

### Windows:

1. Abra o Prompt de Comando (cmd).
2. Digite: `netsh wlan show interfaces`
3. Veja a linha **Radio type**: se for `802.11ac` ou `802.11ax`, está usando 5GHz.

### Mac:

1. Pressione **Option** e clique no ícone de Wi-Fi.
2. A informação **"Channel"** mostrará algo como:
   - `Channel 6` → 2.4GHz
   - `Channel 36 ou superior` → 5GHz

> [!WARNING]
> Se a rede estiver muito lenta ou com quedas, teste alternar entre as bandas disponíveis para ver qual oferece melhor estabilidade.

---

## Conclusão

Saber qual banda o dispositivo está usando permite diagnósticos mais rápidos e decisões mais assertivas, especialmente quando o cliente relata **lentidão ou instabilidade intermitente**.