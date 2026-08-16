let map;
let currentRoute = null;
const SIMULATED_BUS_NUMBER = "DEMO-01";
let routePolyline = null;
let stopMarkers = [];
let busMarker = null;
let busTimer = null;
let busSegment = 0;
let busProgress = 0;
const SIMULATED_BUS_SPEED_KMH = 30;
const SIMULATION_SPEED_MULTIPLIER = 20;
const SIMULATION_UPDATE_MS = 100;
const BUS_CAPACITY = 50;
let simulatedPassengers = 32;
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

    busTimer = setInterval(
        moveBus,
        SIMULATION_UPDATE_MS
    );
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
function getCrowdLevel(occupancy) {
    if (occupancy <= 40) {
        return "LOW";
    }

    if (occupancy <= 70) {
        return "MEDIUM";
    }

    if (occupancy <= 90) {
        return "HIGH";
    }

    return "FULL";
}
async function saveCrowdRecord(stop) {
    if (!currentRoute || !stop) {
        return;
    }

    console.log(
        `📡 Sending crowd data for ${stop.name}...`
    );

    try {
        const response = await fetch(
            "http://localhost:5000/api/crowd",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    routeId: currentRoute.id,
                    busNumber: SIMULATED_BUS_NUMBER,
                    stopId: stop.id,
                    passengers: simulatedPassengers,
                    capacity: BUS_CAPACITY
                })
            }
        );

        const data = await response.json();

        console.log("Crowd API response:", data);

        if (!response.ok || !data.success) {
            console.error("❌ Crowd record failed:", data);
            return;
        }

        console.log(
            `✅ Crowd saved: ${currentRoute.id} → ${stop.name}`
        );

    } catch (error) {
        console.error("❌ Crowd request error:", error);
    }
}
function updateBusInfo() {
    if (!currentRoute || busSegment >= currentRoute.stops.length - 1) {
        return;
    }

    const stops = currentRoute.stops;

    const start = stops[busSegment];
    const nextStop = stops[busSegment + 1];

    document.getElementById("busRoute").textContent =
        currentRoute.name;

    document.getElementById("currentStop").textContent =
        start.name;

    document.getElementById("nextStop").textContent =
        nextStop.name;

    // Current simulated bus position
    const currentLat =
        start.lat +
        (nextStop.lat - start.lat) * busProgress;

    const currentLng =
        start.lng +
        (nextStop.lng - start.lng) * busProgress;

    // Distance remaining to next stop
    const remainingDistanceKm = calculateDistance(
        currentLat,
        currentLng,
        nextStop.lat,
        nextStop.lng
    );

    // ETA
    const etaHours =
        remainingDistanceKm / SIMULATED_BUS_SPEED_KMH;

    const etaMinutes = etaHours * 60;

    document.getElementById("busSpeed").textContent =
        `${SIMULATED_BUS_SPEED_KMH} km/h`;

    document.getElementById("distance").textContent =
        `${remainingDistanceKm.toFixed(2)} km`;

    document.getElementById("eta").textContent =
        etaMinutes < 1
            ? `${Math.max(1, Math.ceil(etaMinutes * 60))} sec`
            : `${etaMinutes.toFixed(1)} min`;

    const occupancy =
        (simulatedPassengers / BUS_CAPACITY) * 100;

    const crowdLevel = getCrowdLevel(occupancy);

    document.getElementById("passengers").textContent =
        simulatedPassengers;

    document.getElementById("capacity").textContent =
        BUS_CAPACITY;

    document.getElementById("occupancy").textContent =
        `${occupancy.toFixed(0)}%`;

    document.getElementById("crowdLevel").textContent =
        crowdLevel;
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
function simulatePassengerChange() {
    const change = Math.floor(Math.random() * 11) - 5;

    simulatedPassengers += change;

    if (simulatedPassengers < 0) {
        simulatedPassengers = 0;
    }

    if (simulatedPassengers > BUS_CAPACITY) {
        simulatedPassengers = BUS_CAPACITY;
    }
}
function calculateDistance(lat1, lon1, lat2, lon2) {
    const earthRadiusKm = 6371;

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c =
        2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadiusKm * c;
}

function toRadians(degrees) {
    return degrees * Math.PI / 180;
}
function moveBus() {
    if (!currentRoute || !busMarker) {
        return;
    }

    const stops = currentRoute.stops;

    const start = stops[busSegment];
    const end = stops[busSegment + 1];

    const distanceKm = calculateDistance(
        start.lat,
        start.lng,
        end.lat,
        end.lng
    );

    const speedKmPerMs =
        SIMULATED_BUS_SPEED_KMH / 3600000;

    const distancePerUpdate =
        speedKmPerMs *
        SIMULATION_UPDATE_MS *
        SIMULATION_SPEED_MULTIPLIER;

    if (distanceKm > 0) {
        busProgress += distancePerUpdate / distanceKm;
    }

    if (busProgress >= 1) {
        const arrivedStop = end;

        busProgress = 0;

        simulatePassengerChange();

        console.log(
            `🚌 Bus reached: ${arrivedStop.name}`
        );

        saveCrowdRecord(arrivedStop);

        busSegment++;

        if (busSegment >= stops.length - 1) {
            busSegment = 0;

            console.log(
                "🔄 Route completed. Restarting..."
            );
        }
    }

    const currentStart = stops[busSegment];
    const currentEnd = stops[busSegment + 1];

    const lat =
        currentStart.lat +
        (currentEnd.lat - currentStart.lat) * busProgress;

    const lng =
        currentStart.lng +
        (currentEnd.lng - currentStart.lng) * busProgress;

    busMarker.setPosition({
        lat,
        lng
    });

    updateBusInfo();
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