const mongoose = require('mongoose');

const uri = "mongodb+srv://myAtlasDBUser:1@myatlasclusteredu.pjc0lgr.mongodb.net/weatherApi?retryWrites=true&w=majority";

const connectToMongoDB = async () => {
    try {
      await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log("Connected to MongoDB Atlas");
    } catch (error) {
      console.error("Error connecting to MongoDB Atlas:", error);
      process.exit(1);
    }
  };

const closeDB = () => {
    mongoose.disconnect();
    console.log("DB disconnected")
}

module.exports = {connectToMongoDB, closeDB}