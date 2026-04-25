const messagesContainer = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');

// Store the conversation history on the frontend for serverless architecture
let conversationHistory = [];

function addMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender);
    
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');
    
    // Basic Markdown Formatting: newlines to <br>, bold to <strong>
    let formattedText = text.replace(/\n/g, '<br>');
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    contentDiv.innerHTML = formattedText;
    
    msgDiv.appendChild(contentDiv);
    messagesContainer.appendChild(msgDiv);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showTypingIndicator() {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', 'bot', 'typing-indicator');
    msgDiv.id = 'typing';
    
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');
    contentDiv.innerHTML = '<i class="fa-solid fa-ellipsis fa-fade"></i>';
    
    msgDiv.appendChild(contentDiv);
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function removeTypingIndicator() {
    const typing = document.getElementById('typing');
    if (typing) {
        typing.remove();
    }
}

async function sendMessageToBot(message = "") {
    if (message) {
        addMessage(message, 'user');
        // We do NOT add the new user message to conversationHistory YET.
        // We will send it to the backend separately, and if successful, add it to history.
    }
    
    showTypingIndicator();
    
    try {
        // Use relative URL so it works seamlessly on Vercel
        // If testing locally without Vercel CLI, use full localhost URL
        const endpoint = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? '/api/chat' // Requires Vercel CLI (`vercel dev`) to run locally
            : '/api/chat';

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                history: conversationHistory, 
                message: message 
            })
        });
        
        const data = await response.json();
        removeTypingIndicator();
        
        if (data.reply) {
            addMessage(data.reply, 'bot');
            
            // Now update the history with both user message and bot reply
            if (message) {
                conversationHistory.push({ role: "user", content: message });
            }
            conversationHistory.push({ role: "assistant", content: data.reply });
            
        } else {
            addMessage("I'm sorry, I'm having trouble connecting right now.", 'bot');
        }
    } catch (error) {
        console.error("Error:", error);
        removeTypingIndicator();
        
        // Fallback for local testing if Vercel is not running locally
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
             addMessage("Please run this project using `vercel dev` instead of Live Server, or deploy it to Vercel.", 'bot');
        } else {
             addMessage("I'm sorry, there was a network error.", 'bot');
        }
    }
}

// Initial setup - trigger bot's first message
document.addEventListener('DOMContentLoaded', () => {
    sendMessageToBot();
});

chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = userInput.value.trim();
    if (input) {
        userInput.value = '';
        sendMessageToBot(input);
    }
});
