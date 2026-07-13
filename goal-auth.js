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
  clearMessage();
}

function closeModal() {
  overlay.style.display = "none";
  clearMessage();
}

function showMessage(message, success = false) {
  messageBox.style.display = "block";
  messageBox.textContent = message;
  messageBox.style.background = success ? "#14532d" : "#7f1d1d";
  messageBox.style.color = "#ffffff";
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
    switchModeButton.textContent = "Log in";
    document.getElementById("gnSwitchText").textContent = "Already registered?";
  } else {
    title.textContent = "Welcome back";
    subtitle.textContent = "Log in to your GoalNational account.";
    nameInput.style.display = "none";
    passwordInput.autocomplete = "current-password";
    emailAction.textContent = "Log in";
    switchModeButton.textContent = "Create one";
    document.getElementById("gnSwitchText").textContent = "No account?";
  }
}

async function createBasicProfile(user, suppliedName = "") {
  const userRef = doc(db, "users", user.uid);
  const existingProfile = await getDoc(userRef);

  if (!existingProfile.exists()) {
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

  const userRef = doc(db, "users", user.uid);
  const profileSnapshot = await getDoc(userRef);
  const data = profileSnapshot.exists() ? profileSnapshot.data() : {};

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
    membershipBadge.style.color = "#ffffff";
    upgradeButton.style.display = "block";
  }
}

memberButton.addEventListener("click", openModal);
closeButton.addEventListener("click", closeModal);

overlay.addEventListener("click", (event) => {
  if (event.target === overlay) {
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

    const errorMessages = {
      "auth/email-already-in-use": "This email address is already registered.",
      "auth/invalid-email": "Enter a valid email address.",
      "auth/invalid-credential": "The email address or password is incorrect.",
      "auth/weak-password": "Choose a stronger password.",
      "auth/too-many-requests": "Too many attempts. Please wait and try again.",
      "auth/operation-not-allowed": "This login method is not enabled in Firebase."
    };

    showMessage(
      errorMessages[error.code] ||
      "Something went wrong. Please try again."
    );
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