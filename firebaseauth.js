
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
  import {getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
  import {getFirestore, setDoc,doc} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
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

function signupUser(email, password, fullName, role, department) {
  createUserWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {
      const user = userCredential.user;

      // Save user info in Firestore
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
      if (role === "student") {
        window.location.href = "uj-student.html";
      } else if (role === "tutor") {
        window.location.href = "uj-tutor.html";
      } else if (role === "counsellor") {
        window.location.href = "uj-counsellor.html";
      } else if (role === "admin") {
        window.location.href = "uj-admin.html";
      }
    })
    .catch((error) => {
      alert(error.message);
    });
}

document.getElementById("signupBtn").addEventListener("click", () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const fullName = document.getElementById("fullName").value;
  const role = document.getElementById("role").value;
  const department = document.getElementById("department").value;

  signupUser(email, password, fullName, role, department);
});
