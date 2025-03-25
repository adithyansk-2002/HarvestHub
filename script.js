// Simulating previous bids
let chatBox = document.getElementById("chat-box");
let highestBid = 600; // Start with the last bid

let messages = [
    { sender: "User1", text: "Bid: ₹500" },
    { sender: "User2", text: "Bid: ₹550" },
    { sender: "User3", text: "Bid: ₹600" }
];

// Function to load previous bids
function loadBids() {
    messages.forEach(msg => {
        let messageDiv = document.createElement("div");
        messageDiv.classList.add("message", msg.sender === "You" ? "user-message" : "other-message");
        messageDiv.innerText = `${msg.sender}: ${msg.text}`;
        chatBox.appendChild(messageDiv);
    });
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Function to send a bid
function sendBid() {
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

    // Simulate other bidders
    setTimeout(() => {
        let randomBid = highestBid + Math.floor(Math.random() * 50) + 10; // Ensure higher bids
        highestBid = randomBid;
        let otherBid = document.createElement("div");
        otherBid.classList.add("message", "other-message");
        otherBid.innerText = `User${Math.floor(Math.random() * 10)}: Bid ₹${randomBid}`;
        chatBox.appendChild(otherBid);
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 1000);

    // Clear input
    bidInput.value = "";
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Load existing bids on page load
window.onload = loadBids;
