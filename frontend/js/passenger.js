function openPassengerDashboard() {
    window.location.href = "dashboard.html";
}

function demoLogin() {
    openPassengerDashboard();
}

document
    .getElementById("passengerLoginForm")
    ?.addEventListener("submit", function (event) {

        event.preventDefault();

        openPassengerDashboard();
    });

function logout() {
    window.location.href = "../index.html";
}

function centerOnBus() {
    if (typeof busMarker !== "undefined" && busMarker && map) {
        map.setCenter(busMarker.getPosition());
        map.setZoom(15);
    }
}