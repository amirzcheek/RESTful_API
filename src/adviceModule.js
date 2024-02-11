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