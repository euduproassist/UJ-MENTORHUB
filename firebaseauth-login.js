import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAAWp9JYQY8YThZEW-vvZ40ffIfS8w7H4w",
  authDomain: "eduproassistprj.firebaseapp.com",
  projectId: "eduproassistprj",
  storageBucket: "eduproassistprj.firebasestorage.app",
  messagingSenderId: "984975777882",
  appId: "1:984975777882:web:aab9f211d4b7757421f863"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// LOGIN FUNCTION
async function loginUser(email, password) {
  try {
    // Trim input values to avoid errors
    email = email.trim();
    password = password.trim();

    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get user document from Firestore
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      alert("User data not found in database. Contact admin.");
      return; // Stop execution
    }

    const userData = docSnap.data();
    const role = userData.role;

    // Redirect based on role
    switch (role) {
      case "student":
        window.location.href = "uj-student.html";
        break;
      case "tutor":
        window.location.href = "uj-tutor.html";
        break;
      case "counsellor":
        window.location.href = "uj-counsellor.html";
        break;
      case "admin":
        window.location.href = "uj-admin.html";
        break;
      default:
        alert("Invalid user role. Contact admin.");
    }

  } catch (error) {
    console.error("Login error:", error);
    alert("Login failed: " + error.message);
  }
}

// CONNECT LOGIN BUTTON
const loginBtn = document.getElementById("loginBtn");
if (loginBtn) {
  loginBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    loginUser(email, password);
  });
} else {
  console.error("Login button not found (id=loginBtn)");
}

