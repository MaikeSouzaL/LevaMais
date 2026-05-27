const mongoose = require("mongoose");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const axios = require("axios");

dotenv.config();

const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/leva-mais";
console.log("Connecting to MongoDB:", mongoUri);

mongoose.connect(mongoUri)
  .then(async () => {
    console.log("Connected successfully!");
    const User = require("./src/models/User");
    
    // Find any user
    const user = await User.findOne({ userType: "client" });
    if (!user) {
      console.error("No client user found in database!");
      process.exit(1);
    }
    
    console.log("Found user:", user.email, "ID:", user._id);
    
    // Generate token
    const token = jwt.sign(
      { id: String(user._id), userType: "client" },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );
    
    console.log("Generated token:", token);
    
    try {
      console.log("Calling getNearbyDrivers endpoint...");
      const res = await axios.get("http://localhost:3005/api/rides/nearby-drivers", {
        params: {
          latitude: -23.55052,
          longitude: -46.633308,
          radius: 7000
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log("Success! Status:", res.status);
      console.log("Data:", res.data);
      process.exit(0);
    } catch (err) {
      console.error("Error calling endpoint:", err.message);
      if (err.response) {
        console.error("Response status:", err.response.status);
        console.error("Response data:", err.response.data);
      }
      process.exit(1);
    }
  })
  .catch(err => {
    console.error("Connection error:", err);
    process.exit(1);
  });
