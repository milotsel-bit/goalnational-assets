import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDJI_faTALfP8qi6zux-nR2iXNNFg8VEy8",
  authDomain: "goalnational-8e530.firebaseapp.com",
  projectId: "goalnational-8e530",
  storageBucket: "goalnational-8e530.firebasestorage.app",
  messagingSenderId: "20510823365",
  appId: "1:20510823365:web:88befea42cd66d6b2bb1ac",
  measurementId: "G-7NM3P07ZGV"
};

const CSS_URL =
  "https://cdn.jsdelivr.net/gh/milotsel-bit/goalnational-assets@main/goal-auth.css";

function loadStylesheet() {
  if (document.querySelector('link[data-gn-auth-css="true"]')) return;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = CSS_URL;
  link.dataset.gnAuthCss = "true";
  document.head.appendChild(link);
}

function injectInterface() {
  if (document.getElementById("gnMemberButton")) return;

  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <button id="gnMemberButton" type="button">Login / Goal Pro</button>

      <div id="gnAuthOverlay" aria-hidden="true">
        <div id="gnAuthBox" role="dialog" aria-modal="true" aria-labelledby="gnAuthTitle">
          <button id="gnAuthClose" type="button" aria-label="Close">&times;</button>

          <div id="gnAuthForms">
            <h2 id="gnAuthTitle">Welcome back</h2>
            <p id="gnAuthSubtitle">Log in to your GoalNational account.</p>

            <input id="gnName" class="gnAuthInput" type="text"
              placeholder="Your name" autocomplete="name" style="display:none;" />

            <input id="gnEmail" class="gnAuthInput" type="email"
              placeholder="Email address" autocomplete="email" />

            <input id="gnPassword" class="gnAuthInput" type="password"
              placeholder="Password" autocomplete="current-password" />

            <button id="gnEmailAction" class="gnPrimaryButton" type="button">
              Log in
            </button>

            <button id="gnGoogleLogin" class="gnGoogleButton" type="button">
              Continue with Google
            </button>

            <div id="gnAuthSwitch">
              <span id="gnSwitchText">No account?</span>
              <button id="gnSwitchMode" type="button">Create one</button>
            </div>
          </div>

          <div id="gnMemberArea">
            <img id="gnMemberPhoto" alt="Profile"
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/default-avatar.png" />

            <div id="gnMemberName">GoalNational Member</div>
            <div id="gnMemberEmail"></div>
            <div id="gnMembershipBadge">FREE MEMBER</div>

            <a id="gnUpgradeButton" href="#">
              Upgrade to GoalNational Pro
            </a>

            <button id="gnLogoutButton" class="gnLogoutButton" type="button">
              Log out
            </button>
          </div>

          <div id="gnAuthMessage"></div>
        </div>
      </div>
    `
  );
}

function startMemberSystem() {
  loadStylesheet();
  injectInterface();

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const googleProvider = new GoogleAuthProvider();

  const memberButton = document.getElementById("gnMemberButton");
  const overlay = document.getElementById("gnAuthOverlay");
  const closeButton = document.getElementById("gnAuthClose");
  const forms = document.getElementById("gnAuthForms");
  const memberArea = document.getElementById("gnMemberArea");
  const title = document.getElementById("gnAuthTitle");
  const subtitle = document.getElementById("gnAuthSubtitle");
  const nameInput = document.getElementById("gnName");
  const emailInput = document.getElementById("gnEmail");
  const passwordInput = document.getElementById("gnPassword");
  const emailAction = document.getElementById("gnEmailAction");
  const googleLogin = document.getElementById("gnGoogleLogin");
  const switchModeButton = document.getElementById("gnSwitchMode");
  const switchText = document.getElementById("gnSwitchText");
  const logoutButton = document.getElementById("gnLogoutButton");
  const memberPhoto = document.getElementById("gnMemberPhoto");
  const memberName = document.getElementById("gnMemberName");
  const memberEmail = document.getElementById("gnMemberEmail");
  const membershipBadge = document.getElementById("gnMembershipBadge");
  const upgradeButton = document.getElementById("gnUpgradeButton");
  const messageBox = document.getElementById("gnAuthMessage");

  let registerMode = false;

  function openModal() {
    overlay.style.display = "flex";
    overlay.setAttribute("aria-hidden", "false");
    clearMessage();
  }

  function closeModal() {
    overlay.style.display = "none";
    overlay.setAttribute("aria-hidden", "true");
    clearMessage();
  }

  function showMessage(message, success = false) {
    messageBox.style.display = "block";
    messageBox.textContent = message;
    messageBox.style.background = success ? "#14532d" : "#7f1d1d";
    messageBox.style.color = "#fff";
  }

  function clearMessage() {
    messageBox.style.display = "none";
    messageBox.textContent = "";
  }

  function setBusy(busy) {
    emailAction.disabled = busy;
    googleLogin.disabled = busy;
    emailAction.style.opacity = busy ? ".6" : "1";
    googleLogin.style.opacity = busy ? ".6" : "1";
  }

  function setMode(isRegister) {
    registerMode = isRegister;
    clearMessage();

    if (isRegister) {
      title.textContent = "Create an account";
      subtitle.textContent = "Join GoalNational and unlock member features.";
      nameInput.style.display = "block";
      passwordInput.autocomplete = "new-password";
      emailAction.textContent = "Create account";
      switchText.textContent = "Already registered?";
      switchModeButton.textContent = "Log in";
    } else {
      title.textContent = "Welcome back";
      subtitle.textContent = "Log in to your GoalNational account.";
      nameInput.style.display = "none";
      passwordInput.autocomplete = "current-password";
      emailAction.textContent = "Log in";
      switchText.textContent = "No account?";
      switchModeButton.textContent = "Create one";
    }
  }

  async function createBasicProfile(user, suppliedName = "") {
    const userRef = doc(db, "users", user.uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      await setDoc(userRef, {
        email: user.email || "",
        displayName: suppliedName || user.displayName || "",
        photoURL: user.photoURL || "",
        createdAt: serverTimestamp()
      });
    }
  }

  async function loadMembership(user) {
    document.body.classList.remove("gn-pro-member");

    const snapshot = await getDoc(doc(db, "users", user.uid));
    const data = snapshot.exists() ? snapshot.data() : {};

    const isPremium =
      data.premium === true &&
      data.subscriptionStatus === "ACTIVE";

    memberName.textContent =
      user.displayName || data.displayName || "GoalNational Member";

    memberEmail.textContent = user.email || data.email || "";

    memberPhoto.src =
      user.photoURL ||
      data.photoURL ||
      "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/default-avatar.png";

    if (isPremium) {
      membershipBadge.textContent = "GOALNATIONAL PRO";
      membershipBadge.style.background = "#f59e0b";
      membershipBadge.style.color = "#111827";
      upgradeButton.style.display = "none";
      document.body.classList.add("gn-pro-member");
    } else {
      membershipBadge.textContent = "FREE MEMBER";
      membershipBadge.style.background = "#374151";
      membershipBadge.style.color = "#fff";
      upgradeButton.style.display = "block";
    }
  }

  memberButton.addEventListener("click", openModal);
  closeButton.addEventListener("click", closeModal);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && overlay.style.display === "flex") {
      closeModal();
    }
  });

  switchModeButton.addEventListener("click", () => {
    setMode(!registerMode);
  });

  emailAction.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const suppliedName = nameInput.value.trim();

    if (!email || !password) {
      showMessage("Enter your email address and password.");
      return;
    }

    if (registerMode && !suppliedName) {
      showMessage("Enter your name.");
      return;
    }

    if (registerMode && password.length < 6) {
      showMessage("Your password must contain at least 6 characters.");
      return;
    }

    setBusy(true);
    clearMessage();

    try {
      if (registerMode) {
        const credential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        await updateProfile(credential.user, {
          displayName: suppliedName
        });

        await createBasicProfile(credential.user, suppliedName);
        showMessage("Your account was created successfully.", true);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }

      emailInput.value = "";
      passwordInput.value = "";
      nameInput.value = "";
    } catch (error) {
      console.error(error);

      const messages = {
        "auth/email-already-in-use": "This email address is already registered.",
        "auth/invalid-email": "Enter a valid email address.",
        "auth/invalid-credential": "The email address or password is incorrect.",
        "auth/weak-password": "Choose a stronger password.",
        "auth/too-many-requests": "Too many attempts. Please wait and try again.",
        "auth/operation-not-allowed": "This login method is not enabled in Firebase."
      };

      showMessage(messages[error.code] || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  });

  googleLogin.addEventListener("click", async () => {
    setBusy(true);
    clearMessage();

    try {
      const credential = await signInWithPopup(auth, googleProvider);
      await createBasicProfile(credential.user);
    } catch (error) {
      console.error(error);

      if (error.code !== "auth/popup-closed-by-user") {
        showMessage(
          error.code === "auth/unauthorized-domain"
            ? "Add goalnational.com and www.goalnational.com to Firebase Authorized domains."
            : "Google login could not be completed."
        );
      }
    } finally {
      setBusy(false);
    }
  });

  logoutButton.addEventListener("click", async () => {
    try {
      await signOut(auth);
      closeModal();
    } catch (error) {
      console.error(error);
      showMessage("Logout could not be completed.");
    }
  });

  upgradeButton.addEventListener("click", (event) => {
    event.preventDefault();
    alert("GoalNational Pro payments will be connected in the next step.");
  });

  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error("Persistence error:", error);
  });

  onAuthStateChanged(auth, async (user) => {
    clearMessage();

    if (user) {
      try {
        await createBasicProfile(user);
        await loadMembership(user);

        forms.style.display = "none";
        memberArea.style.display = "block";
        memberButton.textContent = user.displayName || "My Account";
      } catch (error) {
        console.error(error);
        showMessage("Your profile could not be loaded.");
      }
    } else {
      document.body.classList.remove("gn-pro-member");
      forms.style.display = "block";
      memberArea.style.display = "none";
      memberButton.textContent = "Login / Goal Pro";
      setMode(false);
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startMemberSystem);
} else {
  startMemberSystem();
}
