let selectedRole = null;

function showPage(pageId) {
    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    document.getElementById(pageId).classList.add("active");

    // Google Maps can need a resize event when its container
    // becomes visible for the first time.
    if (
        pageId === "passengerPage" &&
        typeof google !== "undefined" &&
        google.maps &&
        typeof map !== "undefined" &&
        map
    ) {
        setTimeout(() => {
            google.maps.event.trigger(map, "resize");
        }, 200);
    }
}

function openLogin(role) {

    selectedRole = role;

    const icon = document.getElementById("loginRoleIcon");
    const title = document.getElementById("loginTitle");
    const subtitle = document.getElementById("loginSubtitle");

    if (role === "passenger") {

        icon.textContent = "👤";
        title.textContent = "Passenger Login";

        subtitle.textContent =
            "Sign in to access your passenger dashboard.";

    } else if (role === "driver") {

        icon.textContent = "🚌";
        title.textContent = "Driver / Conductor Login";

        subtitle.textContent =
            "Access your assigned bus and trip controls.";

    } else if (role === "admin") {

        icon.textContent = "🛡️";
        title.textContent = "Admin Login";

        subtitle.textContent =
            "Access the transport management console.";
    }

    showPage("loginPage");
}

document
    .getElementById("loginForm")
    .addEventListener("submit", function (event) {

        event.preventDefault();

        if (selectedRole === "passenger") {

            showPage("passengerPage");

        } else if (selectedRole === "driver") {

            showPage("driverPage");

        } else if (selectedRole === "admin") {

            showPage("adminPage");
        }
    });

function logout() {

    selectedRole = null;

    document.getElementById("loginForm").reset();

    showPage("landingPage");
}

function startDemoTrip() {

    const tripStatus =
        document.querySelector(".trip-status");

    tripStatus.textContent = "● Trip Active";
    tripStatus.style.background = "#e9f9f1";
    tripStatus.style.color = "#1eaa68";

    alert(
        "Demo trip started.\n\n" +
        "In the production version, this will start " +
        "GPS tracking and connect the driver to the assigned route."
    );
}

function changeDriverPassengers(amount) {

    const element =
        document.getElementById("driverPassengerCount");

    let count =
        Number(element.textContent);

    count += amount;

    count = Math.max(0, Math.min(50, count));

    element.textContent = count;
    showPage("landingPage");
}