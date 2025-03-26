import { auth } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged((user) => {
        if (user) {
            const userName = user.displayName || 'User';
            const userEmail = user.email;
            const phoneNumber = user.phoneNumber || 'Not provided';
            
            // Format the creation time
            const creationDate = new Date(user.metadata.creationTime);
            const day = String(creationDate.getDate()).padStart(2, '0');
            const month = String(creationDate.getMonth() + 1).padStart(2, '0');
            const year = creationDate.getFullYear();
            const formattedDate = `${day}/${month}/${year}`;
            
            // Update the UI
            if (document.getElementById('user-name')) {
                document.getElementById('user-name').textContent = userName;
            }
            if (document.getElementById('user-email')) {
                document.getElementById('user-email').textContent = userEmail;
            }
            if (document.getElementById('user-phone')) {
                document.getElementById('user-phone').textContent = phoneNumber;
            }
            if (document.getElementById('account-created')) {
                document.getElementById('account-created').textContent = formattedDate;
            }
        } else {
            window.location.href = 'login.html';
        }
    });
}); 