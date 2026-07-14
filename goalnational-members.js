import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  EmailAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  reauthenticateWithPopup,
  reauthenticateWithCredential,
  deleteUser,
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
  updateDoc,
  deleteDoc,
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
  "https://cdn.jsdelivr.net/gh/milotsel-bit/goalnational-assets@main/goalnational-members.css?v=3";

const MONETAG_ZONE = "10959350";

function loadMonetagAds() {
  if (document.querySelector('script[data-gn-monetag="true"]')) {
    return;
  }

  if (localStorage.getItem("gnMembershipPlan") === "pro") {
    return;
  }

  const script = document.createElement("script");

  script.dataset.zone = MONETAG_ZONE;
  script.dataset.gnMonetag = "true";
  script.src = "https://al5sm.com/tag.min.js";
  script.async = true;

  document.body.appendChild(script);
}

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
      <div
        id="gnAuthBox"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gnAuthTitle"
      >
        <button id="gnAuthClose" type="button" aria-label="Close">
          &times;
        </button>

        <div id="gnAuthForms">
          <h2 id="gnAuthTitle">Welcome back</h2>

          <p id="gnAuthSubtitle">
            Log in to your GoalNational account.
          </p>

          <input
            id="gnName"
            class="gnAuthInput"
            type="text"
            placeholder="Your name"
            autocomplete="name"
            style="display:none;"
          />

          <input
            id="gnEmail"
            class="gnAuthInput"
            type="email"
            placeholder="Email address"
            autocomplete="email"
          />

          <input
            id="gnPassword"
            class="gnAuthInput"
            type="password"
            placeholder="Password"
            autocomplete="current-password"
          />

          <button
            id="gnEmailAction"
            class="gnPrimaryButton"
            type="button"
          >
            Log in
          </button>

          <button
            id="gnGoogleLogin"
            class="gnGoogleButton"
            type="button"
          >
            Continue with Google
          </button>

          <div id="gnAuthSwitch">
            <span id="gnSwitchText">No account?</span>

            <button id="gnSwitchMode" type="button">
              Create one
            </button>
          </div>
        </div>

        <div id="gnMemberArea">
          <img
            id="gnMemberPhoto"
            alt="Profile"
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/default-avatar.png"
          />

          <div id="gnMemberName">GoalNational Member</div>
          <div id="gnMemberEmail"></div>
          <div id="gnMembershipBadge">FREE MEMBER</div>

          <a id="gnUpgradeButton" href="#">
            Upgrade to GoalNational Pro
          </a>

          <button
            id="gnEditProfileButton"
            class="gnSecondaryButton"
            type="button"
          >
            Edit profile
          </button>

          <div id="gnProfilePanel">
            <div class="gnSectionTitle">Profile name</div>

            <input
              id="gnEditName"
              class="gnAuthInput"
              type="text"
              placeholder="Display name"
            />

            <div class="gnSectionTitle">Profile picture</div>

            <input
              id="gnEditPhoto"
              class="gnAuthInput"
              type="url"
              placeholder="Paste a direct image URL (https://...)"
            />

            <button
              id="gnSaveProfile"
              class="gnPrimaryButton"
              type="button"
            >
              Save profile
            </button>

            <div class="gnDivider"></div>

            <div class="gnStatusRow">
              <span>Email verification</span>

              <span id="gnEmailStatus" class="gnStatusWarn">
                Not verified
              </span>
            </div>

            <button
              id="gnVerifyEmail"
              class="gnSecondaryButton"
              type="button"
            >
              Send verification email
            </button>

            <div class="gnSectionTitle">Password</div>

            <button
              id="gnResetPassword"
              class="gnSecondaryButton"
              type="button"
            >
              Send password-change email
            </button>

            <div class="gnDivider"></div>

            <button
              id="gnDeleteAccount"
              class="gnDangerButton"
              type="button"
            >
              Delete account permanently
            </button>
          </div>

          <button
            id="gnLogoutButton"
            class="gnLogoutButton"
            type="button"
          >
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

  async function callGoalProBackend(path) {
    const user = auth.currentUser;

    if (!user) {
      throw new Error("Please log in first.");
    }

    const idToken = await user.getIdToken(true);

    const response = await fetch(
      `https://goalnational-stripe.milotsel.workers.dev${path}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json"
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "The request failed.");
    }

    return data;
  }

  const $ = (id) => document.getElementById(id);

  const memberButton = $("gnMemberButton");
  const overlay = $("gnAuthOverlay");
  const closeButton = $("gnAuthClose");
  const forms = $("gnAuthForms");
  const memberArea = $("gnMemberArea");
  const title = $("gnAuthTitle");
  const subtitle = $("gnAuthSubtitle");
  const nameInput = $("gnName");
  const emailInput = $("gnEmail");
  const passwordInput = $("gnPassword");
  const emailAction = $("gnEmailAction");
  const googleLogin = $("gnGoogleLogin");
  const switchModeButton = $("gnSwitchMode");
  const switchText = $("gnSwitchText");
  const logoutButton = $("gnLogoutButton");
  const memberPhoto = $("gnMemberPhoto");
  const memberName = $("gnMemberName");
  const memberEmail = $("gnMemberEmail");
  const membershipBadge = $("gnMembershipBadge");
  const upgradeButton = $("gnUpgradeButton");
  const messageBox = $("gnAuthMessage");
  const editProfileButton = $("gnEditProfileButton");
  const profilePanel = $("gnProfilePanel");
  const editName = $("gnEditName");
  const editPhoto = $("gnEditPhoto");
  const saveProfile = $("gnSaveProfile");
  const emailStatus = $("gnEmailStatus");
  const verifyEmail = $("gnVerifyEmail");
  const resetPassword = $("gnResetPassword");
  const deleteAccountButton = $("gnDeleteAccount");

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
    messageBox.style.background = success
      ? "#14532d"
      : "#7f1d1d";
    messageBox.style.color = "#fff";
  }

  function clearMessage() {
    messageBox.style.display = "none";
    messageBox.textContent = "";
  }

  function setBusy(button, busy) {
    button.disabled = busy;
    button.style.opacity = busy ? ".6" : "1";
  }

  function setMode(isRegister) {
    registerMode = isRegister;
    clearMessage();

    if (isRegister) {
      title.textContent = "Create an account";

      subtitle.textContent =
        "Join GoalNational and unlock member features.";

      nameInput.style.display = "block";
      passwordInput.autocomplete = "new-password";
      emailAction.textContent = "Create account";
      switchText.textContent = "Already registered?";
      switchModeButton.textContent = "Log in";
    } else {
      title.textContent = "Welcome back";

      subtitle.textContent =
        "Log in to your GoalNational account.";

      nameInput.style.display = "none";
      passwordInput.autocomplete = "current-password";
      emailAction.textContent = "Log in";
      switchText.textContent = "No account?";
      switchModeButton.textContent = "Create one";
    }
  }

  async function createBasicProfile(
    user,
    suppliedName = ""
  ) {
    const userRef = doc(db, "users", user.uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      await setDoc(userRef, {
        email: user.email || "",
        displayName:
          suppliedName || user.displayName || "",
        photoURL: user.photoURL || "",
        createdAt: serverTimestamp()
      });
    }
  }

  async function loadMembership(user) {
    document.body.classList.remove("gn-pro-member");

    const snapshot = await getDoc(
      doc(db, "users", user.uid)
    );

    const data = snapshot.exists()
      ? snapshot.data()
      : {};

    const isPremium =
      data.premium === true &&
      data.subscriptionStatus === "ACTIVE";

    memberName.textContent =
      user.displayName ||
      data.displayName ||
      "GoalNational Member";

    memberEmail.textContent =
      user.email ||
      data.email ||
      "";

    memberPhoto.src =
      user.photoURL ||
      data.photoURL ||
      "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/default-avatar.png";

    editName.value =
      user.displayName ||
      data.displayName ||
      "";

    editPhoto.value =
      user.photoURL ||
      data.photoURL ||
      "";

    if (user.emailVerified) {
      emailStatus.textContent = "Verified";
      emailStatus.className = "gnStatusGood";
      verifyEmail.style.display = "none";
    } else {
      emailStatus.textContent = "Not verified";
      emailStatus.className = "gnStatusWarn";
      verifyEmail.style.display = "block";
    }

    if (isPremium) {
  localStorage.setItem("gnMembershipPlan", "pro");

  membershipBadge.textContent = "GOALNATIONAL PRO";
  membershipBadge.style.background = "#f59e0b";
  membershipBadge.style.color = "#111827";
  upgradeButton.style.display = "none";

  document.body.classList.add("gn-pro-member");
} else {
  localStorage.setItem("gnMembershipPlan", "free");

  membershipBadge.textContent = "FREE MEMBER";
  membershipBadge.style.background = "#374151";
  membershipBadge.style.color = "#fff";
  upgradeButton.style.display = "block";

  loadMonetagAds();
}
}
  
  async function reauthenticateCurrentUser() {
    const user = auth.currentUser;

    if (!user) {
      throw new Error("No signed-in user.");
    }

    const providers = user.providerData.map(
      (item) => item.providerId
    );

    if (providers.includes("google.com")) {
      await reauthenticateWithPopup(
        user,
        googleProvider
      );

      return;
    }

    const password = window.prompt(
      "Enter your current password to confirm:"
    );

    if (!password) {
      throw new Error("Confirmation cancelled.");
    }

    const credential =
      EmailAuthProvider.credential(
        user.email,
        password
      );

    await reauthenticateWithCredential(
      user,
      credential
    );
  }

  memberButton.addEventListener(
    "click",
    openModal
  );

  closeButton.addEventListener(
    "click",
    closeModal
  );

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closeModal();
    }
  });

  switchModeButton.addEventListener(
    "click",
    () => setMode(!registerMode)
  );

  emailAction.addEventListener(
    "click",
    async () => {
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      const suppliedName =
        nameInput.value.trim();

      if (!email || !password) {
        return showMessage(
          "Enter your email address and password."
        );
      }

      if (registerMode && !suppliedName) {
        return showMessage("Enter your name.");
      }

      if (
        registerMode &&
        password.length < 6
      ) {
        return showMessage(
          "Your password must contain at least 6 characters."
        );
      }

      setBusy(emailAction, true);
      clearMessage();

      try {
        if (registerMode) {
          const credential =
            await createUserWithEmailAndPassword(
              auth,
              email,
              password
            );

          await updateProfile(
            credential.user,
            {
              displayName: suppliedName
            }
          );

          await createBasicProfile(
            credential.user,
            suppliedName
          );
        } else {
          await signInWithEmailAndPassword(
            auth,
            email,
            password
          );
        }

        emailInput.value = "";
        passwordInput.value = "";
        nameInput.value = "";
      } catch (error) {
        console.error(error);

        const messages = {
          "auth/email-already-in-use":
            "This email address is already registered.",

          "auth/invalid-email":
            "Enter a valid email address.",

          "auth/invalid-credential":
            "The email address or password is incorrect.",

          "auth/weak-password":
            "Choose a stronger password.",

          "auth/too-many-requests":
            "Too many attempts. Please wait and try again.",

          "auth/operation-not-allowed":
            "This login method is not enabled in Firebase."
        };

        showMessage(
          messages[error.code] ||
            "Something went wrong. Please try again."
        );
      } finally {
        setBusy(emailAction, false);
      }
    }
  );

  googleLogin.addEventListener(
    "click",
    async () => {
      setBusy(googleLogin, true);
      clearMessage();

      try {
        await signInWithPopup(
          auth,
          googleProvider
        );
      } catch (error) {
        console.error(error);

        if (
          error.code !==
          "auth/popup-closed-by-user"
        ) {
          showMessage(
            "Google login could not be completed."
          );
        }
      } finally {
        setBusy(googleLogin, false);
      }
    }
  );

  editProfileButton.addEventListener(
    "click",
    () => {
      profilePanel.style.display =
        profilePanel.style.display === "block"
          ? "none"
          : "block";
    }
  );

  saveProfile.addEventListener(
    "click",
    async () => {
      const user = auth.currentUser;

      if (!user) return;

      const newName =
        editName.value.trim();

      const newPhoto =
        editPhoto.value.trim();

      if (!newName) {
        return showMessage(
          "Your display name cannot be empty."
        );
      }

      if (
        newPhoto &&
        !/^https:\/\//i.test(newPhoto)
      ) {
        return showMessage(
          "The profile picture must use a secure https:// image URL."
        );
      }

      setBusy(saveProfile, true);
      clearMessage();

      try {
        await updateProfile(user, {
          displayName: newName,
          photoURL: newPhoto || null
        });

        await updateDoc(
          doc(db, "users", user.uid),
          {
            displayName: newName,
            photoURL: newPhoto
          }
        );

        await loadMembership(user);

        memberButton.textContent =
          newName;

        showMessage(
          "Your profile was updated.",
          true
        );
      } catch (error) {
        console.error(error);

        showMessage(
          "Your profile could not be updated."
        );
      } finally {
        setBusy(saveProfile, false);
      }
    }
  );

  verifyEmail.addEventListener(
    "click",
    async () => {
      const user = auth.currentUser;

      if (!user) return;

      setBusy(verifyEmail, true);
      clearMessage();

      try {
        await sendEmailVerification(user);

        showMessage(
          "Verification email sent. Check your inbox and spam folder.",
          true
        );
      } catch (error) {
        console.error(error);

        showMessage(
          "The verification email could not be sent."
        );
      } finally {
        setBusy(verifyEmail, false);
      }
    }
  );

  resetPassword.addEventListener(
    "click",
    async () => {
      const user = auth.currentUser;

      if (!user?.email) return;

      setBusy(resetPassword, true);
      clearMessage();

      try {
        await sendPasswordResetEmail(
          auth,
          user.email
        );

        showMessage(
          "Password-change email sent. Check your inbox and spam folder.",
          true
        );
      } catch (error) {
        console.error(error);

        showMessage(
          "The password-change email could not be sent."
        );
      } finally {
        setBusy(resetPassword, false);
      }
    }
  );

  deleteAccountButton.addEventListener(
    "click",
    async () => {
      const user = auth.currentUser;

      if (!user) return;

      const firstConfirm =
        window.confirm(
          "This permanently deletes your GoalNational account. Continue?"
        );

      if (!firstConfirm) return;

      const typed = window.prompt(
        'Type DELETE to confirm permanently:'
      );

      if (typed !== "DELETE") {
        return showMessage(
          "Account deletion cancelled."
        );
      }

      setBusy(
        deleteAccountButton,
        true
      );

      clearMessage();

      try {
        await reauthenticateCurrentUser();

        await deleteDoc(
          doc(db, "users", user.uid)
        );

        await deleteUser(user);

        closeModal();

        alert(
          "Your GoalNational account was permanently deleted."
        );
      } catch (error) {
        console.error(error);

        showMessage(
          error.code ===
            "auth/wrong-password" ||
          error.code ===
            "auth/invalid-credential"
            ? "The password was incorrect."
            : "The account could not be deleted. Please log out, log in again, and retry."
        );
      } finally {
        setBusy(
          deleteAccountButton,
          false
        );
      }
    }
  );

  upgradeButton.addEventListener(
    "click",
    async (event) => {
      event.preventDefault();

      setBusy(upgradeButton, true);
      clearMessage();

      try {
        const data =
          await callGoalProBackend(
            "/create-checkout-session"
          );

        window.location.href =
          data.url;
      } catch (error) {
        console.error(error);

        showMessage(
          error.message ||
            "Stripe Checkout could not be opened."
        );
      } finally {
        setBusy(upgradeButton, false);
      }
    }
  );

  logoutButton.addEventListener(
    "click",
    async () => {
      try {
        await signOut(auth);
        closeModal();
      } catch (error) {
        console.error(error);

        showMessage(
          "Logout could not be completed."
        );
      }
    }
  );

  setPersistence(
    auth,
    browserLocalPersistence
  ).catch(console.error);

  onAuthStateChanged(
    auth,
    async (user) => {
      clearMessage();

      if (user) {
        try {
          await createBasicProfile(user);
          await loadMembership(user);

          forms.style.display = "none";
          memberArea.style.display = "block";

          memberButton.textContent =
            user.displayName ||
            "My Account";
            
          
        } catch (error) {
          console.error(error);

          showMessage(
            "Your profile could not be loaded."
          );

         
        }
      } else {
        document.body.classList.remove(
          "gn-pro-member"
        );
        localStorage.setItem("gnMembershipPlan", "free");

         loadMonetagAds();

        forms.style.display = "block";
        memberArea.style.display = "none";
        profilePanel.style.display = "none";

        memberButton.textContent =
          "Login / Goal Pro";

        setMode(false);

      
      }
    }
  );
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    startMemberSystem
  );
} else {
  startMemberSystem();
}
  
