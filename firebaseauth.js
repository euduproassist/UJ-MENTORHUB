


import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

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

// SIGNUP FUNCTION
async function signupUser(email, password, fullName, role, department) {
  try {
    email = email.trim();
    password = password.trim();
    fullName = fullName.trim();
    department = department ? department.trim() : "";

    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Save user in Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email,
      fullName,
      role,
      department,
      profilePicture: "",
      createdAt: serverTimestamp()
    });

    alert("Signup successful!");

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
        alert("Invalid role. Contact admin.");
    }

  } catch (error) {
    console.error("Signup error:", error);
    alert("Signup failed: " + error.message);
  }
}

// CONNECT SIGNUP BUTTON
const signupBtn = document.getElementById("signupBtn");
if (signupBtn) {
  signupBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const fullName = document.getElementById("fullName").value;
    const role = document.getElementById("role").value;
    const department = document.getElementById("department").value;

    signupUser(email, password, fullName, role, department);
  });
} else {
  console.error("Signup button not found (id=signupBtn)");
}
