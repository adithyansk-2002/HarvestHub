import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, getDocs, doc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

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
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore(app);

// Ensure modal initializes only once
let biddingModal;

document.addEventListener('DOMContentLoaded', function() {
    biddingModal = new bootstrap.Modal(document.getElementById('biddingModal'));

    // Open modal when create bidding button is clicked
    document.getElementById('createBiddingBtn').addEventListener('click', () => {
        const modalElement = document.getElementById('biddingModal');
        modalElement.removeAttribute("aria-hidden");
        modalElement.setAttribute("aria-modal", "true");
        biddingModal.show();
    });

    // Add sign out functionality
    const signOutBtn = document.getElementById('signOutBtn');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', async () => {
            try {
                await signOut(auth);
                window.location.href = 'login.html';
            } catch (error) {
                console.error('Error signing out:', error);
                alert('Error signing out. Please try again.');
            }
        });
    }
});

// Authentication State Handling
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            // Fetch user data from Firestore
            const userDocRef = doc(db, 'sellers', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                window.location.href = 'userInfoS.html';
                return;
            }

            const userData = userDoc.data();

            // Format the creation time
            const creationDate = new Date(user.metadata.creationTime);
            const day = String(creationDate.getDate()).padStart(2, '0');
            const month = String(creationDate.getMonth() + 1).padStart(2, '0');
            const year = creationDate.getFullYear();
            const formattedDate = `${day}/${month}/${year}`;

            // Update UI elements
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

            for (const [id, value] of Object.entries(elements)) {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = value || 'Not provided';
                }
            }

            // Remove loading spinner
            document.querySelector('.profile-card').classList.add('loaded');
            document.querySelector('.loading-spinner').style.display = 'none';

            // Load Seller's Active Bidding Rooms
            await loadBiddingRooms(user.uid);

        } catch (error) {
            console.error('Error fetching user data:', error);
            document.querySelector('.loading-spinner').innerHTML = 
                '<p style="color: red;">Error loading data. Please refresh the page.</p>';
        }
    } else {
        window.location.href = "login.html";
    }
});

// Load Seller's Active Bidding Rooms with Timestamp Retrieval and "View Room" Button
async function loadBiddingRooms(sellerId) {
    console.log("Loading bidding rooms for seller:", sellerId);
    const roomsList = document.getElementById("biddingRoomsList");
    if (!roomsList) {
        console.error("Could not find biddingRoomsList element");
        return;
    }
    roomsList.innerHTML = `
        <div class="info-item">
            <p>Loading bidding rooms...</p>
        </div>
    `;

    try {
        const q = query(collection(db, "biddingRooms"), 
                       where("sellerId", "==", sellerId), 
                       where("status", "==", "open"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            roomsList.innerHTML = `
                <div class="info-item">
                    <p>No active bidding rooms.</p>
                </div>
            `;
            return;
        }

        let roomsHTML = '';
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const roomId = doc.id;

            // Convert Firestore Timestamp to Readable Date
            let createdAtFormatted = "N/A";
            if (data.createdAt) {
                const date = data.createdAt.toDate();
                createdAtFormatted = date.toLocaleString();
            }

            roomsHTML += `
                <div class="info-item">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${data.itemName}</strong> - Quantity: ${data.quantity} kg
                            <br>
                            <span>Location: ${data.location}</span>
                            <br>
                            <span>Highest Bid: ₹${data.highestBid || 0}</span>
                            <br>
                            <span>Created At: ${createdAtFormatted}</span>
                        </div>
                        <button class="btn btn-success btn-sm view-room-btn" data-room-id="${roomId}">View Room</button>
                    </div>
                </div>
            `;
        });

        roomsList.innerHTML = roomsHTML;

        // Add event listeners to View Room buttons
        document.querySelectorAll(".view-room-btn").forEach((button) => {
            button.addEventListener("click", async function() {
                const roomId = this.getAttribute("data-room-id");
                await startFlaskServerAndOpenRoom(roomId);
            });
        });

    } catch (error) {
        console.error("Error loading bidding rooms:", error);
        roomsList.innerHTML = `
            <div class="info-item">
                <p class="text-danger">Error loading bidding rooms. Please try again.</p>
            </div>
        `;
    }
}

// Start Flask and open bidding room
async function startFlaskServerAndOpenRoom(roomId) {
    try {
        let response = await fetch("http://127.0.0.1:5000/ping");
        if (response.ok) {
            console.log("Flask is already running.");
            window.location.href = `http://127.0.0.1:5000/?type=seller&roomId=${roomId}`;
            return;
        }
    } catch (error) {
        console.log("Flask is not running. Starting...");
    }

    fetch("http://127.0.0.1:5000/start-flask")
        .then(() => {
            setTimeout(() => {
                window.location.href = `http://127.0.0.1:5000/?type=seller&roomId=${roomId}`;
            }, 5000);
        })
        .catch((error) => console.error("Failed to start Flask:", error));
}

// Handle Bidding Room Creation
document.getElementById("createRoomBtn").addEventListener("click", async () => {
    const cropName = document.getElementById("cropName").value.trim();
    const quantity = Number(document.getElementById("quantity").value);
    const location = document.getElementById("location").value.trim();

    const user = auth.currentUser;
    if (!user) {
        alert("⚠️ You must be logged in to create a bidding room.");
        return;
    }

    // Validate Input Fields
    if (!cropName || !quantity || !location) {
        alert("⚠️ Please fill in all fields.");
        return;
    }

    try {
        const docRef = await addDoc(collection(db, "biddingRooms"), {
            sellerId: user.uid,
            itemName: cropName,
            quantity: quantity,
            location: location,
            highestBid: 0,
            highestBidderId: null,
            status: "open",
            createdAt: serverTimestamp()  // Auto-generate timestamp
        });

        console.log(`✅ Bidding Room Created! Room ID: ${docRef.id}`);
        alert("✅ Bidding Room Created Successfully!");

        // Close modal & reset form
        document.getElementById("biddingForm").reset();
        biddingModal.hide();

        // Reload Bidding Rooms
        await loadBiddingRooms(user.uid);
    } catch (error) {
        console.error("❌ Error creating room:", error);
        alert("❌ Failed to create bidding room. Please try again.");
    }
});