// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.sharedBidding.loadBiddingRoom();
});

// Handle bid submission
async function sendBid() {
    const currentRoom = window.sharedBidding.currentRoom();
    if (!currentRoom.biddingStarted) {
        showError("Waiting for seller to set initial price");
        return;
    }

    const bidInput = document.getElementById('bid-amount');
    const bidAmount = parseInt(bidInput.value);

    if (isNaN(bidAmount) || bidAmount <= 0) {
        showError("Please enter a valid bid amount");
        return;
    }

    if (bidAmount <= currentRoom.highestBid) {
        showError(`Your bid must be higher than ₹${currentRoom.highestBid}`);
        return;
    }

    try {
        const roomRef = db.collection("biddingRooms").doc(window.sharedBidding.currentRoomId());
        await roomRef.update({
            highestBid: bidAmount,
            highestBidderId: firebase.auth().currentUser?.uid || 'anonymous',
            lastBidTime: firebase.firestore.FieldValue.serverTimestamp()
        });

        bidInput.value = '';
        addMessage(`Your bid of ₹${bidAmount} has been placed!`, 'success');
    } catch (error) {
        console.error("Error placing bid:", error);
        showError("Error placing bid. Please try again.");
    }
}

function showError(message) {
    addMessage(message, 'error');
}

function addMessage(message, type) {
    const messagesDiv = document.getElementById('chat-messages');
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.textContent = message;
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
