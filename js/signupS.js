import {auth,createUserWithEmailAndPassword,GoogleAuthProvider,signInWithPopup} from "./firebase.js";
const provider = new GoogleAuthProvider();


const signupEmail = document.getElementById("signup-email");
const signupPassword = document.getElementById("signup-password");
const signupSubmit = document.getElementById("signup-submit");
const googleButton = document.getElementById("googlebtn");

function isPasswordStrong(password) {
  // You can implement your own password strength check logic here
  // Check for minimum length, presence of uppercase letters, lowercase letters, numbers, and special characters
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password);

  return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
}

signupSubmit.addEventListener("click", (e) => {
  e.preventDefault();
  console.log(signupEmail.value, signupPassword.value);
  // Check password strength
  if (!isPasswordStrong(signupPassword.value)) {
    alert("Use a strong password (minimum 8 characters with uppercase, lowercase, number, and special character)");
    return; // Prevent further execution
    }
  createUserWithEmailAndPassword(auth, signupEmail.value, signupPassword.value)
    .then((userCredential) => {
      // Signed up
      const user = userCredential.user;
      setTimeout(() => {
        window.location.href = "dashboardS.html";
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
                window.location.href = 'dashboardS.html';
            }, 1000);
        })
        .catch(handleError);
});
