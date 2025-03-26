// Simulating previous bids
let chatBox = document.getElementById("chat-box");
let highestBid = 600; // Start with the last bid

let messages = [
    { sender: "User1", text: "Bid: ₹500" },
    { sender: "User2", text: "Bid: ₹550" },
    { sender: "User3", text: "Bid: ₹600" }
];

// Firebase imports and initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDc3h5uJK-DJ4t9oL0ImbHxn-atM166CT8",
    authDomain: "harvesthub-c54c6.firebaseapp.com",
    projectId: "harvesthub-c54c6",
    storageBucket: "harvesthub-c54c6.firebasestorage.app",
    messagingSenderId: "330622578420",
    appId: "1:330622578420:web:6691d622a955a2c7c578a1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Get roomId from URL
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("roomId");

// Add styles from styles.css
const style = document.createElement('style');
style.textContent = `
    body {
        font-family: Arial, sans-serif;
        background-color: #f5f5f5;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
    }

    /* Chatbox Container */
    .chat-container {
        width: 400px;
        background: white;
        border-radius: 10px;
        box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.2);
        padding: 15px;
    }

    /* Chat Header */
    h2 {
        text-align: center;
        color: green;
    }

    /* Chat Box */
    #chat-box {
        height: 300px;
        overflow-y: auto;
        border: 1px solid #ddd;
        padding: 10px;
        margin-bottom: 10px;
        background: #fafafa;
    }

    /* Bids Display */
    .message {
        padding: 8px;
        border-radius: 5px;
        margin-bottom: 8px;
        font-size: 14px;
    }

    /* User Message */
    .user-message {
        background: #d4edda;
        text-align: right;
    }

    /* Other Bidders */
    .other-message {
        background: #f8d7da;
        text-align: left;
    }

    /* Input Container */
    .input-container {
        display: flex;
    }

    .input-container input {
        flex: 1;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 5px;
    }

    .input-container button {
        background: green;
        color: white;
        padding: 8px;
        border: none;
        cursor: pointer;
        border-radius: 5px;
        margin-left: 5px;
    }

    .input-container button:hover {
        background: darkgreen;
    }
`;
document.head.appendChild(style);

// Function to load previous bids
async function loadBids() {
    if (!roomId) {
        alert("Room ID not found.");
        return;
    }

    const roomRef = doc(db, "biddingRooms", roomId);
    const roomSnap = await getDoc(roomRef);

    if (roomSnap.exists()) {
        const data = roomSnap.data();
        highestBid = data.highestBid;

        messages = data.bids || [];
        messages.forEach(msg => {
            let messageDiv = document.createElement("div");
            messageDiv.classList.add("message", msg.sender === "You" ? "user-message" : "other-message");
            messageDiv.innerText = `${msg.sender}: ${msg.text}`;
            chatBox.appendChild(messageDiv);
        });
        chatBox.scrollTop = chatBox.scrollHeight;
    } else {
        alert("Bidding room not found.");
    }
}

// Function to send a bid
async function sendBid() {
    let bidInput = document.getElementById("bidInput");
    let bidValue = parseInt(bidInput.value.trim());

    if (isNaN(bidValue) || bidValue <= highestBid) {
        alert(`Your bid must be higher than ₹${highestBid}!`);
        return;
    }

    // Update highest bid
    highestBid = bidValue;

    // Add bid to chat
    let userBid = document.createElement("div");
    userBid.classList.add("message", "user-message");
    userBid.innerText = `You: Bid ₹${bidValue}`;
    chatBox.appendChild(userBid);

    // Update Firestore with the new bid
    const roomRef = doc(db, "biddingRooms", roomId);
    await updateDoc(roomRef, {
        highestBid: highestBid,
        bids: [...messages, { sender: "You", text: `Bid: ₹${bidValue}` }]
    });

    // Simulate other bidders
    setTimeout(async () => {
        let randomBid = highestBid + Math.floor(Math.random() * 50) + 10; // Ensure higher bids
        highestBid = randomBid;
        let otherBid = document.createElement("div");
        otherBid.classList.add("message", "other-message");
        otherBid.innerText = `User${Math.floor(Math.random() * 10)}: Bid ₹${randomBid}`;
        chatBox.appendChild(otherBid);
        chatBox.scrollTop = chatBox.scrollHeight;

        // Update Firestore with the simulated bid
        await updateDoc(roomRef, {
            highestBid: highestBid,
            bids: [...messages, { sender: `User${Math.floor(Math.random() * 10)}`, text: `Bid: ₹${randomBid}` }]
        });
    }, 1000);

    // Clear input
    bidInput.value = "";
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Load existing bids on page load
window.onload = loadBids;
