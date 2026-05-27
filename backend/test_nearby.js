const axios = require("axios");

axios.get("http://localhost:3005/api/rides/nearby-drivers", {
  params: {
    latitude: -23.55052,
    longitude: -46.633308,
    radius: 7000
  }
})
.then(res => {
  console.log("Success! Status:", res.status);
  console.log("Data:", res.data);
})
.catch(err => {
  console.error("Error! Code:", err.code);
  if (err.response) {
    console.error("Response status:", err.response.status);
    console.error("Response data:", err.response.data);
  } else {
    console.error("No response received!");
  }
});
