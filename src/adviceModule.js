const mongoose = require('mongoose');

const adviceDataSchema = new mongoose.Schema({
    advice_id: {
        type: Number,
        required: true
    },
    advice: {
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
  
const adviceData = mongoose.model("adviceData", adviceDataSchema);

module.exports = adviceData;