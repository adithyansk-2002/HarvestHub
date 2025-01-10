import { auth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from './firebase.js';

const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");
const loginbtn = document.getElementById("login-btn");
const googleButton = document.getElementById("googlebtn");



loginbtn.addEventListener('click', (e) => {

    e.preventDefault(); // Prevent form submission

    var email = document.getElementById('login-email').value;
    var password = document.getElementById('login-password').value;

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
                window.location.href = 'dashboard.html';
            }, 1000);

        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;

            alert(errorMessage);
        });

});

googleButton.addEventListener('click', (e) => {

    signInWithPopup(auth, provider)
        .then((result) => {
            // This gives you a Google Access Token. You can use it to access the Google API.
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential.accessToken;
            // The signed-in user info.
            const user = result.user;
            // Wait for 1 second (1000 milliseconds) before redirecting to index.html
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);

        }).catch((error) => {
            // Handle Errors here.
            const errorCode = error.code;
            const errorMessage = error.message;
            alert(errorMessage);
            // The email of the user's account used.
            const email = error.customData.email;
            // The AuthCredential type that was used.
            const credential = GoogleAuthProvider.credentialFromError(error);
            // ...
        });
});