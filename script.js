let map;
let directionsService;
let directionsRenderer;

// Initialize the Google Map
function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 13.0827, lng: 80.2707 }, // Center map on Chennai
        zoom: 10,
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

    initAutocomplete();
}

function initAutocomplete() {
    const sourceInput = document.getElementById("source");
    const destinationInput = document.getElementById("destination");

    const sourceAutocomplete = new google.maps.places.Autocomplete(sourceInput);
    const destinationAutocomplete = new google.maps.places.Autocomplete(destinationInput);

    sourceAutocomplete.setFields(["geometry", "name"]);
    destinationAutocomplete.setFields(["geometry", "name"]);
}

// Fetch route details using Google Maps Directions API
async function getRoute(source, destination) {
    if (!directionsService) {
        console.error("DirectionsService not initialized");
        document.getElementById("details").textContent = "Map service is not ready yet.";
        return;
    }

    try {
        const request = {
            origin: source,
            destination: destination,
            travelMode: google.maps.TravelMode.TRANSIT,
        };

        directionsService.route(request, (result, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
                directionsRenderer.setDirections(result);
                displayBusRoutes(result, destination);
            } else {
                console.error("Error fetching route:", status);
                document.getElementById("details").textContent = `No route found. Status: ${status}`;
            }
        });
    } catch (error) {
        console.error("Error fetching route details:", error);
        document.getElementById("details").textContent = "Error fetching route details.";
    }
}

// Display bus routes from the directions response and calculate distances
function displayBusRoutes(result, destination) {
    const detailsDiv = document.getElementById("details");
    detailsDiv.innerHTML = ""; // Clear previous details

    const routeLeg = result.routes[0].legs[0];
    const steps = routeLeg.steps;
    const busRoutes = [];

    let finalBusStopLocation = null;
    let totalDistance = routeLeg.distance.text;
    let totalTime = routeLeg.duration.text;

    steps.forEach((step) => {
        if (step.travel_mode === "TRANSIT" && step.transit) {
            const transitDetails = step.transit;

            if (transitDetails.line.vehicle.type === "BUS") {
                // Extract main bus details
                const busInfo = `
                    
                        <div style="margin-left: 15%; margin-right: 15%; margin-top: 2%">
    <div style="display: flex; justify-content: space-between;">
        <div style="padding: 8px; margin-bottom: 8px; border-radius: 5px; background: linear-gradient(to bottom, #a64db6, #810CA8); box-shadow: inset 0px 1px 5px rgba(255,255,255,0.8); color: #fff;">
            <strong>From:</strong> ${transitDetails.departure_stop.name}
        </div>
        <div style="padding: 8px; margin-bottom: 8px; border-radius: 5px; background: linear-gradient(to bottom, #a64db6, #810CA8); box-shadow: inset 0px 1px 5px rgba(255,255,255,0.8); color: #fff;">
            <strong>To:</strong> ${transitDetails.arrival_stop.name}
        </div>
    </div>
    <div style="display: flex; justify-content: space-between;">
        <div style="padding: 8px; margin-bottom: 8px; border-radius: 5px; background: linear-gradient(to bottom, #a64db6, #810CA8); box-shadow: inset 0px 1px 5px rgba(255,255,255,0.8); color: #fff;">
            <strong>Departure Time:</strong> ${transitDetails.departure_time.text}
        </div>
        <div style="padding: 8px; margin-bottom: 8px; border-radius: 5px; background: linear-gradient(to bottom, #a64db6, #810CA8); box-shadow: inset 0px 1px 5px rgba(255,255,255,0.8); color: #fff;">
            <strong>Arrival Time:</strong> ${transitDetails.arrival_time.text}
        </div>
    </div>
    <div style="display: flex; justify-content: space-between;">
        <div style="padding: 8px; margin-bottom: 8px; border-radius: 5px; background: linear-gradient(to bottom, #a64db6, #810CA8); box-shadow: inset 0px 1px 5px rgba(255,255,255,0.8); color: #fff;">
            <strong>Bus Number:</strong> ${transitDetails.line.short_name}
        </div>
        <div style="padding: 8px; margin-bottom: 8px; border-radius: 5px; background: linear-gradient(to bottom, #a64db6, #810CA8); box-shadow: inset 0px 1px 5px rgba(255,255,255,0.8); color: #fff;">
            <strong>Total Stops:</strong> ${transitDetails.num_stops}
        </div>
    </div>
</div>

                   




                `;
                busRoutes.push(busInfo);

                // Capture the final bus stop's location
                finalBusStopLocation = transitDetails.arrival_stop.location;
            }
        }
    });

    // Calculate distance from final bus stop to the destination
    if (finalBusStopLocation) {
        const destinationLatLng = new google.maps.LatLng(destination.lat(), destination.lng());
        const finalBusStopLatLng = new google.maps.LatLng(finalBusStopLocation.lat(), finalBusStopLocation.lng());

        const distanceToDestination = google.maps.geometry.spherical.computeDistanceBetween(finalBusStopLatLng, destinationLatLng) / 1000; // in km

        if (distanceToDestination > 2) {
            alert("The final bus stop is more than 2 km away from your destination. Consider taking a shared auto.");
        }

        busRoutes.push(`
            <div>
    <div style="color: white; display: flex; justify-content: center;">
        <strong>Distance from Bus Stop to Destination:</strong> ${distanceToDestination.toFixed(2)} km
    </div>
    <div style="color: white; display: flex; justify-content: center;">
        <strong>Total Distance:</strong> ${totalDistance} <br>
    </div>
    <div style="color: white; display: flex; justify-content: center;">
        <strong>Total Time:</strong> ${totalTime}
    </div>
</div>
        `);
    }

    // Display all bus route and stops information
    if (busRoutes.length > 0) {
        detailsDiv.innerHTML = busRoutes.join("<hr>");
    } else {
        detailsDiv.textContent = "No bus routes found for the given route.";
    }
}

// Handle form submission to fetch the route
document.getElementById("routeForm").addEventListener("submit", function (e) {
    e.preventDefault();
    const source = document.getElementById("source").value.trim();
    const destination = document.getElementById("destination").value.trim();

    if (source && destination) {
        getGeocodedLocations(source, destination);
    } else {
        document.getElementById("details").textContent = "Please enter both source and destination.";
    }
});

// Geocode the locations to get their lat/lng coordinates
function getGeocodedLocations(source, destination) {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: source }, (sourceResults, status) => {
        if (status === google.maps.GeocoderStatus.OK) {
            geocoder.geocode({ address: destination }, (destinationResults, status) => {
                if (status === google.maps.GeocoderStatus.OK) {
                    getRoute(sourceResults[0].geometry.location, destinationResults[0].geometry.location);
                }
            });
        }
    });
}

// Ensure the map initializes properly
window.initMap = initMap;
