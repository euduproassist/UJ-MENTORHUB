/* ------------------------------------------------------------
   REAL FIREBASE COUNSELLOR PORTAL (PART 1)
------------------------------------------------------------ */

import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  addDoc,
} from "firebase/firestore";

const auth = getAuth();
const db = getFirestore();

/* ------------------------------------------------------------
   UTILS
------------------------------------------------------------ */
function el(tag, attrs = {}, children = []) {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === "style") Object.assign(e.style, v);
    else if (k === "class") e.className = v;
    else e[k] = v;
  });
  if (!Array.isArray(children)) children = [children];
  children.forEach((c) => {
    if (typeof c === "string") e.appendChild(document.createTextNode(c));
    else e.appendChild(c);
  });
  return e;
}

function fmtDate(dt) {
  return new Date(dt).toLocaleString([], { dateStyle: "short", timeStyle: "short" });
}

function showToast(msg) {
  const t = el("div", { className: "toast" }, msg);
  document.body.append(t);
  setTimeout(() => t.remove(), 2500);
}

/* ------------------------------------------------------------
   1. LOAD COUNSELLOR PROFILE
------------------------------------------------------------ */
async function loadCounsellor(uid) {
  const docRef = doc(db, "counsellors", uid);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    console.error("Counsellor profile not found!");
    return null;
  }
  return { uid, ...docSnap.data() };
}

/* ------------------------------------------------------------
   2. REAL-TIME APPOINTMENTS LISTENER
------------------------------------------------------------ */
function listenAppointments(counsellorUid, callback) {
  const appointmentsRef = collection(db, "appointments");
  const q = query(
    appointmentsRef,
    where("counsellorId", "==", counsellorUid),
    orderBy("datetime", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const appointments = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(appointments);
  });
}

/* ------------------------------------------------------------
   3. UPDATE APPOINTMENT STATUS
------------------------------------------------------------ */
async function updateAppointmentStatus(appointmentId, status) {
  const docRef = doc(db, "appointments", appointmentId);
  await updateDoc(docRef, { status });
  showToast(`Appointment ${status}`);
}

/* ------------------------------------------------------------
   4. CREATE SESSION NOTE
------------------------------------------------------------ */
async function submitSessionNote(note) {
  const notesRef = collection(db, "session_notes");
  await addDoc(notesRef, note);
  showToast("Session notes saved");
}

/* ------------------------------------------------------------
   5. AVAILABILITY TOGGLE
------------------------------------------------------------ */
async function toggleAvailability(counsellorUid, available) {
  const docRef = doc(db, "counsellors", counsellorUid);
  await updateDoc(docRef, { availableNow: available });
  showToast(`You are now ${available ? "Available" : "Offline"}`);
}

/* ------------------------------------------------------------
   6. UI: APPOINTMENTS VIEW
------------------------------------------------------------ */
function renderAppointments(counsellor, appointments) {
  const list = el("div");

  if (!appointments.length) {
    list.textContent = "No counselling requests yet.";
    return list;
  }

  appointments.forEach((r) => {
    const card = el("div", { className: "card" });
    const studName = r.anonymous ? "Anonymous Student" : r.studentName || "Student";

    card.innerHTML = `
      <b>${studName}</b> - ${r.reason || "—"}<br/>
      <small>${fmtDate(r.datetime)} | ${r.mode}</small><br/>
      <small>Status: ${r.status}</small>
    `;

    const btns = el("div");
    ["Approve", "Reject", "Suggest", "Join"].forEach((a) => {
      const b = el("button", { className: "action", style: { margin: "6px 6px 6px 0" } }, a);
      b.onclick = async () => {
        if (a === "Approve") await updateAppointmentStatus(r.id, "Approved");
        else if (a === "Reject") await updateAppointmentStatus(r.id, "Rejected");
        else if (a === "Suggest") {
          const s = prompt("Suggest new time (YYYY-MM-DD HH:MM)");
          if (!s) return;
          const docRef = doc(db, "appointments", r.id);
          await updateDoc(docRef, { status: "Suggested", suggestedTime: new Date(s).toISOString() });
          showToast("Time suggested");
        } else if (a === "Join") {
          openJoinDialog(r, counsellor); // implemented in next half
        }
      };
      btns.append(b);
    });

    // profile quick link
    if (!r.anonymous && r.studentId) {
      const prof = el("button", { className: "action", style: { marginLeft: "8px", background: "#888" } }, "Student Profile");
      prof.onclick = () => alert(`Open student profile: ${r.studentId} (placeholder)`);
      btns.append(prof);
    }

    card.append(btns);
    list.append(card);
  });

  return list;
}

/* ------------------------------------------------------------
   7. INIT PORTAL (AUTH + DATA LOAD)
------------------------------------------------------------ */
function initCounsellorPortal() {
  const cont = document.querySelector(".portal-container") || document.body;
  cont.innerHTML = "Loading...";

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      location.href = "/uj-counsellor.html"; // redirect to login
      return;
    }

    const counsellor = await loadCounsellor(user.uid);
    if (!counsellor) return;

    // Main container
    cont.innerHTML = "";
    const header = el("h2", {}, `Welcome, ${counsellor.fullName}`);
    cont.append(header);

    // Availability toggle
    const toggleBtn = el("button", { className: "action" }, counsellor.availableNow ? "Go Offline" : "Set Available Now");
    toggleBtn.onclick = async () => {
      await toggleAvailability(counsellor.uid, !counsellor.availableNow);
      initCounsellorPortal(); // reload UI
    };
    cont.append(toggleBtn);

    // Appointments container
    const appContainer = el("div", { id: "appointmentsList" }, "Loading appointments...");
    cont.append(appContainer);

    // Real-time listener
    listenAppointments(counsellor.uid, (appointments) => {
      appContainer.innerHTML = "";
      appContainer.append(renderAppointments(counsellor, appointments));
    });
  });
}

/* ------------------------------------------------------------
   8. BOOT
------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", initCounsellorPortal);
/* ------------------------------------------------------------
   REAL FIREBASE COUNSELLOR PORTAL (PART 2)
------------------------------------------------------------ */

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  onSnapshot,
  orderBy
} from "firebase/firestore";

/* ------------------------------------------------------------
   1. RENDER CALENDAR VIEW (APPROVED APPOINTMENTS)
------------------------------------------------------------ */
function renderCalendar(counsellor) {
  const wrap = el("div");
  wrap.append(el("h3", {}, "Weekly Calendar"));

  const grid = el("div", { className: "calendar-grid" });
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const appointmentsRef = collection(db, "appointments");
  const q = query(
    appointmentsRef,
    where("counsellorId", "==", counsellor.uid),
    where("status", "==", "Approved")
  );

  onSnapshot(q, (snapshot) => {
    const cal = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    grid.innerHTML = "";

    days.forEach((d, i) => {
      const cell = el("div", { className: "cal-cell" });
      const items = cal.filter((ev) => new Date(ev.datetime).getDay() === i);

      cell.append(el("b", {}, d));
      if (!items.length) cell.append(el("div", { className: "small muted" }, "No events"));

      items.forEach((it) => {
        const e = el("div", {}, [
          el("div", { style: { marginTop: "8px" } }, `${new Date(it.datetime).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })} — ${it.reason || ""}`),
          el("div", { className: "small" }, `${it.mode} | ${fmtDate(it.datetime)}`),
          el("button", { className: "action", style: { marginTop: "6px" } }, "Open")
        ]);

        e.querySelector("button").onclick = async () => {
          openJoinDialog(it, counsellor);
        };

        cell.append(e);
      });

      grid.append(cell);
    });
  });

  wrap.append(grid);
  return wrap;
}

/* ------------------------------------------------------------
   2. SESSION NOTES MODAL
------------------------------------------------------------ */
function openSessionNotesModal(appointment, counsellor) {
  const overlay = el("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 } });
  const box = el("div", { style: { background: "#fff", padding: "20px", borderRadius: "10px", width: "520px", maxWidth: "95%" } });

  const summary = el("textarea", { placeholder: "Session summary" });
  const recommendations = el("textarea", { placeholder: "Recommendations / follow-up" });
  const saveBtn = el("button", { className: "action" }, "Save Notes");

  saveBtn.onclick = async () => {
    await addDoc(collection(db, "session_notes"), {
      appointmentId: appointment.id,
      counsellorId: counsellor.uid,
      studentName: appointment.studentName,
      summary: summary.value,
      recommendations: recommendations.value,
      timestamp: new Date().toISOString()
    });
    showToast("Session notes saved");
    overlay.remove();
  };

  box.append(el("h3", {}, "Session Notes"), summary, recommendations, saveBtn);
  overlay.append(box);
  document.body.append(overlay);
}

/* ------------------------------------------------------------
   3. VIDEO RESOURCES
------------------------------------------------------------ */
function renderVideos(counsellor) {
  const wrap = el("div");
  const vidsRef = collection(db, "videos");
  const q = query(vidsRef, where("counsellorId", "==", counsellor.uid), orderBy("date", "desc"));

  const addBtn = el("button", { className: "action", style: { marginBottom: "12px" } }, "Upload Resource");
  addBtn.onclick = () => openVideoModal(counsellor);

  wrap.append(addBtn);

  onSnapshot(q, (snapshot) => {
    wrap.querySelectorAll(".card").forEach((c) => c.remove());
    snapshot.docs.forEach((v) => {
      const data = v.data();
      const card = el("div", { className: "card" });
      card.innerHTML = `<b>${data.title}</b><br/><small>${data.desc}</small><br/>
        <video src="${data.url}" controls width="100%" style="margin-top:8px;border-radius:8px;"></video>
        <div class="small muted">Uploaded: ${fmtDate(data.date)}</div>`;
      wrap.append(card);
    });
  });

  return wrap;
}

function openVideoModal(counsellor) {
  const overlay = el("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 } });
  const box = el("div", { style: { background: "#fff", padding: "20px", borderRadius: "10px", width: "480px", maxWidth: "95%" } });

  const title = el("input", { placeholder: "Resource title" });
  const desc = el("textarea", { placeholder: "Description" });
  const url = el("input", { placeholder: "Video / Resource URL" });
  const saveBtn = el("button", { className: "action" }, "Save Resource");

  saveBtn.onclick = async () => {
    await addDoc(collection(db, "videos"), {
      counsellorId: counsellor.uid,
      title: title.value,
      desc: desc.value,
      url: url.value,
      date: new Date().toISOString()
    });
    showToast("Resource added");
    overlay.remove();
  };

  box.append(el("h3", {}, "Upload Resource"), title, desc, url, saveBtn);
  overlay.append(box);
  document.body.append(overlay);
}

/* ------------------------------------------------------------
   4. PROFILE EDITING
------------------------------------------------------------ */
function renderProfile(counsellor) {
  const form = el("div", { className: "card" });
  form.append(el("h3", {}, "Edit Profile"));

  const name = el("input", { value: counsellor.fullName || "", placeholder: "Full Name" });
  const department = el("input", { value: counsellor.department || "", placeholder: "Department" });
  const bio = el("textarea", {}, counsellor.bio || "");
  const photo = el("input", { value: counsellor.photoURL || "", placeholder: "Profile Picture URL" });

  const saveBtn = el("button", { className: "action" }, "Save");

  saveBtn.onclick = async () => {
    const docRef = doc(db, "counsellors", counsellor.uid);
    await updateDoc(docRef, {
      fullName: name.value,
      department: department.value,
      bio: bio.value,
      photoURL: photo.value
    });
    showToast("Profile saved");
  };

  form.append(name, department, bio, photo, saveBtn);
  return form;
}

/* ------------------------------------------------------------
   5. JOIN SESSION DIALOG
------------------------------------------------------------ */
function openJoinDialog(appointment, counsellor) {
  const overlay = el("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 } });
  const box = el("div", { style: { background: "#fff", padding: "18px", borderRadius: "10px", width: "520px", maxWidth: "95%" } });

  const links = appointment.joinLinks || {
    zoom: `https://zoom.us/${appointment.id}`,
    teams: `https://teams.microsoft.com/${appointment.id}`,
    meet: `https://meet.google.com/${appointment.id}`
  };

  const title = el("h3", {}, `Session: ${appointment.studentName || "Student"} — ${appointment.reason || ""}`);
  const info = el("div", {}, [
    el("div", { className: "small muted" }, `Time: ${fmtDate(appointment.datetime)}`),
    el("div", { className: "small muted" }, `Mode: ${appointment.mode || "Online"}`)
  ]);

  const openZoom = el("button", { className: "action" }, `Open Zoom`);
  openZoom.onclick = () => window.open(links.zoom, "_blank");

  const openTeams = el("button", { className: "action", style: { marginLeft: "8px", background: "#2f6f90" } }, "Open Teams");
  openTeams.onclick = () => window.open(links.teams, "_blank");

  const openMeet = el("button", { className: "action", style: { marginLeft: "8px", background: "#3aa1f2" } }, "Open Meet");
  openMeet.onclick = () => window.open(links.meet, "_blank");

  const hostBtn = el("button", { className: "action", style: { marginTop: "12px", background: "#0a7d3a" } }, "Start Session");
  hostBtn.onclick = async () => {
    await updateDoc(doc(db, "appointments", appointment.id), { status: "In-Session" });
    showToast("Session started");
    overlay.remove();
  };

  box.append(title, info, openZoom, openTeams, openMeet, hostBtn);
  overlay.append(box);
  document.body.append(overlay);
}

