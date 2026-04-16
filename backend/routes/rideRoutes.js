const express = require("express");
const router = express.Router();

const { requestRide, getDriverState, acceptRideList, updateDriverLocation, cancelRide } = require("../controllers/rideController");

// Disable protect temporarily while testing dynamic flow
router.post("/request", requestRide);
router.post("/cancel", cancelRide);
router.get("/driver/state", getDriverState);
router.post("/driver/accept", acceptRideList);
router.post("/driver/location", updateDriverLocation);

module.exports = router;