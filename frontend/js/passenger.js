import {
    auth,
    db
} from "./firebase-config.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


// ============================================================
// FIREBASE ERROR MESSAGES
// ============================================================

function getFirebaseAuthMessage(code) {

    switch (code) {

        case "auth/email-already-in-use":
            return "An account with this email already exists.";

        case "auth/invalid-email":
            return "Please enter a valid email address.";

        case "auth/weak-password":
            return "Password must be at least 6 characters.";

        case "auth/invalid-credential":
            return "Invalid email or password.";

        case "auth/user-not-found":
            return "Account not found.";

        case "auth/wrong-password":
            return "Incorrect password.";

        case "auth/too-many-requests":
            return "Too many attempts. Try again later.";

        default:
            return "Authentication failed. Please try again.";
    }
}


// ============================================================
// PASSENGER REGISTRATION
// ============================================================

const registerForm =
    document.getElementById(
        "passengerRegisterForm"
    );

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const name =
                document
                    .getElementById("name")
                    ?.value
                    .trim();

            const email =
                document
                    .getElementById("email")
                    ?.value
                    .trim();

            const password =
                document
                    .getElementById("password")
                    ?.value;

            const confirmPassword =
                document
                    .getElementById("confirmPassword")
                    ?.value;


            // ---------------- VALIDATION ----------------

            if (
                !name ||
                !email ||
                !password ||
                !confirmPassword
            ) {

                alert(
                    "Please complete all fields."
                );

                return;
            }


            if (
                password !==
                confirmPassword
            ) {

                alert(
                    "Passwords do not match."
                );

                return;
            }


            if (
                password.length < 6
            ) {

                alert(
                    "Password must be at least 6 characters."
                );

                return;
            }


            // ---------------- FIREBASE ----------------

            try {

                const credential =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );

                const user =
                    credential.user;


                // Create passenger profile
                await setDoc(
                    doc(
                        db,
                        "users",
                        user.uid
                    ),
                    {
                        name:
                            name,

                        email:
                            user.email,

                        role:
                            "passenger",

                        status:
                            "approved",

                        createdAt:
                            serverTimestamp()
                    }
                );


                alert(
                    "Account created successfully!"
                );


                window.location.href =
                    "dashboard.html";


            } catch (error) {

                console.error(
                    "Passenger registration error:",
                    error
                );

                alert(
                    getFirebaseAuthMessage(
                        error.code
                    )
                );
            }
        }
    );
}


// ============================================================
// PASSENGER LOGIN
// ============================================================

const loginForm =
    document.getElementById(
        "passengerLoginForm"
    );

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const email =
                document
                    .getElementById("email")
                    ?.value
                    .trim();

            const password =
                document
                    .getElementById("password")
                    ?.value;


            if (
                !email ||
                !password
            ) {

                alert(
                    "Please enter email and password."
                );

                return;
            }


            try {

                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


                window.location.href =
                    "dashboard.html";


            } catch (error) {

                console.error(
                    "Passenger login error:",
                    error
                );

                alert(
                    getFirebaseAuthMessage(
                        error.code
                    )
                );
            }
        }
    );
}


// ============================================================
// LOGOUT
// ============================================================

window.logout =
    async function () {

        try {

            await signOut(
                auth
            );


            window.location.href =
                "../index.html";


        } catch (error) {

            console.error(
                "Logout failed:",
                error
            );
        }
    };


// ============================================================
// PASSENGER PAGE READY
// ============================================================

console.log(
    "✅ Passenger authentication module loaded."
);