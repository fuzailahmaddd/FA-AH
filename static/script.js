
const input = document.getElementById("user-input");
const sendButton = document.getElementById("send-btn");
const chatArea = document.querySelector(".chat-area");
const welcome = document.querySelector(".welcome");

const newChatButton = document.getElementById("new-chat-btn");
const historyToggle = document.getElementById("history-toggle");
const historyList = document.getElementById("chat-history-list");

const fileInput = document.getElementById("file-input");
const uploadButton = document.getElementById("upload-btn");

const uploadStatus = document.getElementById("upload-status");
const uploadFilename = document.getElementById("upload-filename");
const removeUploadButton = document.getElementById("remove-upload-btn");
const attachmentIcon = document.querySelector(".attachment-icon");

let currentConversationId = null;
let uploadedContent = "";
let uploadedFilename = "";


function addMessage(message, className) {
    const messageBox = document.createElement("div");

    messageBox.className = className;
    messageBox.textContent = message;

    chatArea.appendChild(messageBox);
    chatArea.scrollTop = chatArea.scrollHeight;

    return messageBox;
}


function clearMessages() {
    chatArea.querySelectorAll(
        ".user-message, .ai-message"
    ).forEach(message => message.remove());
}


// SHOW ATTACHMENT PREVIEW
function showUploadStatus(message) {
    if (!message) {
        uploadStatus.hidden = true;
        uploadFilename.textContent = "";
        return;
    }

    uploadFilename.textContent = message;
    attachmentIcon.textContent = "📎";
    uploadStatus.hidden = false;
}


// REMOVE ATTACHMENT
function removeAttachment() {
    uploadedContent = "";
    uploadedFilename = "";

    fileInput.value = "";

    showUploadStatus("");

    uploadButton.disabled = false;
}


// SEND CHAT MESSAGE
async function sendMessage() {
    const message = input.value.trim();

    if (!message || sendButton.disabled) {
        return;
    }

    if (welcome) {
        welcome.style.display = "none";
    }

    addMessage(message, "user-message");

    input.value = "";
    sendButton.disabled = true;

    const loadingMessage = addMessage(
        "FA-AH is thinking...",
        "ai-message"
    );

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: message,
                conversation_id: currentConversationId,
                file_content: uploadedContent,
                filename: uploadedFilename
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Something went wrong.");
        }

        loadingMessage.textContent = data.response;

        currentConversationId = data.conversation_id;

        await loadHistory();

    } catch (error) {
        loadingMessage.textContent = "Error: " + error.message;

    } finally {
        sendButton.disabled = false;
        input.focus();
        chatArea.scrollTop = chatArea.scrollHeight;
    }
}


// START NEW CHAT
function startNewChat() {
    currentConversationId = null;

    clearMessages();

    if (welcome) {
        welcome.style.display = "block";
    }

    input.value = "";

    removeAttachment();

    input.focus();

    document.querySelectorAll(".history-item").forEach(item => {
        item.classList.remove("active");
    });
}


// UPLOAD FILE
async function uploadFile(file) {
    if (!file) {
        return;
    }

    showUploadStatus("Uploading " + file.name + "...");

    uploadButton.disabled = true;

    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await fetch("/api/upload", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "File upload failed.");
        }

        uploadedContent = data.content || "";
        uploadedFilename = data.filename || file.name;

        showUploadStatus(data.original_filename || file.name);

    } catch (error) {
        uploadedContent = "";
        uploadedFilename = "";

        attachmentIcon.textContent = "⚠️";
        uploadFilename.textContent = error.message;
        uploadStatus.hidden = false;

    } finally {
        uploadButton.disabled = false;
        fileInput.value = "";
    }
}


// LOAD CHAT HISTORY
async function loadHistory() {
    try {
        const response = await fetch("/api/history");
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Unable to load history.");
        }

        historyList.innerHTML = "";

        if (data.conversations.length === 0) {
            const emptyMessage = document.createElement("p");
            emptyMessage.textContent = "No saved chats yet.";
            historyList.appendChild(emptyMessage);
            return;
        }

        data.conversations.forEach(conversation => {
            const item = document.createElement("div");
            item.className = "history-item";

            if (conversation.id === currentConversationId) {
                item.classList.add("active");
            }

            const openButton = document.createElement("button");
            openButton.type = "button";
            openButton.className = "history-open";
            openButton.textContent = conversation.title;
            openButton.title = conversation.title;

            openButton.addEventListener("click", () => {
                openConversation(conversation.id);
            });

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "history-delete";
            deleteButton.textContent = "×";
            deleteButton.title = "Delete conversation";

            deleteButton.addEventListener("click", () => {
                deleteConversation(conversation.id);
            });

            item.appendChild(openButton);
            item.appendChild(deleteButton);

            historyList.appendChild(item);
        });

    } catch (error) {
        historyList.textContent = "Unable to load chat history.";
        console.error(error);
    }
}


// OPEN OLD CONVERSATION
async function openConversation(conversationId) {
    try {
        const response = await fetch(
            `/api/history/${conversationId}`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Unable to open conversation.");
        }

        currentConversationId = conversationId;

        removeAttachment();

        clearMessages();

        if (welcome) {
            welcome.style.display = "none";
        }

        data.messages.forEach(message => {
            const className = message.role === "user"
                ? "user-message"
                : "ai-message";

            addMessage(message.content, className);
        });

        await loadHistory();

    } catch (error) {
        alert(error.message);
    }
}


// DELETE CONVERSATION
async function deleteConversation(conversationId) {
    const confirmed = confirm(
        "Are you sure you want to delete this conversation?"
    );

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(
            `/api/history/${conversationId}`,
            { method: "DELETE" }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Unable to delete conversation.");
        }

        if (currentConversationId === conversationId) {
            startNewChat();
        }

        await loadHistory();

    } catch (error) {
        alert(error.message);
    }
}


// EVENT LISTENERS

sendButton.addEventListener("click", sendMessage);

input.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        sendMessage();
    }
});

newChatButton.addEventListener("click", function(event) {
    event.preventDefault();
    startNewChat();
});

historyToggle.addEventListener("click", function(event) {
    event.preventDefault();

    const isHidden = historyList.style.display === "none";

    historyList.style.display = isHidden ? "block" : "none";
});

uploadButton.addEventListener("click", function() {
    fileInput.click();
});

fileInput.addEventListener("change", function() {
    const file = fileInput.files[0];

    if (file) {
        uploadFile(file);
    }
});

removeUploadButton.addEventListener("click", removeAttachment);


// INITIAL LOAD
loadHistory();
