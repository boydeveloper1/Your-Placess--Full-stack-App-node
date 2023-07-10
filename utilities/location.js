const axios = require("axios");

const ExpressError = require("./ExpressError");

const API_KEY = process.env.GOOGLE_API_KEY;
//AIzaSyBaIUoPpBsBLWhUrBl_FcfBpv912CKo6pM;

// axios is used for sending http request from frontend to backend and also from a node sever

const getCoordsForAddress = async (address) => {
  const response = await axios.get(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${API_KEY}`
  );

  const data = response.data;
  if (!data || data.status === "ZERO_RESULTS") {
    const error = new ExpressError(
      "Could not find location for the specified address",
      422
    );
    throw error;
  }
  const coordinates = data.results[0].geometry.location;
  return coordinates;
};

module.exports = getCoordsForAddress;
