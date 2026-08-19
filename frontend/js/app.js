// ============================================================
// BUS TRACKER - MAIN APP
// Map + Routes + Road Routing + Simulator + Live GPS
// ============================================================

let map = null;
let currentRoute = null;

let routePolyline = null;
let stopMarkers = [];

let busMarker = null;
let liveBusMarker = null;
let busTimer = null;

let busSegment = 0;
let busProgress = 0;

// Road-following simulation
let roadSegment = 0;
let roadProgress = 0;
let roadPath = [];

let liveGpsActive = false;

let passengerSocket = null;
const BACKEND_URL ="https://bus-tracker-and-crowd-prediction.onrender.com";

// ============================================================
// CONFIG
// ============================================================

const SIMULATED_BUS_NUMBER = "DEMO-01";

const SIMULATED_BUS_SPEED_KMH = 30;
const SIMULATION_SPEED_MULTIPLIER = 5;
const SIMULATION_UPDATE_MS = 100;

const BUS_CAPACITY = 50;

let simulatedPassengers = 32;


// ============================================================
// GOOGLE MAP INITIALIZATION
// ============================================================

function initMap() {

    const mapElement =
        document.getElementById("map");

    if (!mapElement) {
        console.error("❌ #map not found.");
        return;
    }

    const center = {
        lat: 25.4358,
        lng: 81.8463
    };

    map = new google.maps.Map(
        mapElement,
        {
            center,
            zoom: 13,
            mapId: "DEMO_MAP_ID"
        }
    );

    // Make map available to the whole application
    window.busMap = map;
    window.map = map;

    const mapStatus =
        document.getElementById("mapStatus");

    if (mapStatus) {
        mapStatus.textContent =
            "✅ Google Maps loaded successfully!";
    }

    console.log(
        "✅ Google Maps initialized."
    );

    // If a GPS packet arrived before the map loaded
    if (window.pendingGpsLocation) {
        updateLiveGpsMarker(
            window.pendingGpsLocation
        );
    }
}

window.initMap = initMap;


// ============================================================
// LOAD GOOGLE MAPS
// ============================================================

function loadGoogleMaps() {

    if (
        typeof GOOGLE_MAPS_API_KEY ===
        "undefined"
    ) {

        console.error(
            "❌ Google Maps API key is missing."
        );

        return;
    }

    if (
        document.querySelector(
            'script[data-google-maps="true"]'
        )
    ) {
        return;
    }

    const script =
        document.createElement("script");

    script.dataset.googleMaps =
        "true";

    script.src =
        `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&loading=async&callback=initMap`;

    script.async = true;
    script.defer = true;

    script.onerror = () => {

        const status =
            document.getElementById(
                "mapStatus"
            );

        if (status) {
            status.textContent =
                "❌ Failed to load Google Maps.";
        }
    };

    document.head.appendChild(script);
}


// ============================================================
// DISTANCE
// ============================================================

function calculateDistance(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const earthRadiusKm = 6371;

    const dLat =
        toRadians(lat2 - lat1);

    const dLon =
        toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) ** 2;

    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

    return earthRadiusKm * c;
}

function toRadians(value) {
    return value * Math.PI / 180;
}


// ============================================================
// CROWD
// ============================================================

function getCrowdLevel(occupancy) {

    if (occupancy <= 40) return "LOW";
    if (occupancy <= 70) return "MEDIUM";
    if (occupancy <= 90) return "HIGH";

    return "FULL";
}


function updateCrowdVisual(level) {

    const badge =
        document.getElementById(
            "crowdLevel"
        );

    const bar =
        document.getElementById(
            "occupancyBar"
        );

    if (!badge || !bar) return;

    badge.textContent = level;

    if (level === "LOW") {

        badge.style.background = "#e9f9f1";
        badge.style.color = "#168f61";
        bar.style.background = "#16b878";

    } else if (level === "MEDIUM") {

        badge.style.background = "#fff3d8";
        badge.style.color = "#a56f09";
        bar.style.background = "#f1ae2e";

    } else if (level === "HIGH") {

        badge.style.background = "#fff0df";
        badge.style.color = "#c9671f";
        bar.style.background = "#e57a2e";

    } else {

        badge.style.background = "#ffe5e5";
        badge.style.color = "#d63f3f";
        bar.style.background = "#e44f4f";
    }
}


function updatePassengerCrowdUI() {

    const occupancy =
        document.getElementById("occupancy");

    const passengers =
        document.getElementById("passengers");

    const capacity =
        document.getElementById("capacity");

    const level =
        document.getElementById("crowdLevel");

    const bar =
        document.getElementById("occupancyBar");

    if (
        !occupancy ||
        !passengers ||
        !capacity ||
        !level ||
        !bar
    ) {
        return;
    }

    const percentage =
        (
            simulatedPassengers /
            BUS_CAPACITY
        ) * 100;

    const crowd =
        getCrowdLevel(percentage);

    occupancy.textContent =
        `${Math.round(percentage)}%`;

    passengers.textContent =
        simulatedPassengers;

    capacity.textContent =
        BUS_CAPACITY;

    level.textContent =
        crowd;

    bar.style.width =
        `${Math.min(100, percentage)}%`;

    updateCrowdVisual(crowd);
}


// ============================================================
// BUS INFO
// ============================================================

function updateBusInfo() {

    if (
        !currentRoute ||
        currentRoute.stops.length < 2
    ) {
        return;
    }

    const stops =
        currentRoute.stops;

    const start =
        stops[busSegment];

    const end =
        stops[busSegment + 1];

    if (!start || !end) {
        return;
    }

    const route =
        document.getElementById("busRoute");

    const current =
        document.getElementById("currentStop");

    const next =
        document.getElementById("nextStop");

    const speed =
        document.getElementById("busSpeed");

    const distance =
        document.getElementById("distance");

    const eta =
        document.getElementById("eta");

    if (route) {
        route.textContent =
            currentRoute.name;
    }

    if (current) {
        current.textContent =
            start.name;
    }

    if (next) {
        next.textContent =
            end.name;
    }

    const currentLat =
        start.lat +
        (end.lat - start.lat) *
        busProgress;

    const currentLng =
        start.lng +
        (end.lng - start.lng) *
        busProgress;

    const remaining =
        calculateDistance(
            currentLat,
            currentLng,
            end.lat,
            end.lng
        );

    const etaMinutes =
        (
            remaining /
            SIMULATED_BUS_SPEED_KMH
        ) * 60;

    if (speed) {
        speed.textContent =
            `${SIMULATED_BUS_SPEED_KMH} km/h`;
    }

    if (distance) {
        distance.textContent =
            `${remaining.toFixed(2)} km`;
    }

    if (eta) {

        eta.textContent =
            etaMinutes < 1
                ? `${Math.max(
                    1,
                    Math.ceil(
                        etaMinutes * 60
                    )
                )} sec`
                : `${etaMinutes.toFixed(1)} min`;
    }
}


// ============================================================
// STOP CLEANUP
// ============================================================

function clearRouteFromMap() {

    stopSimulatedBus();

    if (routePolyline) {

        routePolyline.setMap(null);

        routePolyline = null;
    }

    stopMarkers.forEach(
        marker => marker.setMap(null)
    );

    stopMarkers = [];
}


// ============================================================
// SIMULATED BUS
// ============================================================

// ============================================================
// START SIMULATED BUS
// ============================================================

function startSimulatedBus() {

    if (
        !currentRoute ||
        !map ||
        liveGpsActive
    ) {
        return;
    }

    stopSimulatedBus();

    // Reset road position
    roadSegment = 0;
    roadProgress = 0;

    const roadPath =
        window.currentRoadPath || [];

    if (roadPath.length < 2) {

        console.error(
            "❌ OSRM road path is not available."
        );

        return;
    }

    const firstPoint =
        roadPath[0];

    busMarker =
        new google.maps.Marker({

            position: {
                lat: firstPoint.lat,
                lng: firstPoint.lng
            },

            map: map,

            title:
                `Bus on ${currentRoute.name}`,

            icon: {
                url:
                    "https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
            },

            zIndex: 500
        });

    updateBusInfo();
    updatePassengerCrowdUI();

    moveBus();

    busTimer =
        setInterval(
            moveBus,
            SIMULATION_UPDATE_MS
        );

    console.log(
        "🚌 Road-following bus simulation started."
    );
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


// ============================================================
// MOVE SIMULATED BUS
// ============================================================

// ============================================================
// MOVE BUS ALONG ACTUAL ROAD
// ============================================================

function moveBus() {

    if (
        !busMarker ||
        liveGpsActive
    ) {
        return;
    }

    const roadPath =
        window.currentRoadPath || [];

    if (roadPath.length < 2) {
        return;
    }

    // Distance travelled in this update
    const speedKmPerMs =
        SIMULATED_BUS_SPEED_KMH /
        3600000;

    let remainingDistance =
        speedKmPerMs *
        SIMULATION_UPDATE_MS *
        SIMULATION_SPEED_MULTIPLIER;


    // Move across as many small road segments
    // as necessary during this update
    while (
        remainingDistance > 0 &&
        roadSegment < roadPath.length - 1
    ) {

        const start =
            roadPath[roadSegment];

        const end =
            roadPath[roadSegment + 1];

        const segmentDistance =
            calculateDistance(
                start.lat,
                start.lng,
                end.lat,
                end.lng
            );

        // Ignore zero-length points
        if (segmentDistance <= 0) {

            roadSegment++;
            roadProgress = 0;

            continue;
        }

        const remainingSegmentDistance =
            segmentDistance *
            (1 - roadProgress);


        // We can reach the next OSRM point
        if (
            remainingDistance >=
            remainingSegmentDistance
        ) {

            remainingDistance -=
                remainingSegmentDistance;

            roadSegment++;
            roadProgress = 0;

        } else {

            // We remain inside this segment
            roadProgress +=
                remainingDistance /
                segmentDistance;

            remainingDistance = 0;
        }
    }


    // Route finished
    if (
        roadSegment >=
        roadPath.length - 1
    ) {

        console.log(
            "🔄 Road route completed. Restarting..."
        );

        roadSegment = 0;
        roadProgress = 0;
    }


    const start =
        roadPath[roadSegment];

    const end =
        roadPath[roadSegment + 1];

    if (!start || !end) {
        return;
    }


    // Exact position between two OSRM points
    const lat =
        start.lat +
        (
            end.lat -
            start.lat
        ) *
        roadProgress;

    const lng =
        start.lng +
        (
            end.lng -
            start.lng
        ) *
        roadProgress;


    busMarker.setPosition({
        lat,
        lng
    });


    // Keep the old UI working
    updateBusInfo();
    updatePassengerCrowdUI();
}
// ============================================================
// ROAD-FOLLOWING ROUTE
// ============================================================

async function drawRoadRoute() {

    if (
        !map ||
        !currentRoute ||
        currentRoute.stops.length < 2
    ) {
        return;
    }

    const coordinates =
        currentRoute.stops
            .map(
                stop =>
                    `${stop.lng},${stop.lat}`
            )
            .join(";");

    const url =
        `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=true`;

    try {

        console.log(
            "🛣️ Requesting OSRM road route..."
        );

        const response =
            await fetch(url);

        if (!response.ok) {
            throw new Error(
                `OSRM HTTP ${response.status}`
            );
        }

        const data =
            await response.json();

        if (
            data.code !== "Ok" ||
            !data.routes ||
            !data.routes.length
        ) {

            throw new Error(
                `OSRM error: ${data.code}`
            );
        }

        const route =
            data.routes[0];


        // Remove old route
        if (routePolyline) {

            routePolyline.setMap(null);

            routePolyline = null;
        }


        // OSRM returns:
        // [longitude, latitude]

        const roadPath =
            route.geometry.coordinates.map(
                coordinate => ({
                    lat:
                        coordinate[1],

                    lng:
                        coordinate[0]
                })
            );


        routePolyline =
            new google.maps.Polyline({

                path: roadPath,

                geodesic: false,

                strokeColor:
                    currentRoute.color,

                strokeOpacity:
                    0.9,

                strokeWeight:
                    6,

                map
            });


        console.log(
            "✅ OSRM ROAD ROUTE CREATED"
        );

        console.log(
            `🛣️ Distance: ${
                (route.distance / 1000)
                    .toFixed(2)
            } km`
        );

        console.log(
            `⏱️ Duration: ${
                Math.round(
                    route.duration / 60
                )
            } min`
        );


        // Save road geometry
        // for later live-bus movement
        window.currentRoadPath =
            roadPath;

        window.currentRoadRoute =
            route;


    } catch (error) {

        console.error(
            "❌ OSRM routing failed:",
            error
        );

        drawFallbackRoute();
    }
}

function drawFallbackRoute() {

    const path =
        currentRoute.stops.map(
            stop => ({
                lat: stop.lat,
                lng: stop.lng
            })
        );

    routePolyline =
        new google.maps.Polyline({
            path,
            geodesic: true,
            strokeColor:
                currentRoute.color,
            strokeOpacity: 0.9,
            strokeWeight: 6,
            map
        });

    // Important: allow the simulator
    // to continue even if OSRM fails.
    window.currentRoadPath = path;

    console.warn(
        "⚠️ Using fallback straight-line route."
    );
}


// ============================================================
// DISPLAY ROUTE
// ============================================================

// ============================================================
// DISPLAY ROUTE
// ============================================================

async function displayRoute(routeId) {

    if (
        !map ||
        !routeId ||
        !routes[routeId]
    ) {
        return;
    }

    clearRouteFromMap();

    currentRoute =
        routes[routeId];

    busSegment = 0;
    busProgress = 0;

    roadSegment = 0;
    roadProgress = 0;

    window.currentRoadPath = [];


    // Stop markers
    currentRoute.stops.forEach(
        (stop, index) => {

            const marker =
                new google.maps.Marker({

                    position: {
                        lat: stop.lat,
                        lng: stop.lng
                    },

                    map: map,

                    title: stop.name,

                    label: {
                        text:
                            String(index + 1),
                        color:
                            "white"
                    },

                    zIndex: 100
                });


            const infoWindow =
                new google.maps.InfoWindow({

                    content: `
                        <div style="padding:5px">
                            <strong>
                                ${stop.name}
                            </strong>
                            <br>
                            Stop ${index + 1}
                            <br>
                            ${currentRoute.name}
                        </div>
                    `
                });


            marker.addListener(
                "click",
                () => {

                    infoWindow.open({
                        anchor: marker,
                        map: map
                    });
                }
            );


            stopMarkers.push(marker);
        }
    );


    // Fit map
    const bounds =
        new google.maps.LatLngBounds();

    currentRoute.stops.forEach(
        stop => {

            bounds.extend({
                lat: stop.lat,
                lng: stop.lng
            });
        }
    );

    map.fitBounds(bounds);


    // IMPORTANT:
    // Wait for OSRM before starting bus
    await drawRoadRoute();


    if (
        !liveGpsActive &&
        window.currentRoadPath &&
        window.currentRoadPath.length >= 2
    ) {

        startSimulatedBus();
    }


    updateBusInfo();
    updatePassengerCrowdUI();

    console.log(
        `✅ Displayed ${currentRoute.name}`
    );
}
// ============================================================
// ROUTE SELECTOR
// ============================================================

function setupRouteSelector() {

    const select =
        document.getElementById(
            "routeSelect"
        );

    if (!select) {
        return;
    }

    select.addEventListener(
        "change",
        async function () {

            if (!this.value) {
                return;
            }

            liveGpsActive = false;

            if (liveBusMarker) {

                liveBusMarker.setMap(null);

                liveBusMarker = null;
            }

            roadSegment = 0;
            roadProgress = 0;

            window.currentRoadPath = [];

            await displayRoute(
                this.value
            );

            await loadLatestCrowdData();
        }
    );
}


// ============================================================
// REAL-TIME GPS
// ============================================================

function connectLiveBusTracking() {

    if (passengerSocket) {
        return;
    }

    if (typeof window.io !== "function") {

        console.error(
            "❌ Socket.IO client not loaded."
        );

        return;
    }

    passengerSocket =
        window.io(BACKEND_URL);
    passengerSocket.on(
        "connect",
        function () {

            console.log(
                "✅ Passenger GPS connected."
            );
        }
    );

    passengerSocket.on(
        "connect_error",
        function (error) {

            console.error(
                "❌ GPS connection error:",
                error.message
            );
        }
    );

    passengerSocket.on(
        "disconnect",
        function () {

            console.log(
                "❌ Passenger GPS disconnected."
            );
        }
    );

    passengerSocket.on(
        "busLocation",
        function (data) {

            console.log(
                "📍 GPS RECEIVED:",
                data
            );

            window.pendingGpsLocation = data;

            updateLiveGpsMarker(data);
        }
    );
}


function updateLiveGpsMarker(data) {

    if (!data) {
        return;
    }

    const lat =
        Number(data.latitude);

    const lng =
        Number(data.longitude);

    if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng)
    ) {

        console.error(
            "❌ Invalid GPS data:",
            data
        );

        return;
    }


    // Map may not be ready yet
    if (!map) {

        console.log(
            "⏳ GPS received before map was ready."
        );

        window.pendingGpsLocation = data;

        return;
    }


    const position = {
        lat: lat,
        lng: lng
    };


    // ========================================================
    // REAL GPS TAKES CONTROL
    // ========================================================

    liveGpsActive = true;


    // Stop simulated bus
    stopSimulatedBus();


    // ========================================================
    // CREATE LIVE MARKER
    // ========================================================

    if (!liveBusMarker) {

        liveBusMarker =
            new google.maps.Marker({

                position: position,

                map: map,

                title:
                    `Live Bus ${
                        data.busNumber ||
                        "Bus"
                    }`,

                icon: {
                    url:
                        "https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                },

                zIndex: 9999
            });

        console.log(
            "🚌 LIVE GPS MARKER CREATED"
        );

    } else {

        // Move existing marker
        liveBusMarker.setPosition(
            position
        );
    }


    // ========================================================
    // CENTER MAP ON FIRST LIVE LOCATION
    // ========================================================

    map.panTo(position);


    // Don't zoom repeatedly
    if (map.getZoom() < 15) {

        map.setZoom(15);
    }


    // ========================================================
    // UPDATE STATUS
    // ========================================================

    const mapStatus =
        document.getElementById(
            "mapStatus"
        );

    if (mapStatus) {

        mapStatus.textContent =
            "🟢 Live GPS tracking active";
    }


    console.log(
        "📍 LIVE BUS POSITION:",
        lat,
        lng
    );
}

// ============================================================
// CROWD API
// ============================================================

async function loadLatestCrowdData() {

    if (!currentRoute) {
        return;
    }

    try {

        const response =
            await fetch(`${BACKEND_URL}/api/crowd`);

        const result =
            await response.json();

        if (
            !response.ok ||
            !result.success
        ) {
            return;
        }

        const records =
            result.data || [];

        const latest =
            records.find(
                record =>
                    record.routeId ===
                        currentRoute.id &&

                    record.busNumber ===
                        SIMULATED_BUS_NUMBER
            );

        if (!latest) {
            return;
        }

        simulatedPassengers =
            latest.passengers;

        updatePassengerCrowdUI();

    } catch (error) {

        console.error(
            "Crowd loading error:",
            error
        );
    }
}


// ============================================================
// BACKEND STATUS
// ============================================================

async function checkBackend() {

    const element =
        document.getElementById(
            "backendStatus"
        );

    if (!element) {
        return;
    }

    try {

        const response =
            await fetch(`${BACKEND_URL}/api/health`);

        const data =
            await response.json();

        if (data.success) {

            element.textContent =
                "✅ Backend connected successfully!";

        } else {

            element.textContent =
                "⚠️ Backend responded unexpectedly.";
        }

    } catch (error) {

        console.error(
            "Backend error:",
            error
        );

        element.textContent =
            "❌ Backend connection failed.";
    }
}


// ============================================================
// START APP
// ============================================================

setupRouteSelector();

checkBackend();

connectLiveBusTracking();

loadGoogleMaps();


// Refresh crowd
setInterval(
    () => {

        if (currentRoute) {

            loadLatestCrowdData();
        }

    },
    5000
);