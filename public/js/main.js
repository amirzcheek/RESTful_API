function showWeatherDetails(city, temperature, description, imageURL) {
    document.getElementById('cityName').textContent = city;
    document.getElementById('temperature').textContent = temperature;
    document.getElementById('weatherDescription').textContent = description;
    document.getElementById('weatherImage').src = imageURL;

    // Set the display property to 'block' to make the details visible
    document.getElementById('weatherDetails').style.display = 'block';
}

$(document).ready(function () {
    $('#weatherForm').submit(function (event) {
        event.preventDefault();

        const city = $('#city').val();

        $.post('/weather', { city: city }, function (data) {
            $('#weatherDetails').html(data.html).show();

            // If the map div exists, update the map
            if ($('#map').length) {
                updateMap(city);
            }
        });
    });
});

function updateMap(city) {
    $.post('/map', { city: city }, function (data) {
        addMarker(data.lat, data.lon, data.city);
    });
}