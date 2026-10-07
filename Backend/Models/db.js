require('dotenv').config();
const mongoose = require('mongoose');

const mongo_url = process.env.MONGO_CONN;

console.log("Mongo URL =>", mongo_url); // debug

mongoose.connect(mongo_url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log("MongoDB Connected");
})
.catch((err) => {
    console.error("MongoDB Connection Error:", err.message);
});
