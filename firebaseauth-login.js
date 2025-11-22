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

// Login function
async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();
      const role = userData.role;

      if (role === "student") window.location.href = "uj-student.html";
      else if (role === "tutor") window.location.href = "uj-tutor.html";
      else if (role === "counsellor") window.location.href = "uj-counsellor.html";
      else if (role === "admin") window.location.href = "uj-admin.html";
    } else {
      alert("User data not found. Contact admin.");
    }

  } catch (error) {
    console.error("Login error:", error);
    alert("Login failed: " + error.message);
  }
}

// Connect login button
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
