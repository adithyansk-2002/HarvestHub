// Available crops for validation
const validCrops = [
    'onions', 'potatoes', 'rice', 'salt (iodised)', 'sugar', 
    'sugar (jaggery/gur)', 'tea (black)', 'tomatoes', 'wheat', 'wheat flour'
];

// Global variables for bidding
let highestBid = 600;
let timeRemaining = 300; // 5 minutes in seconds
let timer;
let biddingStarted = false;

// Initialize the bidding interface
function initBidding() {
    // Don't start the timer immediately
    addSystemMessage("Please predict a price to start the bidding session.");
}

// Update the timer display
function updateTimer() {
    if (timeRemaining <= 0) {
        clearInterval(timer);
        document.getElementById('timer').textContent = "00:00";
        addSystemMessage("Bidding session ended!");
        biddingStarted = false;
        return;
    }
    
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('timer').textContent = timeString;
    timeRemaining--;
}

// Start the bidding session
function startBiddingSession(predictedPrice) {
    if (biddingStarted) return;
    
    highestBid = predictedPrice;
    timeRemaining = 300; // Reset to 5 minutes
    biddingStarted = true;
    
    updateTimer();
    timer = setInterval(updateTimer, 1000);
    addSystemMessage(`Bidding session started! Initial bid: ₹${predictedPrice}`);
}

// Add a message to the chat
function addMessage(message, type = 'system') {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Add a system message
function addSystemMessage(message) {
    addMessage(message, 'system');
}

// Add a user bid message
function addUserBid(amount) {
    addMessage(`New bid: ₹${amount}`, 'user');
}

// Handle bid submission
function sendBid() {
    if (!biddingStarted) {
        addSystemMessage("Please predict a price first to start the bidding session.");
        return;
    }

    const bidInput = document.getElementById('bid-amount');
    const bidAmount = parseInt(bidInput.value);

    if (isNaN(bidAmount) || bidAmount <= 0) {
        addSystemMessage("Please enter a valid bid amount.");
        return;
    }

    if (bidAmount <= highestBid) {
        addSystemMessage(`Your bid must be higher than ₹${highestBid}`);
        return;
    }

    if (timeRemaining <= 0) {
        addSystemMessage("Bidding session has ended.");
        return;
    }

    highestBid = bidAmount;
    addUserBid(bidAmount);
    addSystemMessage(`New highest bid: ₹${bidAmount}`);
    bidInput.value = '';
}

// Price prediction function
async function predictPrice() {
    const cropInput = document.getElementById('crop').value.trim().toLowerCase();
    const yearInput = document.getElementById('year').value.trim();
    const resultDiv = document.getElementById('prediction-result');

    // Clear previous results
    resultDiv.innerHTML = '';

    try {
        // Validate inputs
        if (!cropInput || !yearInput) {
            throw new Error('Please enter both crop name and year.');
        }

        if (!validCrops.includes(cropInput)) {
            throw new Error(`Invalid crop name. Please choose from the dropdown.`);
        }

        const year = parseInt(yearInput);
        if (isNaN(year) || year <= 2000 || year > 2050) {
            throw new Error('Please enter a valid year between 2001 and 2050.');
        }

        // Show loading state
        resultDiv.innerHTML = '<h3 class="loading">Calculating prediction...</h3>';

        const response = await fetch('/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                crop: cropInput,
                year: year
            })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        // Display success result
        resultDiv.innerHTML = `
            <h3>Prediction Result</h3>
            <p>Predicted price for ${data.crop} in ${data.year}: ₹${data.predicted_price}</p>
        `;

        // Start the bidding session with the predicted price
        startBiddingSession(data.predicted_price);
    } catch (error) {
        // Display error message
        resultDiv.innerHTML = `
            <h3 class="error">Error</h3>
            <p class="error-details">${error.message}</p>
        `;
    }
}

// Initialize the bidding interface when the page loads
document.addEventListener('DOMContentLoaded', initBidding);
