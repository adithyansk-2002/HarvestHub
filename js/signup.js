import {auth,createUserWithEmailAndPassword,GoogleAuthProvider,signInWithPopup} from "./firebase.js";
const provider = new GoogleAuthProvider();


const signupEmail = document.getElementById("signup-email");
const signupPassword = document.getElementById("signup-password");
const signupSubmit = document.getElementById("signup-submit");
const googleButton = document.getElementById("googlebtn");


signupSubmit.addEventListener("click", (e) => {
  e.preventDefault();
  console.log(signupEmail.value, signupPassword.value);
  createUserWithEmailAndPassword(auth, signupEmail.value, signupPassword.value)
    .then((userCredential) => {
      // Signed up
      const user = userCredential.user;
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1000);
      // ...
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      // ..
    });
});

googleButton.addEventListener('click', (e) => {
    e.preventDefault();
    signInWithPopup(auth, provider)
        .then((result) => {
            const user = result.user;
            // Wait for 1 second (1000 milliseconds) before redirecting to index.html
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        })
        .catch(handleError);
});
