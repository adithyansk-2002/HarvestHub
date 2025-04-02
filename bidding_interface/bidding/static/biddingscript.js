// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDc3h5uJK-DJ4t9oL0ImbHxn-atM166CT8",
    authDomain: "harvesthub-c54c6.firebaseapp.com",
    databaseURL: "https://harvesthub-c54c6-default-rtdb.firebaseio.com",
    projectId: "harvesthub-c54c6",
    storageBucket: "harvesthub-c54c6.firebasestorage.app",
    messagingSenderId: "330622578420",
    appId: "1:330622578420:web:6691d622a955a2c7c578a1"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Get Firestore functions
const { doc, getDoc, updateDoc } = firebase.firestore;

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
let currentRoomId = null;

// Server configuration
const SERVER_URL = 'http://127.0.0.1:5000';  // Flask server URL
const USE_FLASK = true;  // Set to true to enable Flask server functionality

// Load room details from Firestore
async function loadBiddingRoom() {
    const params = new URLSearchParams(window.location.search);
    currentRoomId = params.get("roomId");

    if (!currentRoomId) {
        document.getElementById("roomDetails").innerHTML = "<p class='error'>Error: No room ID provided.</p>";
        document.getElementById("roomDetails").classList.add('error');
        return;
    }

    try {
        const roomRef = db.collection("biddingRooms").doc(currentRoomId);
        const roomSnap = await roomRef.get();

        if (!roomSnap.exists) {
            document.getElementById("roomDetails").innerHTML = "<p class='error'>Room not found.</p>";
            document.getElementById("roomDetails").classList.add('error');
        } else {
            const data = roomSnap.data();
            highestBid = data.highestBid || 600;
            document.getElementById("roomDetails").innerHTML = `
                <h2>${data.itemName}</h2>
                <p><strong>Quantity:</strong> ${data.quantity} kg</p>
                <p><strong>Location:</strong> ${data.location}</p>
                <p><strong>Current Highest Bid:</strong> ₹${highestBid}</p>
                ${data.createdAt ? `<p><strong>Created:</strong> ${data.createdAt.toDate().toLocaleString()}</p>` : ''}
            `;
            document.getElementById("roomDetails").classList.remove('error', 'loading');
        }
    } catch (error) {
        console.error("Error loading room:", error);
        let errorMessage = "Error loading room details. Please try again.";
        
        if (error.code === 'permission-denied') {
            errorMessage = "Access denied. Please check Firebase security rules.";
        } else if (error.code === 'unavailable') {
            errorMessage = "Unable to connect to the database. Please check your internet connection.";
        }
        
        document.getElementById("roomDetails").innerHTML = `<p class='error'>${errorMessage}</p>`;
        document.getElementById("roomDetails").classList.add('error');
    }
}

// Initialize the bidding interface
async function initBidding() {
    await loadBiddingRoom();
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
async function sendBid() {
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

    try {
        // Update Firestore with new bid
        if (currentRoomId) {
            const roomRef = db.collection("biddingRooms").doc(currentRoomId);
            await roomRef.update({
                highestBid: bidAmount,
                highestBidderId: firebase.auth().currentUser?.uid || 'anonymous'
            });
        }

        highestBid = bidAmount;
        addUserBid(bidAmount);
        addSystemMessage(`New highest bid: ₹${bidAmount}`);
        bidInput.value = '';
    } catch (error) {
        console.error("Error updating bid:", error);
        let errorMessage = "Error placing bid. Please try again.";
        
        if (error.code === 'permission-denied') {
            errorMessage = "Access denied. Please check Firebase security rules.";
        } else if (error.code === 'unavailable') {
            errorMessage = "Unable to connect to the database. Please check your internet connection.";
        }
        
        addSystemMessage(errorMessage);
    }
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

        if (!USE_FLASK) {
            // Use mock data when Flask is disabled
            const mockPrediction = Math.floor(Math.random() * 5000) + 1000;
            resultDiv.innerHTML = `
                <h3>Prediction Result</h3>
                <p>Predicted price for ${cropInput} in ${year}: ₹${mockPrediction}</p>
            `;
            startBiddingSession(mockPrediction);
            return;
        }

        const response = await fetch(`${SERVER_URL}/predict`, {
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

// Start Flask and open bidding room
async function startFlaskServerAndOpenRoom(roomId) {
    if (!USE_FLASK) {
        console.log("Flask server functionality is disabled");
        return;
    }

    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds

    async function checkFlaskServer() {
        try {
            const response = await fetch(`${SERVER_URL}/ping`);
            if (response.ok) {
                const data = await response.json();
                if (data.status === "running") {
                    console.log("Flask server is running");
                    return true;
                }
            }
        } catch (error) {
            console.log("Flask server is not running");
        }
        return false;
    }

    async function startFlaskServer() {
        try {
            const response = await fetch(`${SERVER_URL}/start-flask`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to start Flask server');
            }
            const data = await response.json();
            
            if (data.status === "Flask started") {
                console.log("Flask server started successfully");
                return true;
            } else {
                throw new Error(data.error || 'Failed to start Flask server');
            }
        } catch (error) {
            console.error("Error starting Flask:", error);
            addSystemMessage(`Failed to start bidding server: ${error.message}`);
            return false;
        }
    }

    // First check if Flask is already running
    if (await checkFlaskServer()) {
        window.location.href = `biddingindex.html?roomId=${roomId}`;
        return;
    }

    // Try to start Flask server
    if (!await startFlaskServer()) {
        return;
    }

    // Wait for server to be ready
    for (let i = 0; i < maxRetries; i++) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        if (await checkFlaskServer()) {
            window.location.href = `biddingindex.html?roomId=${roomId}`;
            return;
        }
    }

    addSystemMessage("Failed to connect to bidding server after multiple attempts. Please try again later.");
}

// Predict bid using Flask AI model
async function predictBid() {
    if (!USE_FLASK) {
        console.log("Flask server functionality is disabled");
        return;
    }

    try {
        const response = await fetch(`${SERVER_URL}/predict_bid?crop=${currentRoomId}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        if (data.predicted_bid) {
            document.getElementById('bid-amount').value = data.predicted_bid;
            addSystemMessage(`AI Suggested Bid: ₹${data.predicted_bid}`);
        } else {
            throw new Error("No prediction received from server");
        }
    } catch (error) {
        console.error("Error getting AI prediction:", error);
        addSystemMessage(`Error getting AI prediction: ${error.message}`);
    }
}

// Add AI prediction button to the UI
function addAIPredictionButton() {
    const inputContainer = document.querySelector('.input-container');
    const aiButton = document.createElement('button');
    aiButton.className = 'btn btn-info ms-2';
    aiButton.textContent = 'Get AI Prediction';
    aiButton.onclick = predictBid;
    inputContainer.appendChild(aiButton);
}

// Initialize the bidding interface when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initBidding();
    addAIPredictionButton();
});
