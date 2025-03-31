button.addEventListener("click", function () {
    const roomId = this.getAttribute("data-room-id");
    window.location.href = `../bidding interface ui/index.html?roomId=${roomId}`;
});

async function loadBiddingRooms(sellerId) {
    const roomsList = document.getElementById("biddingRoomsList");
    roomsList.innerHTML = "<li class='list-group-item'>Loading...</li>";

    const q = query(collection(db, "biddingRooms"), where("sellerId", "==", sellerId), where("status", "==", "open"));
    const querySnapshot = await getDocs(q);

    roomsList.innerHTML = "";
    if (querySnapshot.empty) {
        roomsList.innerHTML = "<li class='list-group-item'>No active bidding rooms.</li>";
    } else {
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const roomId = doc.id;

            // Convert Firestore Timestamp to Readable Date
            let createdAtFormatted = "N/A";
            if (data.createdAt) {
                const date = data.createdAt.toDate();
                createdAtFormatted = date.toLocaleString();
            }

            // Create List Item with "View Room" Button
            const li = document.createElement("li");
            li.className = "list-group-item d-flex justify-content-between align-items-center";
            li.innerHTML = `
                <div>
                    <strong>${data.itemName}</strong> - Quantity: ${data.quantity} kg<br>
                    Location: ${data.location}<br>
                    Highest Bid: ₹${data.highestBid}<br>
                    Created At: ${createdAtFormatted}
                </div>
                <button class="btn btn-success view-room-btn" data-room-id="${roomId}">View Room</button>
            `;
            roomsList.appendChild(li);
        });

        // Add event listener to each "View Room" button
        document.querySelectorAll(".view-room-btn").forEach((button) => {
            button.addEventListener("click", function () {
                const roomId = this.getAttribute("data-room-id");
                window.location.href = `../bidding interface ui/biddingindex.html?roomId=${roomId}`;
            });
        });
    }
} 