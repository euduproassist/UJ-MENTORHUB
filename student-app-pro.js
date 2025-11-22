/* ============================================================ 
   student-portal-pro.js
   Complete Student Portal Frontend + Mock Backend
   Version: 1.0 (Hybrid AI–Material Design)
   ------------------------------------------------------------
   NOTE: This file is adapted from tutor-app-pro.js and implements
   only STUDENT features (frontend + mock local backend).
   UJ ONLY VERSION (WITS + UP REMOVED)
   ============================================================ */

(function () {
  "use strict";

  const APP_KEY = "university_student_portal_v1";

  /* ------------------------------------------------------------
     1.  UTILITIES
  ------------------------------------------------------------ */
  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));
  const el = (tag, attrs = {}, children = []) => {
    const node = document.createElement(tag);
    for (const k in attrs) {
      if (k === "class") node.className = attrs[k];
      else if (k === "style") Object.assign(node.style, attrs[k]);
      else node.setAttribute(k, attrs[k]);
    }
    (Array.isArray(children) ? children : [children]).forEach((c) => {
      if (typeof c === "string") node.appendChild(document.createTextNode(c));
      else if (c instanceof Node) node.appendChild(c);
    });
    return node;
  };

  const uid = (prefix = "") =>
    prefix + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);

  const load = (key, def = null) => {
    const s = JSON.parse(localStorage.getItem(APP_KEY) || "{}");
    return s[key] !== undefined ? s[key] : def;
  };
  const save = (key, val) => {
    const s = JSON.parse(localStorage.getItem(APP_KEY) || "{}");
    s[key] = val;
    localStorage.setItem(APP_KEY, JSON.stringify(s));
  };

  const delay = (ms) => new Promise((r) => setTimeout(r, ms));
  const fmtDate = (d) => new Date(d).toLocaleString();

  /* ------------------------------------------------------------
     UJ ONLY
  ------------------------------------------------------------ */
  const detectUni = () => "uj";


 import { getFirestore, collection, getDocs, doc, setDoc, addDoc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
const db = getFirestore(app);

const mockAPI = {
  async registerStudent(profile) {
    profile.id = profile.id || uid("student-");
    const ref = doc(db, "users", profile.id);
    await setDoc(ref, { ...profile, role: "student", createdAt: new Date().toISOString() });
    return { ok: true, student: profile };
  },

  async loginStudent({ email, studentNumber }) {
    const q = query(collection(db, "users"), where("email", "==", email));
    const snap = await getDocs(q);
    if (!snap.empty) return { ok: true, student: snap.docs[0].data() };
    return { ok: false, error: "Invalid credentials" };
  },

  async searchHelpers({ role = "tutor", query: qstr = "", module = "", type = "" } = {}) {
    const snap = await getDocs(collection(db, "users"));
    let list = snap.docs.map(d => d.data()).filter(u => u.role === role);
    if (qstr) list = list.filter(u => u.name.toLowerCase().includes(qstr.toLowerCase()));
    if (module) list = list.filter(u => (u.modules||"").toLowerCase().includes(module.toLowerCase()));
    if (type) list = list.filter(u => u.type === type);
    return list;
  },

  async sendRequest(request) {
    request.status = "Pending";
    request.createdAt = new Date().toISOString();
    const ref = await addDoc(collection(db, "requests"), request);
    return { ok: true, request: { ...request, id: ref.id } };
  },

  async fetchStudentRequests(studentId) {
    const q = query(collection(db, "requests"), where("studentId", "==", studentId), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id }));
  },

  async fetchNotificationsForStudent(studentId) {
    const snap = await getDocs(collection(db, "notifications"));
    return snap.docs.map(d => d.data()).filter(n => n.to === studentId || n.forStudent === studentId);
  },

  async submitRating(data) {
    await addDoc(collection(db, "ratings"), { ...data, date: new Date().toISOString() });
    return { ok: true };
  },

  async fetchHistory(studentId) {
    const reqSnap = await getDocs(query(collection(db, "requests"), where("studentId", "==", studentId)));
    const repSnap = await getDocs(query(collection(db, "reports"), where("studentId", "==", studentId)));
    return { requests: reqSnap.docs.map(d => d.data()), reports: repSnap.docs.map(d => d.data()) };
  }
};



   
  /* ------------------------------------------------------------
     3.  DASHBOARD UI
  ------------------------------------------------------------ */
  const buildUI = (student) => {
    const uni = "uj";
    const root = el("div", { class: "student-dashboard" });
    root.innerHTML = `
      <style>
        :root { --uj-main:#f36f21; --accent:#e8b500; }
        .student-dashboard {
          width:100%;max-width:1200px;margin:30px auto;
          display:flex;border-radius:16px;overflow:hidden;
          background:rgba(255,255,255,0.9);backdrop-filter:blur(12px);
          box-shadow:0 10px 35px rgba(0,0,0,.14);
        }
        .side {
          width:260px;background:linear-gradient(180deg,var(--uj-main),#111);
          color:#fff;display:flex;flex-direction:column;justify-content:space-between;
        }
        .side h2 { padding:20px;text-align:center;font-size:1.15rem;border-bottom:1px solid rgba(255,255,255,.12); }
        .side button { background:none;border:none;color:#fff;padding:12px 18px;text-align:left;cursor:pointer;width:100%;font-size:15px;border-bottom:1px solid rgba(255,255,255,.06); }
        .side button:hover, .side button.active { background:rgba(255,255,255,0.08); }
        .content { flex:1;padding:22px 30px;overflow-y:auto;max-height:calc(100vh - 80px); }
        .card { background:#fff;border-radius:10px;box-shadow:0 3px 12px rgba(0,0,0,.06);padding:16px;margin-bottom:16px; }
        .topbar { display:flex;justify-content:space-between;align-items:center;margin-bottom:12px; }
        input,textarea,select { width:100%;padding:8px 10px;margin:6px 0 12px 0;border-radius:6px;border:1px solid #ddd;font-size:14px; }
        button.action { padding:8px 12px;border-radius:6px;border:none;background:var(--uj-main);color:#fff;cursor:pointer; }
        .small { font-size:0.9rem;color:#666; }
        .helper-list { display:grid;grid-template-columns:1fr 1fr;gap:12px; }
        .helper { padding:10px;border-radius:8px;border:1px solid #eee;background:#fafafa; }
        .toast { position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:#222;color:#fff;padding:10px 20px;border-radius:6px;opacity:.96;z-index:9999; }
      </style>

      <div class="side">
        <div>
          <h2>${student?.name || 'Student Portal'}</h2>
          <button class="nav-btn active" data-view="search">🔎 Search Help</button>
          <button class="nav-btn" data-view="requests">📩 My Requests</button>
          <button class="nav-btn" data-view="sessions">📅 Active Sessions</button>
          <button class="nav-btn" data-view="notifications">🔔 Notifications</button>
          <button class="nav-btn" data-view="history">📚 History</button>
          <button class="nav-btn" data-view="profile">👤 Profile</button>
        </div>
        <div style="padding:12px;border-top:1px solid rgba(255,255,255,.06)">
          <button id="logoutBtn">🚪 Logout</button>
        </div>
      </div>

      <div class="content">
        <div class="topbar">
          <div>Welcome, <strong>${student.name || 'Student'}</strong></div>
          <div><button id="needNow" class="action">🚨 Need Help Now</button></div>
        </div>
        <div id="viewContainer"></div>
      </div>
    `;
    return root;
  };

  /* ------------------------------------------------------------
     4.  VIEWS (Same as your code, unchanged except uni removed)
  ------------------------------------------------------------ */
  const VIEWS = {
    async search(student) {
      const wrap = el('div');
      const card = el('div', { class: 'card' });
      card.append(el('h3', {}, 'Find a Tutor or Counsellor'));

      const roleSel = el('select', {}, [
        el('option', { value: 'tutor' }, 'Tutor'),
        el('option', { value: 'counsellor' }, 'Counsellor'),
      ]);
      const nameInput = el('input', { placeholder: 'Search by name' });
      const moduleInput = el('input', { placeholder: 'Module (e.g. ECO101)' });
      const typeSel = el('select', {}, [
        el('option', { value: '' }, 'Any service type'),
        el('option', { value: 'Personal' }, 'Personal'),
        el('option', { value: 'Academic' }, 'Academic'),
        el('option', { value: 'Mental' }, 'Mental'),
        el('option', { value: 'Financial' }, 'Financial'),
      ]);
      const searchBtn = el('button', { class: 'action' }, 'Search');

      const results = el('div', { style: { marginTop: '12px' } });

      const renderHelpers = (list) => {
        results.innerHTML = '';
        if (!list.length) return results.append(el('p', {}, 'No results found.'));
        const grid = el('div', { class: 'helper-list' });
        list.forEach(h => {
          const box = el('div', { class: 'helper' });
          box.innerHTML = `<b>${h.name}</b><br/><small class="small">${h.modules||''}</small><br/><small class="small">${h.bio||''}</small><br/>`;
          const reqBtn = el('button', { class: 'action', style: { marginTop: '8px' } }, 'Request Session');
          reqBtn.onclick = () => openRequestModal(student, h);
          box.append(reqBtn);
          grid.append(box);
        });
        results.append(grid);
      };

      searchBtn.onclick = async () => {
        const list = await mockAPI.searchHelpers({ role: roleSel.value, query: nameInput.value, module: moduleInput.value, type: typeSel.value });
        renderHelpers(list);
      };

      const recommended = el('div', { class: 'card' });
      recommended.append(el('h4', {}, 'Recommended Helpers'));
      const recList = el('div');
      recommended.append(recList);
      (async () => {
        const all = await mockAPI.searchHelpers({ role: 'tutor' });
        const first = all.slice(0,6);
        recList.innerHTML = '';
        first.forEach(h => {
          const r = el('div', { style: { padding: '8px 0', borderBottom: '1px solid #eee' } }, [
            el('div', {}, `${h.name} — ${h.modules || ''}`),
            el('div', { style: { marginTop: '6px' } }, [
              el('button', { class: 'action' }, 'Request')
            ])
          ]);
          r.querySelector('button').onclick = () => openRequestModal(student, h);
          recList.append(r);
        });
      })();

      card.append(roleSel, nameInput, moduleInput, typeSel, searchBtn, results);
      wrap.append(card, recommended);
      return wrap;
    },

    async requests(student) {
      const wrap = el('div');
      const list = el('div');
      const refresh = async () => {
        const reqs = await mockAPI.fetchStudentRequests(student.id);
        list.innerHTML = '';
        if (!reqs.length) return list.append(el('p', {}, 'You have not sent any requests.'));
        reqs.forEach(r => {
          const c = el('div', { class: 'card' });
          c.innerHTML = `<b>${r.helperName}</b> — ${r.module || ''}<br/><small>${fmtDate(r.datetime)} | ${r.mode}</small><br/><small>Status: ${r.status}</small>`;
          if (r.status === 'Pending') {
            const cancel = el('button', { class: 'action', style: { marginTop: '8px', background: '#999' } }, 'Cancel Request');
            cancel.onclick = async () => {
              const reqs = load('requests', []);
              const i = reqs.findIndex(x=> x.id === r.id);
              if (i>=0) { reqs.splice(i,1); save('requests', reqs); showToast('Request cancelled'); refresh(); }
            };
            c.append(cancel);
          }
          if (r.status === 'Approved') {
            const join = el('button', { class: 'action', style: { marginTop: '8px' } }, 'Join Session');
            join.onclick = () => openJoinView(r);
            c.append(join);
          }
          list.append(c);
        });
      };
      refresh();
      wrap.append(list);
      return wrap;
    },

    async sessions(student) {
      const wrap = el('div');
      const reqs = (await mockAPI.fetchStudentRequests(student.id)).filter(r => r.status === 'Approved');
      if (!reqs.length) wrap.append(el('p', {}, 'No active/approved sessions.'));
      reqs.forEach(r => {
        const c = el('div', { class: 'card' });
        c.innerHTML = `<b>${r.helperName}</b><br/>${fmtDate(r.datetime)} | ${r.mode}<br/><small>${r.location||r.link||''}</small>`;
        const join = el('button', { class: 'action', style: { marginTop: '8px' } }, 'Join Session');
        join.onclick = () => openJoinView(r);
        c.append(join);
        wrap.append(c);
      });
      return wrap;
    },

    async notifications(student) {
      const wrap = el('div');
      const notes = await mockAPI.fetchNotificationsForStudent(student.id);
      if (!notes.length) wrap.append(el('p', {}, 'No notifications.'));
      notes.forEach(n => {
        const c = el('div', { class: 'card' });
        c.innerHTML = `<div>${n.message || ''}</div><small class='small'>${fmtDate(n.date)}</small>`;
        wrap.append(c);
      });
      return wrap;
    },

    async history(student) {
      const wrap = el('div');
      const h = await mockAPI.fetchHistory(student.id);
      const reqs = h.requests || [];
      const reports = h.reports || [];
      const box = el('div', { class: 'card' });
      box.append(el('h3', {}, 'Past Sessions'));
      if (!reqs.length) box.append(el('p', {}, 'No past sessions.'));
      reqs.filter(r => r.status === 'Completed' || r.status === 'Declined' || r.status === 'Cancelled').forEach(r => {
        const c = el('div', { style: { padding: '8px 0', borderBottom: '1px solid #eee' } });
        c.innerHTML = `<b>${r.helperName}</b> — ${r.module||''}<br/><small>${fmtDate(r.datetime)} | ${r.status}</small>`;
        box.append(c);
      });
      const repBox = el('div', { class: 'card' });
      repBox.append(el('h3', {}, 'Reports from Helpers'));
      if (!reports.length) repBox.append(el('p', {}, 'No reports yet.'));
      reports.forEach(r => {
        const c = el('div', { style: { padding: '8px 0', borderBottom: '1px solid #eee' } });
        c.innerHTML = `<b>${r.helperName || ''}</b><br/><b>Topics:</b> ${r.topics||''}<br/><small>${fmtDate(r.date)}</small>`;
        repBox.append(c);
      });
      wrap.append(box, repBox);
      return wrap;
    },

    profile(student) {
      const form = el('div', { class: 'card' });
      form.append(el('h3', {}, 'Edit Profile'));
      const name = el('input', { value: student.name || '', placeholder: 'Full name' });
      const email = el('input', { value: student.email || '', placeholder: 'Email' });
      const sn = el('input', { value: student.studentNumber || '', placeholder: 'Student number' });
      const photo = el('input', { placeholder: 'Photo URL (optional)' });
      const saveBtn = el('button', { class: 'action' }, 'Save Profile');
      saveBtn.onclick = async () => {
        Object.assign(student, { name: name.value, email: email.value, studentNumber: sn.value, photo: photo.value });
        await mockAPI.registerStudent(student);
        save('currentStudent', student);
        showToast('Profile saved');
      };
      form.append(name, email, sn, photo, saveBtn);
      return form;
    }
  };

  /* ------------------------------------------------------------
     5.  MODALS
  ------------------------------------------------------------ */
  function openRequestModal(student, helper) {
    const overlay = el('div', { style: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 } });
    const box = el('div', { style: { background: '#fff', padding: '18px', borderRadius: '10px', width: '420px', maxWidth: '94%' } });
    const datetime = el('input', { type: 'datetime-local' });
    const mode = el('select', {}, [ el('option', { value: 'Online' }, 'Online'), el('option', { value: 'In-Person' }, 'In-Person') ]);
    const module = el('input', { placeholder: 'Module (optional)' });
    const msg = el('textarea', { placeholder: 'Optional message to the helper' });
    const send = el('button', { class: 'action' }, 'Send Request');
    send.onclick = async () => {
      const req = {
        studentId: student.id,
        studentName: student.name,
        tutorId: helper.id,
        helperId: helper.id,
        helperName: helper.name,
        module: module.value,
        datetime: datetime.value || new Date().toISOString(),
        mode: mode.value,
        message: msg.value,
        status: 'Pending'
      };
      await mockAPI.sendRequest(req);
      showToast('Request sent');
      overlay.remove();
    };
    box.append(el('h3', {}, `Request: ${helper.name}`), module, datetime, mode, msg, send);
    overlay.append(box);
    document.body.append(overlay);
  }

  function openJoinView(request) {
    const overlay = el('div', { style: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 } });
    const box = el('div', { style: { background: '#fff', padding: '18px', borderRadius: '10px', width: '420px', maxWidth: '94%' } });
    const info = el('div', {}, [`<b>${request.helperName}</b><br/>${fmtDate(request.datetime)}<br/>${request.mode}<br/>`]);
    const joinBtn = el('button', { class: 'action' }, 'Open Meeting Link');
    joinBtn.onclick = () => {
      if (request.link) window.open(request.link, '_blank');
      else showToast('No meeting link available — contact helper');
    };
    const rateBtn = el('button', { class: 'action', style: { marginLeft: '8px' } }, 'Rate Session');
    rateBtn.onclick = () => { overlay.remove(); openRatingModal(request); };
    box.append(el('h3', {}, 'Session Details'), info, joinBtn, rateBtn);
    overlay.append(box);
    document.body.append(overlay);
  }

  function openRatingModal(request) {
    const overlay = el('div', { style: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 } });
    const box = el('div', { style: { background: '#fff', padding: '18px', borderRadius: '10px', width: '420px', maxWidth: '94%' } });
    const stars = el('input', { type: 'number', placeholder: 'Rating (1-5)', min: 1, max: 5 });
    const comment = el('textarea', { placeholder: 'Leave a comment' });
    const submit = el('button', { class: 'action' }, 'Submit Rating');
    submit.onclick = async () => {
      await mockAPI.submitRating({ studentId: request.studentId, tutorId: request.tutorId, rating: Number(stars.value) || 5, comment: comment.value, date: new Date().toISOString() });
      showToast('Thanks for rating');
      overlay.remove();
    };
    box.append(el('h3', {}, 'Rate the Session'), stars, comment, submit);
    overlay.append(box);
    document.body.append(overlay);
  }

  function showToast(msg) {
    const t = el('div', { class: 'toast' }, msg);
    document.body.append(t);
    setTimeout(() => t.remove(), 2400);
  }

  /* ------------------------------------------------------------
     6.  INIT
  ------------------------------------------------------------ */
  async function init() {
    const uni = "uj";
    const cont = qs('.portal-container') || document.body;
    let student = load('currentStudent');

    if (!student) {
      const name = prompt('Enter your full name to start (or cancel to use demo):');
      const email = prompt('Enter email (or leave blank):');
      if (name) {
        student = { id: uid('student-'), name, email, university: uni };
        save('currentStudent', student);
        await mockAPI.registerStudent(student);
      } else {
        student = { id: uid('student-'), name: 'Demo Student', email: '', university: uni };
        save('currentStudent', student);
        await mockAPI.registerStudent(student);
      }
    }

    cont.innerHTML = '';
    const ui = buildUI(student);
    cont.append(ui);

    const content = ui.querySelector('#viewContainer');
    const navs = ui.querySelectorAll('.nav-btn');

    const renderView = async (v) => {
      navs.forEach((n) => n.classList.toggle('active', n.dataset.view === v));
      content.innerHTML = '';
      const view = await VIEWS[v](student);
      content.append(view);
    };

    renderView('search');
    navs.forEach((n) => (n.onclick = () => renderView(n.dataset.view)));

    ui.querySelector('#needNow').onclick = async () => {
      const helpers = await mockAPI.searchHelpers({ role: 'tutor' });
      const available = helpers.find(h => h.availableNow);
      if (!available) return showToast('No helpers available right now.');
      const req = {
        studentId: student.id,
        studentName: student.name,
        tutorId: available.id,
        helperId: available.id,
        helperName: available.name,
        module: '',
        datetime: new Date().toISOString(),
        mode: 'Online',
        message: 'Need help now',
        status: 'Pending'
      };
      await mockAPI.sendRequest(req);
      showToast('Immediate request sent');
    };

    ui.querySelector('#logoutBtn').onclick = () => { localStorage.removeItem('currentStudent'); location.reload(); };

  }

  document.addEventListener('DOMContentLoaded', init);
})();
