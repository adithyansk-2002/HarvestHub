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

// Global variables
let currentRoomId = null;
let currentRoom = null;
let biddingStarted = false;
let timeRemaining = 300;
let timer = null;

// Load room details
async function loadBiddingRoom() {
    const params = new URLSearchParams(window.location.search);
    currentRoomId = params.get("roomId");

    if (!currentRoomId) {
        showError("No room ID provided");
        return;
    }

    try {
        const roomRef = db.collection("biddingRooms").doc(currentRoomId);
        const roomSnap = await roomRef.get();

        if (!roomSnap.exists) {
            showError("Room not found");
            return;
        }

        currentRoom = roomSnap.data();
        displayRoomDetails(currentRoom);
        
        // Start listening for real-time updates
        listenToRoomUpdates();
    } catch (error) {
        console.error("Error loading room:", error);
        showError("Error loading room details");
    }
}

// Display room details
function displayRoomDetails(room) {
    const detailsHtml = `
        <h3>${room.itemName}</h3>
        <p><strong>Quantity:</strong> ${room.quantity} kg</p>
        <p><strong>Location:</strong> ${room.location}</p>
        <p><strong>Current Highest Bid:</strong> ₹${room.highestBid || 0}</p>
        ${room.createdAt ? `<p><strong>Created:</strong> ${room.createdAt.toDate().toLocaleString()}</p>` : ''}
    `;
    document.getElementById("roomDetails").innerHTML = detailsHtml;
}

// Listen for real-time updates
function listenToRoomUpdates() {
    const roomRef = db.collection("biddingRooms").doc(currentRoomId);
    roomRef.onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data();
            currentRoom = data;
            displayRoomDetails(data);
            
            if (data.biddingStarted && !biddingStarted) {
                startBiddingSession(data.initialPrice);
            }
        }
    });
}

// Export functions for use in specific interfaces
window.sharedBidding = {
    loadBiddingRoom,
    displayRoomDetails,
    listenToRoomUpdates,
    currentRoom: () => currentRoom,
    currentRoomId: () => currentRoomId,
    biddingStarted: () => biddingStarted
};
