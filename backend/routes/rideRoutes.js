const express = require("express");
const router = express.Router();

const { 
  requestRide, 
  getDriverState, 
  cancelRide,
  passengerConfirmGroup,
  driverAcceptGroup,
  passengerFinalConfirm,
  startJourney,
  setDriverLocation
} = require("../controllers/rideController");

router.post("/request", requestRide);
router.post("/cancel", cancelRide);

router.get("/driver/state", getDriverState);
router.post("/driver/location", setDriverLocation);

router.post("/group/passenger_confirm", passengerConfirmGroup);
router.post("/group/driver_accept", driverAcceptGroup);
router.post("/group/passenger_final_confirm", passengerFinalConfirm);
router.post("/driver/start_journey", startJourney);

module.exports = router;