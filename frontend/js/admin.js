import {
    auth,
    db
} from "./firebase-config.js";

import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    collection,
    doc,
    getDoc,
    getDocs,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


// ============================================================
// FIREBASE ERROR MESSAGE
// ============================================================

function getAdminAuthMessage(code) {

    switch (code) {

        case "auth/invalid-credential":
            return "Invalid admin email or password.";

        case "auth/user-not-found":
            return "Admin account not found.";

        case "auth/wrong-password":
            return "Incorrect password.";

        case "auth/too-many-requests":
            return "Too many login attempts. Try again later.";

        default:
            return "Unable to sign in.";
    }
}


// ============================================================
// ADMIN LOGIN
// ============================================================

const adminLoginForm =
    document.getElementById("adminLoginForm");

if (adminLoginForm) {

    adminLoginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const email =
                document
                    .getElementById("adminEmail")
                    ?.value
                    .trim();

            const password =
                document
                    .getElementById("adminPassword")
                    ?.value;

            if (!email || !password) {

                alert(
                    "Enter admin email and password."
                );

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
                        doc(
                            db,
                            "users",
                            user.uid
                        )
                    );

                if (!profileSnap.exists()) {

                    await signOut(auth);

                    alert(
                        "Admin profile not found."
                    );

                    return;
                }

                const profile =
                    profileSnap.data();

                if (
                    profile.role !== "admin" ||
                    profile.status !== "approved"
                ) {

                    await signOut(auth);

                    alert(
                        "This account does not have administrator access."
                    );

                    return;
                }

                window.location.href =
                    "dashboard.html";

            } catch (error) {

                console.error(
                    "Admin login error:",
                    error
                );

                alert(
                    getAdminAuthMessage(
                        error.code
                    )
                );
            }
        }
    );
}


// ============================================================
// ADMIN LOGOUT
// ============================================================

window.logoutAdmin =
    async function () {

        try {

            await signOut(auth);

            window.location.href =
                "login.html";

        } catch (error) {

            console.error(
                "Admin logout failed:",
                error
            );
        }
    };


// ============================================================
// ADMIN DASHBOARD AUTH GUARD
// ============================================================

function protectAdminDashboard() {

    const isDashboard =
        document.body.classList.contains(
            "admin-dashboard-page"
        );

    if (!isDashboard) {
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
                    profile.role !== "admin" ||
                    profile.status !== "approved"
                ) {

                    await signOut(auth);

                    alert(
                        "Administrator access required."
                    );

                    window.location.href =
                        "login.html";

                    return;
                }

                const adminName =
                    document.querySelector(
                        ".admin-user strong"
                    );

                if (adminName) {

                    adminName.textContent =
                        profile.name ||
                        "Administrator";
                }

                loadPendingApplications();

            } catch (error) {

                console.error(
                    "Admin authorization error:",
                    error
                );
            }
        }
    );
}


// ============================================================
// LOAD PENDING DRIVER APPLICATIONS
// ============================================================

async function loadPendingApplications() {

    const pendingList =
        document.querySelector(
            ".pending-list"
        );

    const pendingCount =
        document.querySelector(
            ".pending-count"
        );

    if (!pendingList) {
        return;
    }

    pendingList.innerHTML = `
        <div class="loading-pending">
            Loading applications...
        </div>
    `;

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "driverApplications"
                )
            );

        const applications = [];

        snapshot.forEach(
            (applicationDoc) => {

                const data =
                    applicationDoc.data();

                if (
                    data.status === "pending"
                ) {

                    applications.push({
                        id:
                            applicationDoc.id,

                        ...data
                    });
                }
            }
        );

        // Update count
        if (pendingCount) {

            pendingCount.textContent =
                `${applications.length} Pending`;
        }

        if (applications.length === 0) {

            pendingList.innerHTML = `
                <div class="no-pending">
                    <span>✓</span>
                    <strong>No pending registrations</strong>
                    <small>
                        All driver applications have been reviewed.
                    </small>
                </div>
            `;

            return;
        }

        pendingList.innerHTML = "";

        applications.forEach(
            (application) => {

                const item =
                    document.createElement(
                        "div"
                    );

                item.className =
                    "pending-item";

                const initials =
                    getInitials(
                        application.name
                    );

                const role =
                    application.applicationRole ===
                    "conductor"
                        ? "Conductor"
                        : "Driver";

                item.innerHTML = `
                    <div class="pending-avatar">
                        ${escapeHtml(initials)}
                    </div>

                    <div class="pending-info">
                        <strong>
                            ${escapeHtml(
                                application.name ||
                                "Unknown Applicant"
                            )}
                        </strong>

                        <small>
                            ${escapeHtml(role)}
                            • Bus:
                            ${escapeHtml(
                                application.busNumber ||
                                "-"
                            )}
                            • Route:
                            ${escapeHtml(
                                application.routeId ||
                                "-"
                            )}
                        </small>

                        <small>
                            ${escapeHtml(
                                application.email ||
                                ""
                            )}
                        </small>
                    </div>

                    <div class="pending-actions">

                        <button
                            class="review-button"
                            type="button"
                            data-id="${application.id}">
                            Review
                        </button>

                        <button
                            class="approve-button"
                            type="button"
                            data-id="${application.id}">
                            Approve
                        </button>

                    </div>
                `;

                pendingList.appendChild(
                    item
                );
            }
        );

        // Attach buttons
        pendingList
            .querySelectorAll(
                ".review-button"
            )
            .forEach(
                (button) => {

                    button.addEventListener(
                        "click",
                        function () {

                            reviewApplication(
                                this.dataset.id
                            );
                        }
                    );
                }
            );

        pendingList
            .querySelectorAll(
                ".approve-button"
            )
            .forEach(
                (button) => {

                    button.addEventListener(
                        "click",
                        function () {

                            approveDriver(
                                this.dataset.id
                            );
                        }
                    );
                }
            );

    } catch (error) {

        console.error(
            "Failed to load applications:",
            error
        );

        pendingList.innerHTML = `
            <div class="no-pending">
                <strong>
                    Failed to load applications.
                </strong>

                <small>
                    Check Firestore permissions.
                </small>
            </div>
        `;
    }
}


// ============================================================
// REVIEW APPLICATION
// ============================================================

async function reviewApplication(
    applicationId
) {

    try {

        const applicationSnap =
            await getDoc(
                doc(
                    db,
                    "driverApplications",
                    applicationId
                )
            );

        if (
            !applicationSnap.exists()
        ) {

            alert(
                "Application no longer exists."
            );

            return;
        }

        const data =
            applicationSnap.data();

        const role =
            data.applicationRole ===
            "conductor"
                ? "Conductor"
                : "Driver";

        alert(
            `APPLICATION DETAILS\n\n` +

            `Name: ${data.name || "-"}\n` +
            `Email: ${data.email || "-"}\n` +
            `Phone: ${data.phone || "-"}\n` +
            `Role: ${role}\n` +
            `License: ${data.licenseNumber || "-"}\n` +
            `Experience: ${data.experience || "-"}\n` +
            `Bus: ${data.busNumber || "-"}\n` +
            `Route: ${data.routeId || "-"}\n\n` +

            `Documents:\n` +
            `Identity: ${data.documents?.identity || "Not uploaded"}\n` +
            `License: ${data.documents?.license || "Not uploaded"}\n` +
            `Photo: ${data.documents?.profilePhoto || "Not uploaded"}`
        );

    } catch (error) {

        console.error(
            "Review error:",
            error
        );

        alert(
            "Unable to load application."
        );
    }
}


// ============================================================
// APPROVE DRIVER
// ============================================================

async function approveDriver(
    applicationId
) {

    const confirmed =
        confirm(
            "Approve this driver/conductor application?"
        );

    if (!confirmed) {
        return;
    }

    try {

        const applicationRef =
            doc(
                db,
                "driverApplications",
                applicationId
            );

        const applicationSnap =
            await getDoc(
                applicationRef
            );

        if (
            !applicationSnap.exists()
        ) {

            alert(
                "Application not found."
            );

            return;
        }

        const application =
            applicationSnap.data();

        const userId =
            application.userId ||
            applicationId;


        // --------------------------------------------
        // UPDATE USER PROFILE
        // --------------------------------------------

        await updateDoc(
            doc(
                db,
                "users",
                userId
            ),
            {
                role: "driver",
                status: "approved",
                approvedAt:
                    serverTimestamp()
            }
        );


        // --------------------------------------------
        // UPDATE APPLICATION
        // --------------------------------------------

        await updateDoc(
            applicationRef,
            {
                status: "approved",
                reviewedAt:
                    serverTimestamp(),
                reviewedBy:
                    auth.currentUser.uid
            }
        );


        alert(
            `${application.name || "Applicant"} has been approved.`
        );

        await loadPendingApplications();

    } catch (error) {

        console.error(
            "Approval error:",
            error
        );

        alert(
            `Unable to approve application.\n\n${error.message}`
        );
    }
}


// ============================================================
// HELPERS
// ============================================================

function getInitials(name) {

    if (!name) {
        return "NA";
    }

    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(
            word =>
                word
                    .charAt(0)
                    .toUpperCase()
        )
        .join("");
}


function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ============================================================
// DATE
// ============================================================

const adminDateElement =
    document.getElementById(
        "adminDate"
    );

if (adminDateElement) {

    adminDateElement.textContent =
        new Date().toLocaleDateString(
            undefined,
            {
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        );
}


// ============================================================
// START
// ============================================================

protectAdminDashboard();