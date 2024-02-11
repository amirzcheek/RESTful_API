const mongoose = require('mongoose');

const uri = "mongodb+srv://myAtlasDBUser:1@myatlasclusteredu.pjc0lgr.mongodb.net/weatherApi?retryWrites=true&w=majority";

const connect = mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

connect.then(() => {
})
.catch((err) => {
    console.error("Error connecting to MongoDB Atlas:", err);
  });

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