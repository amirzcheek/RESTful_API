const mongoose = require('mongoose');

const quotesDataSchema = new mongoose.Schema({
    quoteType: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    quote: {
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
  
const quotesData = mongoose.model("quotesData", quotesDataSchema);

module.exports = quotesData;