// chatbto config //


const firebaseConfig = {
    apiKey: "urapiKey",
    authDomain: "chatbot.firebaseapp.com",
    databaseURL: "https://chatbot.firebaseio.com",
    projectId: "chatbot",
    storageBucket: "chatbot.firebasestorage.app",
    messagingSenderId: "1",
    appId: "id",
    measurementId: "iddd"
  };
 
// Initialize Firebase // Firebase Initialization
firebase.initializeApp(firebaseConfig);


const database = firebase.database();
const messagesDB = database.ref("messages"); // Reference to messages node
let lastUserMessage = "";   // ✅ Declare globally
let lastBotResponse = "";

document.getElementById("generateReportButton").addEventListener("click", function () {
    generateTodaysReport();
 
});

document.getElementById("sendBTN").addEventListener("click", function () {
    console.log("Send button clicked!"); // Debugging line
    const messageText = document.querySelector(".chat-input textarea").value.trim();
    if (messageText) {
        const timestamp = Date.now();

        // Push message to Firebase
        messagesDB.push({
            message: messageText,
            sender: "user",
            source: "local",
            timestamp: timestamp
        })
        .then(() => {
            console.log("Message sent to Firebase");
        })
        .catch((error) => {
            console.error("Error sending message: ", error);
        });

        // Display the user message in the chat UI
        displayMessage(messageText, "user");
        provideSuggestion(messageText);

        // Clear the input field
        document.querySelector(".chat-input textarea").value = "";
    }
});

document.getElementById("saveBTN").addEventListener("click", function (event) {
    event.preventDefault();  // ✅ Prevent page refresh

    const chatBox = document.querySelector(".chatbox");
    if (!chatBox || chatBox.children.length < 2) {
        alert("No conversation to save!");
        return;
    }

    // ✅ Find the last user message
    const userMessages = chatBox.querySelectorAll(".chat-outgoing p");
    const lastUserMessage = userMessages.length > 0 ? userMessages[userMessages.length - 1].innerText : "";

    // ✅ Find the last bot response
    const botMessages = chatBox.querySelectorAll(".chat-incoming p");
    const lastBotResponse = botMessages.length > 0 ? botMessages[botMessages.length - 1].innerText : "";

    if (!lastUserMessage || !lastBotResponse) {
        alert("No complete conversation to save!");
        return;
    }

    const messageData = {
        message: lastUserMessage,  // ✅ Change key to 'message'
        response: lastBotResponse, // ✅ Change key to 'response'
        timestamp: Date.now()
    };

    // ✅ Save conversation to JSON via Node.js server
    fetch("http://localhost:3000/saveMessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageData)
    })
    .then(response => response.json())
    .then(data => {
        console.log("Conversation saved to JSON:", data);
        alert("Conversation saved successfully! Type your next question or go through FAQs once it refresh.");
    })
    .catch(error => console.error("Error saving to JSON:", error));
});



function generateBotResponse(userMessage) {
    // Replace with your chatbot logic
    return "This is a sample response for: " + userMessage;
}





function generateTodaysReport() {
    const date = new Date();
    const currentYear = date.getFullYear();
    const currentMonth = date.getMonth() + 1; // Adjust for 1-based months
    const currentDay = date.getDate();

    // Define start and end of today
    const startOfDay = new Date(currentYear, currentMonth - 1, currentDay, 0, 0, 0).getTime();
    const endOfDay = new Date(currentYear, currentMonth - 1, currentDay, 23, 59, 59).getTime();

    // Query messages from Firebase for today
    messagesDB.orderByChild("timestamp").startAt(startOfDay).endAt(endOfDay).once("value", function (snapshot) {
        if (!snapshot.exists()) {
            displayMessage("📌 No messages found for today.", "bot");
            return;
        }

        let totalMessages = 0;
        let keywordCount = 0;

        // Initialize blood flow categories
        let criticalLow = 0;
        let belowNormal = 0;
        let normal = 0;
        let high = 0;
        let elevated = 0;

        snapshot.forEach(function (childSnapshot) {
    const messageData = childSnapshot.val();

    // Check if messageData.message exists and is a string
    if (!messageData.message || typeof messageData.message !== "string") {
        return; // skip this iteration if message is invalid
    }

    const messageText = messageData.message.toLowerCase();

    // Check for "bloodflow" keyword
    if (messageText.includes("pulse") || messageText.includes("temp")) {
        keywordCount++;

        // Extract blood flow value
        const value = extractNumber(messageText);
        if (value !== null) {
            if (value < 30) {
                criticalLow++;
            } else if (value >= 30 && value < 50) {
                belowNormal++;
            } else if (value >= 50 && value <= 150) {
                normal++;
            } else if (value > 150 && value <= 200) {
                high++;
            } else if (value > 200) {
                elevated++;
            }
        }
    }
    totalMessages++;
});


        // Construct chatbot-friendly text report
        const report = 
`Patient Health Report
Date: ${currentDay}-${currentMonth}-${currentYear}

Patient Details
Name             : Mohammed Anees
Age              : 22 years
Weight           : 70 kg
Blood Group      : B+
Heart Rate       : 75 BPM
Temperature      : 36.9°C
Blood Pressure   : 120/80 mmHg

Pulse Rate Statistics
Critical (<30 BPM)             : ${criticalLow} occurrence(s)
Below Normal (30-50 BPM)       : ${belowNormal} occurrence(s)
Normal (50-150 BPM)            : ${normal} occurrence(s)
High (150-200 BPM)             : ${high} occurrence(s)
Significantly Elevated (>200)  : ${elevated} occurrence(s)

Message Summary
Total Messages                 : ${totalMessages}
Messages mentioning 'pulse'    : ${keywordCount}

Recommendations
- Continue regular health monitoring.
- If pulse rate remains consistently low (<50 BPM), consult a healthcare provider.
- For elevated pulse rates, maintain hydration and avoid overexertion.
- If pulse remains high for extended periods, seek immediate medical attention.`;

displayMessage(report, "bot");

    });
}


// Helper function to extract the number from a blood flow message
function extractNumber(message) {
    const match = message.match(/(\d+)/);
    return match ? parseInt(match[0], 10) : null;
}


// // Function to display messages in the chat interface
// Function to display messages in the chatbox
// Function to display messages in the chatbox smoothly
function displayMessage(message, sender) {
    const chatBox = document.querySelector(".chatbox");
    const messageItem = document.createElement("li");
    messageItem.classList.add(sender === "user" ? "chat-outgoing" : "chat-incoming", "chat");

    const messageText = document.createElement("p");
    messageText.innerText = message;
    messageItem.appendChild(messageText);

    chatBox.appendChild(messageItem);
    chatBox.scrollTop = chatBox.scrollHeight; // Smooth scroll to latest message
}

// Fetch responses from responses.json
let keywordResponses = [];
let faqQueue = []; // Holds all FAQs
let visibleFAQs = []; // Holds currently visible FAQs (max 5)
let answeredFAQs = []; // Holds answered questions

fetch("responses.json")
    .then(response => response.json())
    .then(data => {
        keywordResponses = data;
        faqQueue = [...keywordResponses]; // Copy all FAQs into queue
        console.log("Responses loaded successfully:", keywordResponses);
        loadNextFAQs(); // Load initial batch of 5 FAQs
    })
    .catch(error => console.error("Error loading responses:", error));

// Function to load FAQs (4 old + 1 new), keeping answered ones above
function loadNextFAQs() {
    const chatBox = document.querySelector(".chatbox");

    // Clear only the old unanswered FAQ section (keep answered ones)
    document.querySelectorAll(".faq-question.new").forEach(el => el.remove());

    // Maintain 4 old unanswered questions
    visibleFAQs = visibleFAQs.filter(q => faqQueue.includes(q)).slice(0, 4);

    // Add up to 5 new questions (ensure 5 in total)
    while (visibleFAQs.length < 5 && faqQueue.length > 0) {
        visibleFAQs.push(faqQueue.shift());
    }

    // Create a container for new FAQs
    const faqContainer = document.createElement("div");
    faqContainer.classList.add("faq-container");

    // Display updated FAQ list (new questions below bot response)
    visibleFAQs.forEach((item, index) => {
        setTimeout(() => {
            const li = document.createElement("li");
            li.textContent = item.keywords[0]; // Show first keyword as a question
            li.classList.add("faq-question", "fade-in", "new"); // "new" class for easy removal

            // Show answer when clicked
            li.addEventListener("click", function () {
                displayMessage(li.textContent, "user");
                displayMessage(item.response, "bot");

                // Keep answered question above (move it to answeredFAQs)
                if (!answeredFAQs.includes(item)) answeredFAQs.push(item);

                // Remove from unanswered list and load next batch smoothly
                visibleFAQs = visibleFAQs.filter(q => q !== item);
                setTimeout(loadNextFAQs, 700); // Smooth transition
            });

            faqContainer.appendChild(li);
            chatBox.scrollTop = chatBox.scrollHeight; // Smooth scroll
        }, index * 200); // Staggered delay for a smooth effect
    });

    // Append unanswered FAQs below the latest bot response
    setTimeout(() => {
        chatBox.appendChild(faqContainer);
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 500);

    // Re-render answered questions **above** chat (keeping them at the top)
    updateAnsweredFAQs();
}

// Function to update answered FAQs (keep above the chat)
function updateAnsweredFAQs() {
    const chatBox = document.querySelector(".chatbox");
    
    // Remove old answered questions before re-adding
    document.querySelectorAll(".faq-question.answered").forEach(el => el.remove());

    // Display answered questions at the top
    answeredFAQs.forEach(item => {
        const li = document.createElement("li");
        li.textContent = item.keywords[0];
        li.classList.add("faq-question", "answered");

        // Insert at the top of the chatbox
        chatBox.insertBefore(li, chatBox.firstChild);
    });
}

// Function to process user messages
function processUserMessage(userInput) {
    const lowerInput = userInput.toLowerCase();

    // Find a matching response based on keywords
    const response = keywordResponses.find(item =>
        item.keywords.some(keyword => lowerInput.includes(keyword.toLowerCase()))
    );

    return response ? response.response : "I'm not sure about that. Try another question!";
}

// Event listener for send button
document.getElementById("sendBTN").addEventListener("click", function () {
    const userInputField = document.querySelector(".chat-input textarea");
    const userMessage = userInputField.value.trim();
    
    if (userMessage) {
        displayMessage(userMessage, "user");
        const botResponse = processUserMessage(userMessage);
        displayMessage(botResponse, "bot");
        userInputField.value = ""; // Clear input field

        // Load new questions ONLY after bot responds, with a smooth transition
        setTimeout(loadNextFAQs, 700);
    }
});




// Function to provide suggestions based on the input message
function provideSuggestion(message) {
    let suggestion = "";
    const value = extractNumber(message); // Extract number from message

  if (value !== null) {
    if (value < 30) {
        suggestion = "Your pulse rate is critically low. Seek immediate medical attention.";
    } else if (value >= 30 && value < 50) {
        suggestion = "Your pulse rate is below normal. Consider seeing a healthcare provider.";
    } else if (value >= 50 && value <= 150) {
        suggestion = "Your pulse rate is normal. Keep up with healthy habits.";
    } else if (value > 150 && value <= 200) {
        suggestion = "Your pulse rate is high. Ensure proper hydration and avoid overexertion.";
    } else if (value > 200) {
        suggestion = "Your pulse rate is significantly elevated. Consult a healthcare provider.";
    }
}
 else {
        if (keywordResponses.length === 0) {
            suggestion = "I'm still loading responses. Please try again.";
        } else {
            const lowerMessage = message.toLowerCase().trim();
            let matched = false;

            for (let item of keywordResponses) {
                if (item.keywords.some(word => lowerMessage.includes(word))) {
                    suggestion = item.response;
                    matched = true;
                    break;
                }
            }

            if (!matched) {
                const defaultResponse = keywordResponses.find(item => item.keywords.includes("default"));
                suggestion = defaultResponse ? defaultResponse.response : "I'm not sure I understand. Can you rephrase?";
            }
        }
    }

    if (suggestion) {
        displayMessage(suggestion, "bot"); // Display the suggestion from the bot
    }
}

// Helper function to extract numbers from a message
function extractNumber(message) {
    const match = message.match(/\d+/); // Find first number in message
    return match ? parseInt(match[0]) : null;
}

// Helper function to extract numbers from the message
// function extractNumber(message) {
//     const regex = /\d+/; // Matches the first number in the string
//     const match = message.match(regex);
//     return match ? parseInt(match[0]) : null; // Return the number or null if no number is found
// }


// Function to clear chat messages from the chatbot interface
function clearChatData() {
    const chatbox = document.querySelector(".chatbox");
    chatbox.innerHTML = ""; // Clears the chatbox

    // Create a default message element
    const defaultMessage = document.createElement("li");
    defaultMessage.classList.add("chat-incoming", "chat");

    const defaultText = document.createElement("p");
    defaultText.innerText = "How can I help you? Enter the parameters."; // Default message
    defaultMessage.appendChild(defaultText);

    // Append the default message to the chatbox
    chatbox.appendChild(defaultMessage);

    // Scroll to the bottom of the chatbox (if needed)
    chatbox.scrollTop = chatbox.scrollHeight;
    
}


// Event listener to trigger clear chat functionality when the button is clicked
document.getElementById("clearChatBtn").addEventListener("click", clearChatData);






