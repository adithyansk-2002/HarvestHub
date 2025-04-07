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
let currentUserId = 'user_' + Math.random().toString(36).substr(2, 9); // Generate a temporary unique ID

// Get user type from global config
const userType = window.BIDDING_CONFIG.userType;
const SERVER_URL = window.BIDDING_CONFIG.SERVER_URL;

// Server configuration
const USE_FLASK = true;  // Set to true to enable Flask server functionality

// Set up real-time listener for bid updates
function setupBidListener(roomId) {
    // Initialize room if needed
    initializeRoom(roomId);

    // Set up presence tracking
    setupPresenceTracking(roomId);

    // Initially disable the bid input and button for buyers
    if (userType === 'buyer') {
        const bidInput = document.getElementById('bid-amount');
        const bidButton = document.querySelector('.input-container button');
        if (bidInput) {
            bidInput.disabled = true;
            bidInput.placeholder = "Waiting for seller to set initial price...";
        }
        if (bidButton) {
            bidButton.disabled = true;
        }
    }

    db.collection("biddingRooms").doc(roomId)
        .onSnapshot((doc) => {
            if (doc.exists) {
                const data = doc.data();
                
                // Enable bid input and button when bidding starts
                if (data.biddingStarted && userType === 'buyer' && timeRemaining > 0) {
                    const bidInput = document.getElementById('bid-amount');
                    const bidButton = document.querySelector('.input-container button');
                    if (bidInput) {
                        bidInput.disabled = false;
                        bidInput.placeholder = "Enter your bid amount";
                    }
                    if (bidButton) {
                        bidButton.disabled = false;
                    }
                }
                
                // Update the display
                updateBidDisplay(data);
                
                // Update global variables
                highestBid = data.highestBid;
                
                // Start timer immediately when biddingStarted becomes true
                if (data.biddingStarted && data.startTime) {
                    if (!biddingStarted) {
                        biddingStarted = true;
                        if (timer) clearInterval(timer);
                        timer = setInterval(() => updateTimer(data.startTime), 1000);
                        // Add immediate first update
                        updateTimer(data.startTime);
                    }
                }
                
                // Handle session end
                if (data.status === "closed" && biddingStarted) {
                    biddingStarted = false;
                    if (timer) clearInterval(timer);
                    document.getElementById('timer').textContent = "00:00";
                    addSystemMessage("Bidding session has ended!");
                }
                
                // Add message to chat about new bid
                if (data.lastBidTime && data.highestBid) {
                    const formattedBid = data.highestBid.toLocaleString('en-IN');
                    if (userType === 'seller') {
                        addSystemMessage(`New bid received: ₹${formattedBid}`);
                    }
                }

                // Handle winner display when room is closed
                if (data.status === "closed" && data.winningBid) {
                    const winnerMessage = `🎉 Bidding ended! Winner: ${data.winningBid.buyerName} with final bid: ₹${data.winningBid.amount.toLocaleString('en-IN')}`;
                    addSystemMessage(winnerMessage);
                }
            }
        }, (error) => {
            console.error("Error listening to room updates:", error);
            addSystemMessage("Error receiving updates. Please refresh the page.");
        });
}

// Update bid display
function updateBidDisplay(data) {
    const roomDetails = document.getElementById("roomDetails");
    if (!roomDetails) return;

    let displayHTML = `
        <h3>${data.itemName || 'Unknown Item'}</h3>
        <p><strong>Quantity:</strong> ${data.quantity || 0} kg</p>
        <p><strong>Location:</strong> ${data.location || 'Unknown'}</p>
    `;

    // Add active buyers count if available
    if (data.activeBuyers !== undefined) {
        if (userType === 'seller') {
            displayHTML += `
                <p class="active-buyers">
                    <strong>Active Buyers:</strong> 
                    <span class="buyer-count">${data.activeBuyers}</span> 
                    ${data.activeBuyers === 1 ? 'buyer is' : 'buyers are'} currently in the room
                </p>
            `;
        } else {
            const otherBuyers = Math.max(0, data.activeBuyers - 1);
            displayHTML += `
                <p class="active-buyers">
                    <strong>Other Buyers:</strong> 
                    <span class="buyer-count">${otherBuyers}</span> 
                    other ${otherBuyers === 1 ? 'buyer is' : 'buyers are'} currently bidding
                </p>
            `;
        }
    }

    // Add AI predicted price if available (only for buyers)
    if (userType === 'buyer' && data.initialPrice) {
        const perKgPrice = parseFloat(data.initialPrice).toFixed(2);
        const totalPrice = (data.initialPrice * data.quantity).toLocaleString('en-IN');
        displayHTML += `
            <p><strong>AI Predicted Price:</strong> ₹${perKgPrice}/kg (Total: ₹${totalPrice})</p>
        `;
    }

    // Add creation time if available
    if (data.createdAt) {
        displayHTML += `
            <p><strong>Created:</strong> ${data.createdAt.toDate().toLocaleString()}</p>
        `;
    }

    roomDetails.innerHTML = displayHTML;
    roomDetails.classList.remove('error', 'loading');

    // Update the current bid display in the highest-bid-box (only for buyers)
    if (userType === 'buyer') {
        const currentBidElement = document.getElementById('current-bid');
        if (currentBidElement) {
            if (data.biddingStarted && data.initialPrice && (!data.highestBid || data.highestBid === data.initialPrice)) {
                // Show total initial price when bidding starts
                const totalInitialPrice = (parseFloat(data.initialPrice) * data.quantity).toLocaleString('en-IN');
                currentBidElement.textContent = totalInitialPrice;
            } else if (data.highestBid) {
                // Show highest bid as is for actual bids
                currentBidElement.textContent = data.highestBid.toLocaleString('en-IN');
            }
        }
    }
}

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
            
            // Update initial display
            updateBidDisplay(data);
            document.getElementById("roomDetails").classList.remove('error', 'loading');

            // Set up real-time listener for bid updates
            setupBidListener(currentRoomId);

            // If bidding has already started, initialize the session
            if (data.biddingStarted) {
                startBiddingSession(data.initialPrice || data.highestBid);
            }
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
    
    if (userType === 'seller') {
        addSystemMessage("Use the AI prediction to set the initial price.");
    } else {
        addSystemMessage("Waiting for seller to set initial price...");
    }
}

// Update the timer display based on server time
function updateTimer(startTime) {
    const now = firebase.firestore.Timestamp.now();
    const sessionStartTime = startTime.toDate();
    const elapsedSeconds = Math.floor((now.toDate() - sessionStartTime) / 1000);
    const totalSessionTime = 300; // 5 minutes in seconds
    
    timeRemaining = Math.max(0, totalSessionTime - elapsedSeconds);
    const timerElement = document.getElementById('timer');
    
    if (timeRemaining <= 0) {
        clearInterval(timer);
        timerElement.textContent = "00:00";
        timerElement.classList.remove('timer-warning');
        timerElement.classList.add('timer-critical');
        
        // Disable the bid input and button
        const bidInput = document.getElementById('bid-amount');
        const bidButton = document.querySelector('.input-container button');
        if (bidInput) {
            bidInput.disabled = true;
            bidInput.placeholder = "Bidding has ended";
        }
        if (bidButton) {
            bidButton.disabled = true;
        }

        // Get final bid details and store in final_bid collection
        storeFinalBidDetails(currentRoomId);
        
        biddingStarted = false;
        return;
    }
    
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    timerElement.textContent = timeString;

    // Add warning class in last 30 seconds
    if (timeRemaining <= 30) {
        timerElement.classList.add('timer-warning');
        // Calculate the animation progress (1 = start of warning, 0 = end)
        const progress = timeRemaining / 30;
        // Update the animation timing
        timerElement.style.animationDuration = `${Math.max(0.5, progress)}s`;
    } else {
        timerElement.classList.remove('timer-warning');
        timerElement.style.animationDuration = '';
    }
}

// Function to store final bid details
async function storeFinalBidDetails(roomId) {
    try {
        // Get room details
        const roomRef = db.collection("biddingRooms").doc(roomId);
        const roomDoc = await roomRef.get();
        const roomData = roomDoc.data();

        if (!roomData.highestBidderId || roomData.highestBidderId === 'anonymous') {
            addSystemMessage("No bids were placed in this session.");
            return;
        }

        // Get seller details
        const sellerRef = db.collection("sellers").doc(roomData.sellerId);
        const sellerDoc = await sellerRef.get();
        const sellerData = sellerDoc.data();

        // Get buyer details
        const buyerRef = db.collection("buyers").doc(roomData.highestBidderId);
        const buyerDoc = await buyerRef.get();
        const buyerData = buyerDoc.data();

        // Calculate final total price
        const finalTotalPrice = parseFloat(roomData.highestBid) * roomData.quantity;

        // Store in final_bid collection
        await db.collection("final_bid").add({
            roomId: roomId,
            cropName: roomData.itemName,
            quantity: roomData.quantity,
            finalBidPrice: finalTotalPrice,
            pricePerKg: parseFloat(roomData.highestBid),
            sellerAddress: sellerData.address,
            sellerId: roomData.sellerId,
            sellerName: sellerData.name,
            buyerAddress: buyerData.address,
            buyerId: roomData.highestBidderId,
            buyerName: buyerData.name,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Update room status
        await roomRef.update({
            status: "closed",
            endTime: firebase.firestore.Timestamp.now(),
            winningBid: {
                amount: finalTotalPrice,
                buyerId: roomData.highestBidderId,
                buyerName: buyerData.name
            }
        });

        // Display winner message to all participants
        const winnerMessage = `🎉 Bidding ended! Winner: ${buyerData.name} with final bid: ₹${finalTotalPrice.toLocaleString('en-IN')}`;
        addSystemMessage(winnerMessage);

    } catch (error) {
        console.error("Error storing final bid details:", error);
        addSystemMessage("Error saving final bid details. Please contact support.");
    }
}

// Start the bidding session
function startBiddingSession(initialPrice) {
    if (biddingStarted) return;
    
    // Get the room data to access quantity
    db.collection("biddingRooms").doc(currentRoomId).get()
        .then((doc) => {
            if (doc.exists) {
                const roomData = doc.data();
                const totalQuantity = roomData.quantity;
                const perKgPrice = parseFloat(initialPrice).toFixed(2);
                const totalPrice = (parseFloat(perKgPrice) * totalQuantity).toLocaleString('en-IN');
                
                highestBid = parseFloat(perKgPrice);
                biddingStarted = true;
                
                // Update room with start time and initial price
                return {
                    perKgPrice,
                    totalPrice,
                    totalQuantity,
                    updatePromise: db.collection("biddingRooms").doc(currentRoomId).update({
                        biddingStarted: true,
                        startTime: firebase.firestore.Timestamp.now(),
                        initialPrice: parseFloat(perKgPrice),
                        highestBid: parseFloat(perKgPrice),
                        status: "active"
                    })
                };
            }
        })
        .then((data) => {
            if (data) {
                return data.updatePromise.then(() => {
                    addSystemMessage(`Bidding session started! Initial bid: ₹${data.totalPrice} (₹${data.perKgPrice}/kg for ${data.totalQuantity}kg)`);
                });
            }
        })
        .catch((error) => {
            console.error("Error starting bidding session:", error);
            addSystemMessage("Error starting bidding session. Please refresh the page.");
        });
}

// Add a message to the chat
function addMessage(message, type = 'system') {
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        // Add timestamp to message
        const timestamp = new Date().toLocaleTimeString();
        messageDiv.innerHTML = `
            <span class="message-time">[${timestamp}]</span>
            <span class="message-text">${message}</span>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Add a system message
function addSystemMessage(message) {
    addMessage(message, 'system');
}

// Add a bid message
function addUserBid(amount) {
    addMessage(amount, 'bid');
}

// Handle bid submission
async function sendBid() {
    if (userType === 'seller') {
        addSystemMessage("Sellers cannot place bids in their own rooms.");
        return;
    }

    if (!biddingStarted) {
        addSystemMessage("Please wait for the seller to set the initial price.");
        return;
    }

    if (timeRemaining <= 0) {
        addSystemMessage("Bidding session has ended. No more bids can be placed.");
        return;
    }

    try {
        const roomRef = db.collection("biddingRooms").doc(currentRoomId);
        const roomSnap = await roomRef.get();
        const roomData = roomSnap.data();

        const bidInput = document.getElementById('bid-amount');
        const bidAmount = parseFloat(bidInput.value);

        if (isNaN(bidAmount) || bidAmount <= 0) {
            addSystemMessage("Please enter a valid bid amount.");
            return;
        }

        // Calculate total minimum price based on initial price and quantity
        const totalMinPrice = roomData.initialPrice * roomData.quantity;
        const currentHighestBid = roomData.highestBid || totalMinPrice;

        if (bidAmount <= Math.max(currentHighestBid, totalMinPrice)) {
            addSystemMessage(`Your bid must be higher than ₹${Math.max(currentHighestBid, totalMinPrice).toLocaleString('en-IN')}`);
            return;
        }

        await roomRef.update({
            highestBid: bidAmount,
            highestBidderId: 'anonymous',
            lastBidTime: firebase.firestore.Timestamp.now()
        });

        bidInput.value = '';
        addUserBid(bidAmount.toLocaleString('en-IN'));
        addSystemMessage(`Bid placed successfully: ₹${bidAmount.toLocaleString('en-IN')}`);

    } catch (error) {
        console.error("Error updating bid:", error);
        addSystemMessage(`Error placing bid: ${error.message}`);
    }
}

// Price prediction function (only for sellers)
async function predictPrice() {
    if (userType !== 'seller') {
        addSystemMessage("Only sellers can predict prices.");
        return;
    }

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

        // Show loading state
        resultDiv.innerHTML = '<h3 class="loading">Calculating prediction...</h3>';

        const response = await fetch(`${SERVER_URL}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                crop: cropInput,
                year: parseInt(yearInput)
            })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        // Get the current room data to access quantity
        const roomRef = db.collection("biddingRooms").doc(currentRoomId);
        const roomSnap = await roomRef.get();
        const roomData = roomSnap.data();
        const totalQuantity = roomData.quantity;
        
        // Format predicted price to 2 decimal places
        const perKgPrice = parseFloat(data.predicted_price).toFixed(2);
        const totalPrice = (parseFloat(perKgPrice) * totalQuantity).toLocaleString('en-IN');

        // Display only price per kg and total price
        resultDiv.innerHTML = `
            <h3>Prediction Result</h3>
            <p>Price per kg: ₹${perKgPrice}</p>
            <p>Total price: ₹${totalPrice}</p>
        `;

        startBiddingSession(perKgPrice);
    } catch (error) {
        console.error("Error:", error);
        resultDiv.innerHTML = `
            <h3 class="error">Error</h3>
            <p>${error.message}</p>
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

// Add this function to handle user presence
function setupPresenceTracking(roomId) {
    if (userType !== 'buyer') return; // Only track buyers

    const roomRef = db.collection("biddingRooms").doc(roomId);

    // Update presence when joining
    roomRef.update({
        activeBuyers: firebase.firestore.FieldValue.increment(1)
    });

    // Remove presence when leaving
    window.addEventListener('beforeunload', () => {
        roomRef.update({
            activeBuyers: firebase.firestore.FieldValue.increment(-1)
        });
    });

    // Cleanup on errors or crashes
    window.addEventListener('unload', () => {
        roomRef.update({
            activeBuyers: firebase.firestore.FieldValue.increment(-1)
        });
    });
}

// Initialize the room with activeBuyers field if it doesn't exist
async function initializeRoom(roomId) {
    const roomRef = db.collection("biddingRooms").doc(roomId);
    const doc = await roomRef.get();
    
    if (doc.exists && doc.data().activeBuyers === undefined) {
        await roomRef.update({
            activeBuyers: 0
        });
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', initBidding);

