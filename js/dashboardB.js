import { auth, db, doc, getDoc, signOut, collection, getDocs, query, where } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {
    // Add sign out functionality
    const signOutBtn = document.getElementById('signOutBtn');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', async () => {
            try {
                await signOut(auth);
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Error signing out:', error);
                alert('Error signing out. Please try again.');
            }
        });
    }

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            try {
                // Get user info from Firestore
                const userDoc = await getDoc(doc(db, 'buyers', user.uid));
                const userData = userDoc.data();

                if (!userDoc.exists()) {
                    console.error('No user document found for ID:', user.uid);
                    window.location.href = 'userInfoB.html';
                    return;
                }

                // Format the creation time
                const creationDate = new Date(user.metadata.creationTime);
                const day = String(creationDate.getDate()).padStart(2, '0');
                const month = String(creationDate.getMonth() + 1).padStart(2, '0');
                const year = creationDate.getFullYear();
                const formattedDate = `${day}/${month}/${year}`;

                // Update all UI elements
                const elements = {
                    'user-name': `${userData.firstName} ${userData.lastName}`,
                    'user-email': userData.email,
                    'user-phone': userData.phone,
                    'user-gender': userData.gender,
                    'address-line1': userData.addressLine1,
                    'address-line2': userData.addressLine2 || 'Not provided',
                    'user-city': userData.city,
                    'user-state': userData.state,
                    'user-pincode': userData.pincode,
                    'account-created': formattedDate
                };

                // Update each element if it exists
                for (const [id, value] of Object.entries(elements)) {
                    const element = document.getElementById(id);
                    if (element) {
                        element.textContent = value || 'Not provided';
                    }
                }

                // Remove loading spinner if it exists
                const profileCard = document.querySelector('.profile-card');
                const loadingSpinner = document.querySelector('.loading-spinner');
                if (profileCard) profileCard.classList.add('loaded');
                if (loadingSpinner) loadingSpinner.style.display = 'none';

                // Load bidding rooms after user data is loaded
                loadBiddingRooms();

            } catch (error) {
                console.error('Error fetching user data:', error);
                alert('Error loading user information. Please refresh the page.');
            }
        } else {
            window.location.href = 'login.html';
        }
    });
});

// Function to Load Bidding Rooms
async function loadBiddingRooms() {
    const biddingRoomsList = document.getElementById('bidding-rooms-list');
    biddingRoomsList.innerHTML = '<p>Loading bidding rooms...</p>';

    try {
        // Query only active bidding rooms
        const roomsCollection = collection(db, 'biddingRooms');
        const q = query(roomsCollection, where("status", "==", "open"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            biddingRoomsList.innerHTML = '<p>No active bidding rooms available.</p>';
            return;
        }

        let roomsHTML = '';
        querySnapshot.forEach((doc) => {
            const room = doc.data();
            // Format the creation time
            let createdAtFormatted = "N/A";
            if (room.createdAt) {
                const date = room.createdAt.toDate();
                createdAtFormatted = date.toLocaleString();
            }

            roomsHTML += `
                <div class="info-item">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${room.itemName}</strong> - Quantity: ${room.quantity} kg
                            <br>
                            <span>Location: ${room.location}</span>
                            <br>
                            <span>Highest Bid: ₹${room.highestBid || 0}</span>
                            <br>
                            <span>Created At: ${createdAtFormatted}</span>
                        </div>
                        <button class="btn btn-success btn-sm join-room" data-roomid="${doc.id}">Join Bidding</button>
                    </div>
                </div>
            `;
        });

        biddingRoomsList.innerHTML = roomsHTML;

        // Add Event Listeners for Join Buttons
        document.querySelectorAll('.join-room').forEach((button) => {
            button.addEventListener('click', (event) => {
                const roomId = event.target.getAttribute('data-roomid');
                window.location.href = `http://127.0.0.1:5000/?type=buyer&roomId=${roomId}`;
            });
        });

    } catch (error) {
        console.error('Error fetching bidding rooms:', error);
        biddingRoomsList.innerHTML = '<p>Error loading bidding rooms.</p>';
    }
}