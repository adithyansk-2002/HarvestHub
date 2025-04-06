// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.sharedBidding.loadBiddingRoom();
});

// Handle price prediction
async function predictPrice() {
    const cropInput = document.getElementById('crop').value.trim().toLowerCase();
    const yearInput = document.getElementById('year').value.trim();
    
    try {
        const response = await fetch(`${SERVER_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ crop: cropInput, year: parseInt(yearInput) })
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }

        // Update room with initial price
        const roomRef = db.collection("biddingRooms").doc(window.sharedBidding.currentRoomId());
        await roomRef.update({
            initialPrice: data.predicted_price,
            biddingStarted: true,
            startTime: firebase.firestore.FieldValue.serverTimestamp()
        });

        document.getElementById('prediction-result').innerHTML = `
            <h3>Initial Price Set</h3>
            <p>The bidding will start at ₹${data.predicted_price}</p>
        `;
    } catch (error) {
        console.error("Error:", error);
        document.getElementById('prediction-result').innerHTML = `
            <h3 class="error">Error</h3>
            <p>${error.message}</p>
        `;
    }
}
