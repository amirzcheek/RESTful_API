const mongoose = require('mongoose');

const weatherDataSchema = new mongoose.Schema({
    city: {
        type: String,
        required: true
    },
    temperature: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    feelsLikeTemp: {
        type: Number,
        required: true
    },
    humidity: {
        type: Number,
        required: true
    },
    pressure: {
        type: Number,
        required: true
    },
    windSpeed: {
        type: Number,
        required: true
    },
    countryCode: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
  });
  
const WeatherData = mongoose.model("WeatherData", weatherDataSchema);

module.exports = WeatherData;