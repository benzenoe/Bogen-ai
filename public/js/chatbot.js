// Bogen.ai Chatbot Widget
(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    apiUrl: '/api/chat',
    welcomeMessage: "Hi! I'm Bogen, Edmund's AI assistant. I can help you learn about our AI automation services, answer questions, and connect you with Edmund for a strategy call. What brings you here today?",
    quickActions: [
      "How much does it cost?",
      "How does this work?",
      "Schedule a call",
      "Tell me about the Mastermind"
    ],
    typingDelay: 800,
    sessionKey: 'bogenai_chat_session'
  };

  // State
  let state = {
    sessionId: null,
    messages: [],
    isOpen: false,
    isTyping: false,
    conversationStarted: false
  };

  // Initialize chatbot
  function initChatbot() {
    // Check for existing session
    state.sessionId = localStorage.getItem(CONFIG.sessionKey);

    // Create chatbot HTML
    createChatbotHTML();

    // Attach event listeners
    attachEventListeners();

    // Load existing conversation if any
    if (state.sessionId) {
      loadConversation();
    }
  }

  // Create chatbot HTML structure
  function createChatbotHTML() {
    const container = document.createElement('div');
    container.className = 'chatbot-container';
    container.innerHTML = `
      <button class="chatbot-trigger" id="chatbot-trigger" aria-label="Open chat">
        <svg class="icon-chat" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
        </svg>
        <svg class="icon-close" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
        </svg>
        <span class="chatbot-badge" id="chatbot-badge" style="display: none;">1</span>
      </button>

      <div class="chatbot-window" id="chatbot-window">
        <div class="chatbot-header">
          <div class="chatbot-avatar">B</div>
          <div class="chatbot-header-info">
            <h3>Bogen</h3>
            <p>AI Assistant • Usually replies instantly</p>
          </div>
          <button class="chatbot-reset-button" id="chatbot-reset" aria-label="Start new conversation" title="Start new conversation">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
              <path fill="currentColor" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
          </button>
        </div>

        <div class="chatbot-messages" id="chatbot-messages">
          <!-- Messages will be added here -->
        </div>

        <div class="chatbot-input-area">
          <form class="chatbot-input-form" id="chatbot-form">
            <textarea
              class="chatbot-input"
              id="chatbot-input"
              placeholder="Type your message..."
              rows="1"
              maxlength="1000"
            ></textarea>
            <button type="submit" class="chatbot-send-button" id="chatbot-send">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </form>
          <div class="chatbot-powered-by">
            Powered by <a href="https://bogen.ai" target="_blank">Bogen.ai</a> • Built with Claude
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(container);
  }

  // Attach event listeners
  function attachEventListeners() {
    const trigger = document.getElementById('chatbot-trigger');
    const form = document.getElementById('chatbot-form');
    const input = document.getElementById('chatbot-input');
    const resetBtn = document.getElementById('chatbot-reset');

    trigger.addEventListener('click', toggleChatbot);
    form.addEventListener('submit', handleSubmit);
    resetBtn.addEventListener('click', resetConversation);

    // Auto-resize textarea
    input.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });

    // Enter to send, Shift+Enter for new line
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        form.dispatchEvent(new Event('submit'));
      }
    });
  }

  // Toggle chatbot window
  function toggleChatbot() {
    const window = document.getElementById('chatbot-window');
    const trigger = document.getElementById('chatbot-trigger');
    const badge = document.getElementById('chatbot-badge');

    state.isOpen = !state.isOpen;

    if (state.isOpen) {
      window.classList.add('active');
      trigger.classList.add('active');
      badge.style.display = 'none';

      // Focus input
      setTimeout(() => {
        document.getElementById('chatbot-input').focus();
      }, 300);

      // Show welcome message if first time
      if (!state.conversationStarted) {
        setTimeout(() => {
          addMessage('assistant', CONFIG.welcomeMessage, true);
          state.conversationStarted = true;
        }, 500);
      }
    } else {
      window.classList.remove('active');
      trigger.classList.remove('active');
    }
  }

  // Handle form submit
  async function handleSubmit(e) {
    e.preventDefault();

    const input = document.getElementById('chatbot-input');
    const message = input.value.trim();

    if (!message || state.isTyping) return;

    // Add user message to UI
    addMessage('user', message);

    // Clear input
    input.value = '';
    input.style.height = 'auto';

    // Show typing indicator
    showTyping();

    // Send message to API
    try {
      const response = await fetch(`${CONFIG.apiUrl}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: state.sessionId,
          message: message
        })
      });

      const data = await response.json();

      // Save session ID
      if (data.sessionId && !state.sessionId) {
        state.sessionId = data.sessionId;
        localStorage.setItem(CONFIG.sessionKey, data.sessionId);
      }

      // Hide typing, show response
      hideTyping();

      setTimeout(() => {
        addMessage('assistant', data.message, true);

        // Check if should show Calendly link
        if (data.shouldEscalate || data.message.toLowerCase().includes('calendly') || data.message.toLowerCase().includes('strategy call')) {
          showCalendlyButton();
        }
      }, CONFIG.typingDelay);

    } catch (error) {
      console.error('Chat error:', error);
      hideTyping();
      setTimeout(() => {
        addMessage('assistant', "I apologize, but I encountered an error. Please try again or contact Edmund directly at edmund@bogenhomes.com or 561-235-7575.");
      }, CONFIG.typingDelay);
    }
  }

  // Add message to chat
  function addMessage(role, content, withQuickActions = false) {
    const messagesContainer = document.getElementById('chatbot-messages');
    const messageEl = document.createElement('div');
    messageEl.className = `chatbot-message ${role}`;

    const time = new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });

    // Convert markdown-style bold (**text**) to HTML
    let formattedContent = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Convert URLs to clickable links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    formattedContent = formattedContent.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');

    // Convert bullet points to proper list
    const lines = formattedContent.split('\n');
    let htmlContent = '';
    let inList = false;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
        if (!inList) {
          htmlContent += '<ul>';
          inList = true;
        }
        htmlContent += `<li>${trimmed.substring(1).trim()}</li>`;
      } else {
        if (inList) {
          htmlContent += '</ul>';
          inList = false;
        }
        if (trimmed) {
          htmlContent += `<p>${trimmed}</p>`;
        }
      }
    });

    if (inList) {
      htmlContent += '</ul>';
    }

    messageEl.innerHTML = `
      <div class="chatbot-message-avatar">${role === 'user' ? 'U' : 'B'}</div>
      <div>
        <div class="chatbot-message-bubble">
          ${htmlContent}
        </div>
        <div class="chatbot-message-time">${time}</div>
      </div>
    `;

    messagesContainer.appendChild(messageEl);

    // Add quick actions for first assistant message
    if (role === 'assistant' && withQuickActions && state.messages.length === 0) {
      addQuickActions();
    }

    // Scroll to show the new message (smooth scroll to the message itself)
    messageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Save to state
    state.messages.push({ role, content, time });
  }

  // Show typing indicator
  function showTyping() {
    state.isTyping = true;
    const messagesContainer = document.getElementById('chatbot-messages');
    const typingEl = document.createElement('div');
    typingEl.className = 'chatbot-message assistant';
    typingEl.id = 'typing-indicator';
    typingEl.innerHTML = `
      <div class="chatbot-message-avatar">B</div>
      <div>
        <div class="chatbot-message-bubble">
          <div class="chatbot-typing">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    `;
    messagesContainer.appendChild(typingEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Hide typing indicator
  function hideTyping() {
    state.isTyping = false;
    const typingEl = document.getElementById('typing-indicator');
    if (typingEl) {
      typingEl.remove();
    }
  }

  // Add quick action buttons
  function addQuickActions() {
    const messagesContainer = document.getElementById('chatbot-messages');
    const actionsEl = document.createElement('div');
    actionsEl.className = 'chatbot-message assistant';
    actionsEl.innerHTML = `
      <div class="chatbot-message-avatar" style="opacity: 0;"></div>
      <div>
        <div class="chatbot-quick-actions">
          ${CONFIG.quickActions.map(action => `
            <button class="chatbot-quick-action" data-action="${action}">${action}</button>
          `).join('')}
        </div>
      </div>
    `;

    messagesContainer.appendChild(actionsEl);

    // Attach click handlers
    actionsEl.querySelectorAll('.chatbot-quick-action').forEach(btn => {
      btn.addEventListener('click', function() {
        const input = document.getElementById('chatbot-input');
        input.value = this.dataset.action;
        document.getElementById('chatbot-form').dispatchEvent(new Event('submit'));
      });
    });
  }

  // Show Calendly button
  function showCalendlyButton() {
    const messagesContainer = document.getElementById('chatbot-messages');
    const calendlyEl = document.createElement('div');
    calendlyEl.className = 'chatbot-message assistant';
    calendlyEl.innerHTML = `
      <div class="chatbot-message-avatar" style="opacity: 0;"></div>
      <div>
        <a href="https://calendly.com/edmund-15/reignation-meeting-ed" target="_blank" class="chatbot-calendly-button">
          📅 Schedule Strategy Call with Edmund
        </a>
      </div>
    `;
    messagesContainer.appendChild(calendlyEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Load existing conversation
  async function loadConversation() {
    try {
      const response = await fetch(`${CONFIG.apiUrl}/conversation/${state.sessionId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.messages && data.messages.length > 0) {
          state.conversationStarted = true;
          data.messages.forEach(msg => {
            if (msg.role !== 'system') {
              addMessage(msg.role, msg.content);
            }
          });
        }
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  }

  // Reset conversation
  function resetConversation() {
    // Confirm with user
    if (!confirm('Start a new conversation? This will clear the current chat history.')) {
      return;
    }

    // Clear localStorage
    localStorage.removeItem(CONFIG.sessionKey);

    // Reset state
    state.sessionId = null;
    state.messages = [];
    state.conversationStarted = false;

    // Clear messages UI
    const messagesContainer = document.getElementById('chatbot-messages');
    messagesContainer.innerHTML = '';

    // Show welcome message again
    setTimeout(() => {
      addMessage('assistant', CONFIG.welcomeMessage, true);
      state.conversationStarted = true;
    }, 300);
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbot);
  } else {
    initChatbot();
  }

  // Show notification badge after a few seconds if not opened
  setTimeout(() => {
    if (!state.isOpen && !state.conversationStarted) {
      const badge = document.getElementById('chatbot-badge');
      if (badge) {
        badge.style.display = 'flex';
      }
    }
  }, 10000); // Show after 10 seconds

})();
