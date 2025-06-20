# 💡 Diagnóstico pelas Luzes da ONU

As luzes (**LEDs**) na ONU fornecem um diagnóstico rápido do estado da conexão.  
O padrão pode variar levemente entre modelos, mas geralmente segue esta lógica:


---

## 🔌 POWER

- **Verde Fixo**: Normal. O equipamento está ligado e recebendo energia da fonte.


---

## 🌐 PON (Passive Optical Network)

- **Verde Fixo**: Normal. A ONU está autenticada na rede da IRED e recebendo sinal da OLT.

- **Verde Piscando**: Tentando autenticar.  
  Pode indicar um **problema de provisionamento**.  
  Se persistir, **escalar para o Nível 2 (N2)**.


---

## 🚨 LOS (Loss of Signal)

- **Apagado**: Normal. Não há perda de sinal óptico.

- **Vermelho Fixo ou Piscando**:  
  ⚠️ **Alerta Crítico!**  
  Indica **perda total do sinal óptico**.  
  Este é o **principal indicador** de que há um **problema físico na fibra**.


---

## 🖧 LAN (Local Area Network)

- **Verde Fixo ou Piscando**: Normal.  
  Indica que há um dispositivo conectado via cabo de rede (roteador ou computador) **com tráfego de dados ativo**.
