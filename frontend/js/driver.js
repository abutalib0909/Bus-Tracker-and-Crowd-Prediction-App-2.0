function openDriverDashboard() {
    window.location.href = "dashboard.html";
}

function demoDriverLogin() {
    openDriverDashboard();
}

document
    .getElementById("driverLoginForm")
    ?.addEventListener("submit", function (event) {

        event.preventDefault();

        openDriverDashboard();
    });

function logoutDriver() {
    window.location.href = "../index.html";
}
document
    .getElementById("driverRegisterForm")
    ?.addEventListener("submit", function (event) {

        event.preventDefault();

        alert(
            "Registration submitted successfully!\n\n" +
            "Prototype status: Verification pending.\n\n" +
            "In the final system, an administrator will review " +
            "your information and documents."
        );

        window.location.href = "login.html";
    });