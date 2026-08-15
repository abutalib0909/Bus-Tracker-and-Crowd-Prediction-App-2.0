let map;
let currentRoute = null;

let routePolyline = null;
let stopMarkers = [];
let busMarker = null;
let busTimer = null;
let busSegment = 0;
let busProgress = 0;

function startSimulatedBus() {
    if (!currentRoute || !map) {
        return;
    }

    stopSimulatedBus();

    busSegment = 0;
    busProgress = 0;

    const firstStop = currentRoute.stops[0];

    busMarker = new google.maps.Marker({
        position: {
            lat: firstStop.lat,
            lng: firstStop.lng
        },
        map: map,
        title: `Bus on ${currentRoute.name}`,
        icon: {
            url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
        }
    });

    updateBusInfo();

    busTimer = setInterval(moveBus, 100);
}
function updateBusInfo() {
    if (!currentRoute) {
        return;
    }

    const stops = currentRoute.stops;

    const currentStop = stops[busSegment];
    const nextStop = stops[busSegment + 1];

    document.getElementById("busRoute").textContent =
        currentRoute.name;

    document.getElementById("currentStop").textContent =
        currentStop.name;

    if (nextStop) {
        document.getElementById("nextStop").textContent =
            nextStop.name;
    } else {
        document.getElementById("nextStop").textContent =
            "Route ending";
    }

    // Temporary ETA calculation
    const etaSeconds = Math.max(
        1,
        Math.ceil((1 - busProgress) * 10)
    );

    document.getElementById("eta").textContent =
        `${etaSeconds} sec`;
}
function stopSimulatedBus() {
    if (busTimer) {
        clearInterval(busTimer);
        busTimer = null;
    }

    if (busMarker) {
        busMarker.setMap(null);
        busMarker = null;
    }
}
function moveBus() {
    if (!currentRoute || !busMarker) {
        return;
    }

    const stops = currentRoute.stops;

    if (busSegment >= stops.length - 1) {
        busSegment = 0;
        busProgress = 0;
    }

    const start = stops[busSegment];
    const end = stops[busSegment + 1];

    busProgress += 0.01;

    if (busProgress >= 1) {
        busProgress = 0;
        busSegment++;

        if (busSegment >= stops.length - 1) {
            busSegment = 0;
        }
    }

    const lat =
        start.lat + (end.lat - start.lat) * busProgress;

    const lng =
        start.lng + (end.lng - start.lng) * busProgress;

    busMarker.setPosition({
        lat: lat,
        lng: lng
    });

    updateBusInfo();
}
function initMap() {
    const center = {
        lat: 25.4358,
        lng: 81.8463
    };

    map = new google.maps.Map(document.getElementById("map"), {
        center: center,
        zoom: 13,
        mapId: "DEMO_MAP_ID"
    });

    document.getElementById("mapStatus").textContent =
        "✅ Google Maps loaded successfully!";

    console.log("Google Maps initialized.");
}

async function checkBackend() {
    const backendStatus = document.getElementById("backendStatus");

    try {
        const response = await fetch(
            "http://localhost:5000/api/health"
        );

        const data = await response.json();

        if (data.success) {
            backendStatus.textContent =
                "✅ Backend connected successfully!";
        } else {
            backendStatus.textContent =
                "⚠️ Backend responded unexpectedly.";
        }

    } catch (error) {
        console.error("Backend error:", error);

        backendStatus.textContent =
            "❌ Backend connection failed.";
    }
}

function loadGoogleMaps() {
    const script = document.createElement("script");

    script.src =
        `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&loading=async&callback=initMap`;

    script.async = true;
    script.defer = true;

    script.onerror = () => {
        document.getElementById("mapStatus").textContent =
            "❌ Failed to load Google Maps.";
    };

    document.head.appendChild(script);
}

function clearRouteFromMap() {
    if (routePolyline) {
        routePolyline.setMap(null);
        routePolyline = null;
    }

    stopMarkers.forEach(marker => {
        marker.setMap(null);
    });

    stopMarkers = [];

    if (busMarker) {
        busMarker.setMap(null);
        busMarker = null;
    }
}

function displayRoute(routeId) {
    if (!map || !routeId || !routes[routeId]) {
        return;
    }

    clearRouteFromMap();

    currentRoute = routes[routeId];

    const path = currentRoute.stops.map(stop => ({
        lat: stop.lat,
        lng: stop.lng
    }));

    // Draw route
    routePolyline = new google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: currentRoute.color,
        strokeOpacity: 0.9,
        strokeWeight: 6,
        map: map
    });

    // Create stop markers
    currentRoute.stops.forEach((stop, index) => {
        const marker = new google.maps.Marker({
            position: {
                lat: stop.lat,
                lng: stop.lng
            },
            map: map,
            title: stop.name,
            label: {
                text: String(index + 1),
                color: "white"
            }
        });

        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div>
                    <strong>${stop.name}</strong><br>
                    Stop ${index + 1}<br>
                    Route ${currentRoute.id}
                </div>
            `
        });

        marker.addListener("click", () => {
            infoWindow.open({
                anchor: marker,
                map
            });
        });

        stopMarkers.push(marker);
    });

    // Demo bus location = first stop
    const firstStop = currentRoute.stops[0];

    busMarker = new google.maps.Marker({
        position: {
            lat: firstStop.lat,
            lng: firstStop.lng
        },
        map: map,
        title: `Bus on ${currentRoute.name}`,
        icon: {
            url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
        }
    });

    // Fit map to route
    const bounds = new google.maps.LatLngBounds();

    path.forEach(point => {
        bounds.extend(point);
    });

    map.fitBounds(bounds);

    startSimulatedBus();

    console.log(`Displayed ${currentRoute.name}`);
}

document.getElementById("routeSelect").addEventListener(
    "change",
    function () {
        displayRoute(this.value);
    }
);

checkBackend();
loadGoogleMaps();