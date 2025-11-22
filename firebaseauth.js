// firebaseauth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getFirestore, setDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// Firebase configuration
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
const auth = getAuth(app);  // ✅ Make sure this is here
const db = getFirestore(app);

// Signup function
async function signupUser(email, password, fullName, role, department) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);  // ✅ uses 'auth'
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: email,
      fullName: fullName,
      role: role,
      createdAt: serverTimestamp(),
      department: department || "",
      profilePicture: ""
    });

    alert("Signup successful!");

    // Redirect based on role
    if (role === "student") window.location.href = "uj-student.html";
    else if (role === "tutor") window.location.href = "uj-tutor.html";
    else if (role === "counsellor") window.location.href = "uj-counsellor.html";
    else if (role === "admin") window.location.href = "uj-admin.html";

  } catch (error) {
    console.error("Signup error:", error);
    alert("Error: " + error.message);
  }
}

// Attach signup button listener
const btn = document.getElementById("signupBtn");
if (btn) {
  btn.addEventListener("click", (e) => {
    e.preventDefault();  // Prevent default form submit
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

export { app, auth, db };
