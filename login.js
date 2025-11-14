// single allowed credentials
const VALID_USERNAME = "ujcounsellor";
const VALID_PASSWORD = "12345";

document.getElementById("loginBtn").addEventListener("click", () => {
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value;
  if (user === VALID_USERNAME && pass === VALID_PASSWORD) {
    // set local auth flag, optionally store minimal session info
    localStorage.setItem("uj_auth", "true");
    // create a default counsellor record if not present (so portal has data)
    if (!localStorage.getItem("university_counselling_portal_v1")) {
      // create a basic counsellor seeded (id same used in mock API)
      const seed = {
        counsellors: {},
        requests: [],
        calendar: [],
        videos: [],
        reports: [],
        reminders: [],
        ratings: []
      };
      const id = "counsellor-seed-1";
      seed.counsellors[id] = {
        id,
        name: "UJ Counsellor",
        email: "counsellor@uj.ac.za",
        university: "uj",
        availableNow: false,
        photo: "",
        qualifications: "",
        services: "",
        bio: "",
        specialities: ""
      };
      localStorage.setItem("university_counselling_portal_v1", JSON.stringify(seed));
      // store currentCounsellor separately for convenience (used by the app)
      localStorage.setItem("currentCounsellor", JSON.stringify(seed.counsellors[id]));
    }
    window.location.href = "counselling.html";
  } else {
    alert("Invalid credentials. Use username: ujcounsellor password: 12345");
  }
});

// allow Enter key to submit
document.addEventListener("keydown", (e) => {
  if ((e.key === "Enter" || e.keyCode === 13) && document.activeElement.tagName === "INPUT") {
    document.getElementById("loginBtn").click();
  }
});
