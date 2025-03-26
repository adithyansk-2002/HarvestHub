import { auth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from './firebase.js';
const provider = new GoogleAuthProvider();

const loginEmail = document.getElementById("signup-email");
const loginPassword = document.getElementById("signup-password");
const loginbtn = document.getElementById("signup-submit");
const googleButton = document.getElementById("googlebtn");
console.log(document.getElementById("signup-submit")); // Should not be null
console.log(document.getElementById("googlebtn")); // Should not be null



loginbtn.addEventListener('click', (e) => {

    e.preventDefault(); // Prevent form submission
    
    var email = document.getElementById('signup-email').value;
    var password = document.getElementById('signup-password').value;

    // Perform client-side validation
    if (!email || !password) {
        alert('Please enter both email and password.');
        return; // Exit the function if either field is empty
    }

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed In
            const user = userCredential.user;

            // Wait for 1 second (1000 milliseconds) before redirecting to index.html
            setTimeout(() => {
                window.location.href = 'dashboardB.html';
            }, 1000);

        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;

            alert(errorMessage);
        });

});

googleButton.addEventListener('click', (e) => {
    e.preventDefault();
    signInWithPopup(auth, provider)
        .then((result) => {
            const user = result.user;
            
            // Get user information
            const displayName = user.displayName;
            const email = user.email;
            const photoURL = user.photoURL;
            const phoneNumber = user.phoneNumber || 'Not provided';
            
            // Format the creation time
            const creationDate = new Date(user.metadata.creationTime);
            const day = String(creationDate.getDate()).padStart(2, '0');
            const month = String(creationDate.getMonth() + 1).padStart(2, '0');
            const year = creationDate.getFullYear();
            const formattedDate = `${day}/${month}/${year}`;
            
            // Original 1-second delay
            setTimeout(() => {
                window.location.href = 'dashboardB.html';
            }, 1000);
        })
        .catch(handleError);
});