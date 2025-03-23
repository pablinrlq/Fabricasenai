// Seleção dos elementos do DOM
const userInput = document.getElementById("user-input");
const chatContainer = document.getElementById("chat-messages");
const chatToggle = document.getElementById("chat-toggle");
const chatbotContainer = document.getElementById("chatbot-container");
const closeChat = document.getElementById("close-chat");
const sendBtn = document.getElementById("send-btn");

// Eventos de abrir/fechar chat
chatToggle.addEventListener("click", () => {
  chatbotContainer.classList.toggle("hidden");
  if (!chatbotContainer.classList.contains("hidden")) {
    userInput.focus();
  }
});

closeChat.addEventListener("click", () => {
  chatbotContainer.classList.add("hidden");
});

// Evento de envio de mensagem
sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    sendMessage();
  }
});

// Função para enviar mensagem e obter resposta da IA
async function sendMessage() {
  const message = userInput.value.trim();
  if (message === "") return;

  addMessage(message, "user"); // Mostra a mensagem do usuário
  userInput.value = "";

  try {
    const response = await getAIResponse(message);
    addMessage(response, "assistant");
  } catch (error) {
    console.error("Erro ao obter resposta da IA:", error);
    addMessage("❌ Ocorreu um erro ao obter a resposta.", "assistant");
  }
}

// Função para adicionar mensagens ao chat
function addMessage(text, sender) {
  const messageElement = document.createElement("div");
  messageElement.classList.add("message", sender);
  messageElement.textContent = text;
  chatContainer.appendChild(messageElement);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Função para obter resposta da IA via API da Mistral usando proxy CORS
async function getAIResponse(message) {
  const apiKey = "NRSd9tVnmSWOAHGIpTgx0oxNEX1jmxyk";
  const agentId = "ag:7ed067d2:20250305:untitled-agent:2ffe4ac2";
  const apiUrl = "https://api.mistral.ai/v1/chat/completions";
  const model = "mistral-large-2411";

  const requestBody = {
    model: model,
    messages: [{ role: "user", content: message }],
    max_tokens: 150,
    presence_penalty: 0.5,
    frequency_penalty: 0.3,
    stream: false
  };

  try {
    console.log("🔵 Enviando requisição para a API...");
    console.log("📝 Corpo da requisição:", JSON.stringify(requestBody, null, 2));

    const response = await fetch(proxyUrl + apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "X-Agent-ID": agentId
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      console.error("⚠️ Erro da API:", errorDetails);
      throw new Error(`Erro na API: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Resposta da API:", data);

    return data.choices ? data.choices[0].message.content : "⚠️ Sem resposta válida.";
  } catch (error) {
    console.error("❌ Erro ao obter resposta da IA:", error);
    return "❌ Erro ao processar sua solicitação.";
  }
}
