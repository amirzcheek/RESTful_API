const map = L.map('map').setView([0, 0], 2); // Set the initial view to the world

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

function addMarker(lat, lon, city, temperature, description, imageURL) {
    L.marker([lat, lon]).addTo(map)
        .bindPopup(`<b>${city}</b><br>Temperature: ${temperature}°C<br>${description}<br><img src="${imageURL}" width="50" height="50">`)
        .openPopup();
}