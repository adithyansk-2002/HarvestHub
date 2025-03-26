import { auth, db, doc, getDoc, signOut } from './firebase.js';

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
                console.log('Current user ID:', user.uid);
                
                // Get user info from Firestore
                const userDocRef = doc(db, 'sellers', user.uid);
                console.log('Attempting to fetch document:', userDocRef);
                
                const userDoc = await getDoc(userDocRef);
                console.log('Document exists:', userDoc.exists());
                
                if (!userDoc.exists()) {
                    console.error('No user document found for ID:', user.uid);
                    // Redirect to user info page if no data exists
                    window.location.href = 'userInfoS.html';
                    return;
                }

                const userData = userDoc.data();
                console.log('User data:', userData);

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

                // Remove loading spinner by adding loaded class
                document.querySelector('.profile-card').classList.add('loaded');
                document.querySelector('.loading-spinner').style.display = 'none';

            } catch (error) {
                console.error('Error fetching user data:', error);
                document.querySelector('.loading-spinner').innerHTML = 
                    '<p style="color: red;">Error loading data. Please refresh the page.</p>';
            }
        } else {
            window.location.href = 'loginS.html';
        }
    });
}); 