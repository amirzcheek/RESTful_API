const mongoose = require('mongoose');

const weatherDataSchema = new mongoose.Schema({
    city: { type: String, required: true },
    temperature: { type: Number, required: true },
    description: { type: String, required: true },
    feelsLikeTemp: { type: Number, required: true },
    humidity: { type: Number, required: true },
    pressure: { type: Number, required: true },
    windSpeed: { type: Number, required: true },
    countryCode: { type: String, required: true }
});

const WeatherData = mongoose.model('WeatherData', weatherDataSchema);

module.exports = WeatherData;