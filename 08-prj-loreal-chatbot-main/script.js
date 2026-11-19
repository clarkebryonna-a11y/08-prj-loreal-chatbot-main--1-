// The Worker forwards this request to OpenAI and keeps the API key private.
const WORKER_URL = "https://dry-shape-ca7f.clarkebryonna.workers.dev/";
const OUT_OF_SCOPE_REPLY =
  "I don't know. I can only help with L'Oréal products, beauty routines, and recommendations.";
const SYSTEM_MESSAGE = `
You are a L'Oréal beauty assistant. Help customers discover and understand L'Oréal
makeup, skincare, haircare, and fragrance products, and create personalized routines
and recommendations. If a question is unrelated to L'Oréal products, beauty routines,
recommendations, or beauty-related topics, reply exactly:
"I don't know. I can only help with L'Oréal products, beauty routines, and recommendations."
`;

// Get the chat elements from the page.
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendButton = document.getElementById("sendBtn");

// Keep the conversation so the assistant can use earlier messages as context.
const messages = [{ role: "system", content: SYSTEM_MESSAGE }];

function addMessage(sender, text) {
  const messageElement = document.createElement("p");
  messageElement.className = `msg ${sender}`;
  messageElement.textContent = text;
  chatWindow.appendChild(messageElement);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function isBeautyQuestion(message) {
  const beautyWords = [
    "l'oréal", "loreal", "makeup", "cosmetic", "skincare", "skin", "hair",
    "shampoo", "conditioner", "fragrance", "perfume", "mascara", "foundation",
    "lipstick", "serum", "moisturizer", "routine", "beauty", "acne",
    "sunscreen",
  ];

  const lowerCaseMessage = message.toLowerCase();
  return beautyWords.some((word) => lowerCaseMessage.includes(word));
}

async function requestChatbotResponse(message) {
  messages.push({ role: "user", content: message });

  // The Worker accepts the OpenAI Chat Completions messages format.
  const response = await fetch(WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4.1",
      messages,
      max_completion_tokens: 300,
    }),
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(
      `Chat request failed with status ${response.status}${responseText ? `: ${responseText}` : ""}`,
    );
  }

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content;

  if (typeof reply !== "string" || reply.trim() === "") {
    throw new Error("The chatbot returned an invalid response");
  }

  messages.push({ role: "assistant", content: reply });
  return reply;
}

addMessage(
  "ai",
  "👋 Hi! Ask me about L'Oréal products, beauty routines, or recommendations.",
);

// Capture the submitted message and display the assistant response.
chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const message = userInput.value.trim();
  if (!message) {
    return;
  }

  addMessage("user", message);
  userInput.value = "";

  if (!isBeautyQuestion(message)) {
    addMessage("ai", OUT_OF_SCOPE_REPLY);
    return;
  }

  sendButton.disabled = true;

  try {
    const reply = await requestChatbotResponse(message);
    addMessage("ai", reply);
  } catch (error) {
    console.error(error);
    addMessage("ai", "I couldn't reach the L'Oréal assistant right now. Please try again later.");
  } finally {
    sendButton.disabled = false;
    userInput.focus();
  }
});
