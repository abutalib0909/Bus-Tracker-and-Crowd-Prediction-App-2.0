import {
    auth,
    db
} from "./firebase-config.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


// ============================================================
// CONFIG
// ============================================================

const DRIVER_BUS_NUMBER = "DEMO-01";
const DRIVER_ROUTE_ID = "R-4";
const DRIVER_CAPACITY = 50;
const DRIVER_DEFAULT_STOP_ID = "R4-03";


// ============================================================
// STATE
// ============================================================

let tripActive = false;
let gpsActive = false;
let driverPassengers = 32;

let gpsWatchId = null;
let socket = null;


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
// DRIVER LOGIN
// ============================================================

const driverLoginForm =
    document.getElementById("driverLoginForm");

if (driverLoginForm) {

    driverLoginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const email =
                document.getElementById("email")
                    ?.value
                    .trim();

            const password =
                document.getElementById("password")
                    ?.value;

            if (!email || !password) {
                alert("Please enter email and password.");
                return;
            }

            try {

                const credential =
                    await signInWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );

                const user =
                    credential.user;

                const profileSnap =
                    await getDoc(
                        doc(db, "users", user.uid)
                    );

                if (!profileSnap.exists()) {

                    await signOut(auth);

                    alert(
                        "Driver profile was not found."
                    );

                    return;
                }

                const profile =
                    profileSnap.data();

                if (
                    profile.role === "driver" &&
                    profile.status === "approved"
                ) {

                    window.location.href =
                        "dashboard.html";

                    return;
                }

                if (
                    profile.role === "pending_driver" ||
                    profile.status === "pending"
                ) {

                    await signOut(auth);

                    alert(
                        "Your registration is still pending approval.\n\n" +
                        "Please wait for an administrator to verify your application."
                    );

                    return;
                }

                await signOut(auth);

                alert(
                    "This account does not have permission to access the driver dashboard."
                );

            } catch (error) {

                console.error(
                    "Driver login error:",
                    error
                );

                alert(
                    getFirebaseAuthMessage(error.code)
                );
            }
        }
    );
}


// ============================================================
// DRIVER REGISTRATION
// ============================================================

const driverRegisterForm =
    document.getElementById(
        "driverRegisterForm"
    );

if (driverRegisterForm) {

    driverRegisterForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const fullName =
                document.getElementById("fullName")
                    ?.value
                    .trim();

            const phone =
                document.getElementById("phone")
                    ?.value
                    .trim();

            const email =
                document.getElementById("email")
                    ?.value
                    .trim();

            const password =
                document.getElementById("password")
                    ?.value;

            const confirmPassword =
                document.getElementById("confirmPassword")
                    ?.value;

            const licenseNumber =
                document.getElementById("licenseNumber")
                    ?.value
                    .trim();

            const experience =
                document.getElementById("experience")
                    ?.value;

            const busNumber =
                document.getElementById("busNumber")
                    ?.value
                    .trim();

            const routeId =
                document.getElementById("route")
                    ?.value;

            const selectedRole =
                document.querySelector(
                    'input[name="role"]:checked'
                )?.value || "driver";


            // ---------------- VALIDATION ----------------

            if (
                !fullName ||
                !phone ||
                !email ||
                !password ||
                !confirmPassword ||
                !licenseNumber ||
                !busNumber ||
                !routeId
            ) {

                alert(
                    "Please complete all required fields."
                );

                return;
            }

            if (password !== confirmPassword) {

                alert(
                    "Passwords do not match."
                );

                return;
            }

            if (password.length < 6) {

                alert(
                    "Password must be at least 6 characters."
                );

                return;
            }


            try {

                // Create Firebase Auth account
                const credential =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );

                const user =
                    credential.user;


                // Document filenames only for prototype
                const documentInputs =
                    document.querySelectorAll(
                        '.document-upload input[type="file"]'
                    );

                const identityFile =
                    documentInputs[0]
                        ?.files?.[0];

                const licenseFile =
                    documentInputs[1]
                        ?.files?.[0];

                const profilePhotoFile =
                    documentInputs[2]
                        ?.files?.[0];


                const profileData = {

                    name: fullName,

                    email: user.email,

                    phone: phone,

                    role: "pending_driver",

                    applicationRole:
                        selectedRole,

                    status: "pending",

                    licenseNumber:
                        licenseNumber,

                    experience:
                        experience || "",

                    busNumber:
                        busNumber,

                    routeId:
                        routeId,

                    documents: {

                        identity:
                            identityFile?.name || null,

                        license:
                            licenseFile?.name || null,

                        profilePhoto:
                            profilePhotoFile?.name || null
                    },

                    createdAt:
                        serverTimestamp()
                };


                // Save user profile
                await setDoc(
                    doc(
                        db,
                        "users",
                        user.uid
                    ),
                    profileData
                );


                // Save application
                await setDoc(
                    doc(
                        db,
                        "driverApplications",
                        user.uid
                    ),
                    {
                        userId:
                            user.uid,

                        ...profileData
                    }
                );


                await signOut(auth);

                alert(
                    "Registration submitted successfully!\n\n" +
                    "Your application is now pending administrator approval."
                );

                window.location.href =
                    "login.html";

            } catch (error) {

            console.error(
                "Driver registration error:",
                error
            );

            console.error(
                "Error code:",
                error.code
            );

            console.error(
                "Error message:",
                error.message
            );

            alert(
                `Registration failed.\n\nCode: ${error.code}\n\n${error.message}`
            );
        }
                }
            );
}


// ============================================================
// LOGOUT
// ============================================================

window.logoutDriver =
    async function () {

        try {

            if (gpsWatchId !== null) {

                navigator.geolocation.clearWatch(
                    gpsWatchId
                );

                gpsWatchId = null;
            }

            if (
                socket &&
                socket.connected
            ) {

                socket.disconnect();
                socket = null;
            }

            await signOut(auth);

            window.location.href =
                "login.html";

        } catch (error) {

            console.error(
                "Logout failed:",
                error
            );
        }
    };


// ============================================================
// DRIVER DASHBOARD AUTH GUARD
// ============================================================

function protectDriverDashboard() {

    const dashboardPage =
        document.body.classList.contains(
            "driver-dashboard-page"
        );

    if (!dashboardPage) {
        return;
    }

    onAuthStateChanged(
        auth,
        async function (user) {

            if (!user) {

                window.location.href =
                    "login.html";

                return;
            }

            try {

                const profileSnap =
                    await getDoc(
                        doc(
                            db,
                            "users",
                            user.uid
                        )
                    );

                if (!profileSnap.exists()) {

                    await signOut(auth);

                    window.location.href =
                        "login.html";

                    return;
                }

                const profile =
                    profileSnap.data();

                if (
                    profile.role !== "driver" ||
                    profile.status !== "approved"
                ) {

                    await signOut(auth);

                    alert(
                        "Your driver account is not approved."
                    );

                    window.location.href =
                        "login.html";

                    return;
                }


                // Update displayed name
                const nameElement =
                    document.querySelector(
                        ".driver-profile strong"
                    );

                if (nameElement) {

                    nameElement.textContent =
                        profile.name || "Driver";
                }


                // Update displayed bus number
                const busElement =
                    document.getElementById(
                        "driverBusNumber"
                    );

                if (
                    busElement &&
                    profile.busNumber
                ) {

                    busElement.textContent =
                        profile.busNumber;
                }

            } catch (error) {

                console.error(
                    "Driver authorization error:",
                    error
                );
            }
        }
    );
}


// ============================================================
// TRIP CONTROL
// ============================================================

function toggleTrip() {

    tripActive =
        !tripActive;

    const button =
        document.getElementById(
            "tripButton"
        );

    const status =
        document.getElementById(
            "tripStatus"
        );

    const heading =
        document.getElementById(
            "tripHeading"
        );

    const description =
        document.getElementById(
            "tripDescription"
        );

    const busStatus =
        document.getElementById(
            "busStatus"
        );

    const mapStatus =
        document.querySelector(
            ".map-status"
        );

    if (
        !button ||
        !status ||
        !heading ||
        !description ||
        !busStatus
    ) {
        return;
    }

    if (tripActive) {

        button.textContent =
            "■ End Trip";

        button.style.background =
            "#e44f4f";

        status.textContent =
            "● Trip Active";

        status.classList.remove(
            "waiting"
        );

        status.classList.add(
            "active"
        );

        heading.textContent =
            "Trip in progress";

        description.textContent =
            "Your bus is currently operating on Route R-4.";

        busStatus.textContent =
            "On Route";

        if (mapStatus) {
            mapStatus.textContent =
                "● Trip active";
        }

    } else {

        button.textContent =
            "▶ Start Trip";

        button.style.background =
            "#16b878";

        status.textContent =
            "● Trip Not Started";

        status.classList.remove(
            "active"
        );

        status.classList.add(
            "waiting"
        );

        heading.textContent =
            "Ready to start?";

        description.textContent =
            "Start the trip when your assigned bus is ready to depart.";

        busStatus.textContent =
            "Ready";

        if (mapStatus) {
            mapStatus.textContent =
                "● Waiting for trip";
        }
    }
}


// ============================================================
// PASSENGER COUNT
// ============================================================

function changePassengerCount(amount) {

    driverPassengers += amount;

    driverPassengers =
        Math.max(
            0,
            Math.min(
                DRIVER_CAPACITY,
                driverPassengers
            )
        );

    updateDriverPassengerUI();

    saveDriverCrowd();
}


function updateDriverPassengerUI() {

    const passengerElement =
        document.getElementById(
            "driverPassengerCount"
        );

    const occupancyElement =
        document.getElementById(
            "driverOccupancy"
        );

    const occupancyBar =
        document.getElementById(
            "driverOccupancyBar"
        );

    if (
        !passengerElement ||
        !occupancyElement ||
        !occupancyBar
    ) {
        return;
    }

    passengerElement.textContent =
        driverPassengers;

    const occupancy =
        (
            driverPassengers /
            DRIVER_CAPACITY
        ) * 100;

    occupancyElement.textContent =
        `${Math.round(occupancy)}%`;

    occupancyBar.style.width =
        `${occupancy}%`;

    updateDriverCrowd(
        occupancy
    );
}


// ============================================================
// CROWD
// ============================================================

function updateDriverCrowd(occupancy) {

    const crowdElement =
        document.getElementById(
            "driverCrowdLevel"
        );

    if (!crowdElement) {
        return;
    }

    let level;

    if (occupancy <= 40) {

        level = "LOW";

    } else if (occupancy <= 70) {

        level = "MEDIUM";

    } else if (occupancy <= 90) {

        level = "HIGH";

    } else {

        level = "FULL";
    }

    crowdElement.textContent =
        level;

    if (level === "LOW") {

        crowdElement.style.color =
            "#16a86d";

    } else if (level === "MEDIUM") {

        crowdElement.style.color =
            "#d79515";

    } else if (level === "HIGH") {

        crowdElement.style.color =
            "#e0782e";

    } else {

        crowdElement.style.color =
            "#e44f4f";
    }
}


// ============================================================
// SAVE CROWD DATA
// ============================================================

async function saveDriverCrowd() {

    try {

        const response =
            await fetch(
                "http://localhost:5000/api/crowd",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        routeId:
                            DRIVER_ROUTE_ID,

                        busNumber:
                            DRIVER_BUS_NUMBER,

                        stopId:
                            DRIVER_DEFAULT_STOP_ID,

                        passengers:
                            driverPassengers,

                        capacity:
                            DRIVER_CAPACITY
                    })
                }
            );

        const data =
            await response.json();

        if (
            !response.ok ||
            !data.success
        ) {

            console.error(
                "Crowd update failed:",
                data
            );

            return;
        }

        console.log(
            "✅ Driver crowd update saved:",
            data.data
        );

    } catch (error) {

        console.error(
            "❌ Driver crowd request failed:",
            error
        );
    }
}


// ============================================================
// SOCKET.IO
// ============================================================

function connectDriverSocket() {

    // Prevent duplicate connections
    if (
        socket &&
        socket.connected
    ) {
        return;
    }

    const ioClient =
        window.io;

    if (
        typeof ioClient !== "function"
    ) {

        console.error(
            "❌ Socket.IO is not loaded. " +
            "Check dashboard.html script order/path."
        );

        return;
    }

    socket =
        ioClient(
            "http://localhost:5000"
        );

    socket.on(
        "connect",
        function () {

            console.log(
                "✅ Driver connected to Socket.IO"
            );
        }
    );

    socket.on(
        "disconnect",
        function () {

            console.log(
                "❌ Driver disconnected from Socket.IO"
            );
        }
    );

    socket.on(
        "connect_error",
        function (error) {

            console.error(
                "❌ Socket.IO connection error:",
                error.message
            );
        }
    );
}


// ============================================================
// GPS
// ============================================================

function toggleGPS() {

    if (!navigator.geolocation) {

        alert(
            "Geolocation is not supported by this browser."
        );

        return;
    }


    // Disable GPS
    if (gpsWatchId !== null) {

        navigator.geolocation.clearWatch(
            gpsWatchId
        );

        gpsWatchId = null;
        gpsActive = false;

        const indicator =
            document.getElementById(
                "gpsIndicator"
            );

        if (indicator) {

            indicator.textContent =
                "● Offline";

            indicator.className =
                "gps-indicator offline";
        }

        const button =
            document.querySelector(
                ".gps-button"
            );

        if (button) {

            button.textContent =
                "Enable Location";
        }

        if (
            socket &&
            socket.connected
        ) {

            socket.emit(
                "driverLocation",
                {
                    busNumber:
                        DRIVER_BUS_NUMBER,

                    routeId:
                        DRIVER_ROUTE_ID,

                    active: false,

                    timestamp:
                        new Date()
                            .toISOString()
                }
            );
        }

        return;
    }


    // Enable GPS
    gpsWatchId =
        navigator.geolocation.watchPosition(

            function (position) {

                gpsActive = true;

                const latitude =
                    position.coords.latitude;

                const longitude =
                    position.coords.longitude;

                const indicator =
                    document.getElementById(
                        "gpsIndicator"
                    );

                const gpsLat =
                    document.getElementById(
                        "gpsLat"
                    );

                const gpsLng =
                    document.getElementById(
                        "gpsLng"
                    );

                const gpsTime =
                    document.getElementById(
                        "gpsTime"
                    );

                const button =
                    document.querySelector(
                        ".gps-button"
                    );


                if (indicator) {

                    indicator.textContent =
                        "● Online";

                    indicator.className =
                        "gps-indicator online";
                }


                if (gpsLat) {

                    gpsLat.textContent =
                        latitude.toFixed(5);
                }


                if (gpsLng) {

                    gpsLng.textContent =
                        longitude.toFixed(5);
                }


                if (gpsTime) {

                    gpsTime.textContent =
                        new Date()
                            .toLocaleTimeString();
                }


                if (button) {

                    button.textContent =
                        "Disable Location";
                }


                // Send location
                if (
                    socket &&
                    socket.connected
                ) {

                    socket.emit(
                        "driverLocation",
                        {
                            busNumber:
                                DRIVER_BUS_NUMBER,

                            routeId:
                                DRIVER_ROUTE_ID,

                            latitude:
                                latitude,

                            longitude:
                                longitude,

                            active: true,

                            timestamp:
                                new Date()
                                    .toISOString()
                        }
                    );
                }
            },


            function (error) {

                console.error(
                    "GPS error:",
                    error
                );

                alert(
                    "Unable to access your location."
                );
            },


            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 2000
            }
        );
}


// ============================================================
// INITIALIZE DRIVER DASHBOARD
// ============================================================

function initializeDriverDashboard() {

    const dashboardElement =
        document.getElementById(
            "driverPassengerCount"
        );

    if (!dashboardElement) {
        return;
    }

    updateDriverPassengerUI();

    connectDriverSocket();

    console.log(
        "✅ Driver dashboard initialized."
    );
}


// ============================================================
// START
// ============================================================

protectDriverDashboard();
initializeDriverDashboard();


// ============================================================
// HTML BUTTON ACCESS
// ============================================================

window.toggleTrip =
    toggleTrip;

window.changePassengerCount =
    changePassengerCount;

window.toggleGPS =
    toggleGPS;