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
                window.location.href = 'loginS.html';
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
        window.location.href = "loginS.html";
    }
});

// Load Seller's Active Bidding Rooms with Timestamp Retrieval
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

            // Convert Firestore Timestamp to Readable Date
            let createdAtFormatted = "N/A";
            if (data.createdAt) {
                const date = data.createdAt.toDate();
                createdAtFormatted = date.toLocaleString();
            }

            // Display Bidding Room Data Including Timestamp
            const li = document.createElement("li");
            li.className = "list-group-item";
            li.innerHTML = `<strong>${data.itemName}</strong> - 
                            Quantity: ${data.quantity} kg <br>
                            Location: ${data.location} <br>
                            Highest Bid: ₹${data.highestBid} <br>
                            Created At: ${createdAtFormatted}`;
            roomsList.appendChild(li);
        });
    }
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