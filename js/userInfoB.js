import { auth, db, doc, setDoc } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = 'loginB.html';
            return;
        }

        const form = document.getElementById('userInfoForm');
        const submitButton = document.getElementById('submitButton');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            submitButton.textContent = 'Saving...';
            submitButton.disabled = true;

            const userInfo = {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                gender: document.getElementById('gender').value.charAt(0).toUpperCase() + document.getElementById('gender').value.slice(1).toLowerCase(),
                phone: document.getElementById('phone').value,
                addressLine1: document.getElementById('addressLine1').value,
                addressLine2: document.getElementById('addressLine2').value || '',
                city: document.getElementById('city').value,
                state: document.getElementById('state').value,
                pincode: document.getElementById('pincode').value,
                email: user.email,
                createdAt: new Date().toISOString(),
                userId: user.uid
            };

            try {
                await setDoc(doc(db, 'buyers', user.uid), userInfo);
                console.log('User info saved successfully');
                window.location.href = 'dashboardB.html';
            } catch (error) {
                console.error('Error saving user info:', error);
                submitButton.textContent = 'Save Profile';
                submitButton.disabled = false;
                alert('Error saving information: ' + error.message);
            }
        });
    });
}); 