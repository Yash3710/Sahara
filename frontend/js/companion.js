import { requireAuth, apiRequest, getAuthToken } from './supabaseClient.js';

// Protect page
const session = await requireAuth();
if (!session) throw new Error('Not authenticated');

// Elements
const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const thinkingIndicator = document.getElementById('thinking-indicator');
const chatError = document.getElementById('chat-error');
const chatErrorText = document.getElementById('chat-error-text');
const retryBtn = document.getElementById('retry-btn');

// Chat history (in memory for sending to API)
let chatHistory = [];
let lastFailedMessage = null;

// Scroll to bottom
function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Add message bubble to UI
function addMessage(role, text) {
  const wrapper = document.createElement('div');
  wrapper.className = role === 'user' 
    ? 'flex justify-end' 
    : 'flex items-start gap-3';

  if (role === 'assistant') {
    wrapper.innerHTML = `
      <div class="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center shrink-0">
        <i data-lucide="message-circle" class="text-white w-4 h-4"></i>
      </div>
      <div class="bg-white rounded-2xl rounded-tl-sm px-5 py-4 max-w-[85%] shadow-sm border border-gray-100">
        <p class="text-base text-gray-800 leading-relaxed">${escapeHtml(text)}</p>
      </div>
    `;
  } else {
    wrapper.innerHTML = `
      <div class="bg-green-600 text-white rounded-2xl rounded-tr-sm px-5 py-4 max-w-[85%] shadow-sm">
        <p class="text-base leading-relaxed">${escapeHtml(text)}</p>
      </div>
    `;
  }

  chatMessages.appendChild(wrapper);
  if (window.lucide) lucide.createIcons();
  scrollToBottom();
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Show/hide thinking
function setThinking(show) {
  thinkingIndicator.classList.toggle('hidden', !show);
  scrollToBottom();
}

// Show error
function showError(msg) {
  chatError.classList.remove('hidden');
  chatErrorText.textContent = msg;
}

function hideError() {
  chatError.classList.add('hidden');
}

// Send message
async function sendMessage(text) {
  hideError();
  addMessage('user', text);
  chatHistory.push({ role: 'user', content: text });

  chatInput.value = '';
  chatInput.disabled = true;
  sendBtn.disabled = true;
  setThinking(true);

  try {
    const data = await apiRequest('/api/companion/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: text,
        history: chatHistory.slice(-10), // Send last 10 messages for context
      }),
    });

    const reply = data.reply || 'I am sorry, I could not understand. Could you say that again?';
    addMessage('assistant', reply);
    chatHistory.push({ role: 'assistant', content: reply });
    lastFailedMessage = null;

  } catch (err) {
    lastFailedMessage = text;
    // Remove the user message from history since it failed
    chatHistory.pop();
    
    if (err.message.includes('not available') || err.message.includes('unavailable')) {
      showError('The AI companion is not available right now. Please try again later.');
    } else {
      showError(err.message || 'Could not send your message. Please try again.');
    }
  } finally {
    chatInput.disabled = false;
    sendBtn.disabled = false;
    setThinking(false);
    chatInput.focus();
  }
}

// Form submit
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;
  sendMessage(text);
});

// Retry button
retryBtn.addEventListener('click', () => {
  if (lastFailedMessage) {
    sendMessage(lastFailedMessage);
  }
});

// Load chat history from backend
async function loadChatHistory() {
  try {
    const data = await apiRequest('/api/companion/history');
    if (data.data && data.data.length > 0) {
      data.data.forEach(msg => {
        if (msg.role !== 'system') {
          addMessage(msg.role, msg.message);
          chatHistory.push({ role: msg.role, content: msg.message });
        }
      });
    }
  } catch {
    // Silently fail - history is a nice-to-have
  }
}

// Initialize
loadChatHistory();
chatInput.focus();
