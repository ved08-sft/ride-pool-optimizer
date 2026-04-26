const state = require("../data/state");

const reqIdGenerator = () => Math.floor(Math.random() * 1000000);

const requestRide = async (req, res) => {
  const { pickup_x, pickup_y, drop_x, drop_y, name, pickupId, dropId, age, gender } = req.body;
  
  const reqId = reqIdGenerator();
  state.requests[reqId] = {
      id: reqId,
      name: name || "Passenger",
      age: age || "N/A",
      gender: gender || "N/A",
      pickup_x, pickup_y, drop_x, drop_y,
      pickupId, dropId,
      status: "REQUESTED", // New State
      requestedAt: Date.now()
  };
  
  res.json({ message: "Ride requested, pending grouping...", request: state.requests[reqId] });
};

const getDriverState = (req, res) => {
  const driverId = req.query.driverId || 'driver-1';
  const driver = state.drivers[driverId]; 
  res.json({
      driver,
      // Provide active driver opportunities
      groups: state.groups
  });
};

const cancelRide = (req, res) => {
    const { reqId } = req.body;

    if (state.requests[reqId]) {
        state.requests[reqId].status = "CANCELLED";
        
        // Find if they are in an active group and dismantle it
        Object.values(state.groups).forEach(group => {
            if (group.passengers.includes(reqId) && group.status !== "DISBANDED" && group.status !== "SIMULATION_START") {
                group.status = "DISBANDED";
                // Re-queue the other passengers in this group
                group.passengers.forEach(pid => {
                    if (pid !== reqId && state.requests[pid]) {
                        state.requests[pid].status = "REQUESTED";
                        if (req.io) req.io.to(`passenger_${pid}`).emit("group_disbanded", { message: "A co-passenger cancelled their ride." });
                    }
                });
                
                // If a driver was assigned or pending, notify them
                if (group.assignedDriver) {
                     if (req.io) req.io.to(`driver_${group.assignedDriver}`).emit("group_disbanded", { message: "A passenger cancelled the ride." });
                     if (state.drivers[group.assignedDriver] && state.drivers[group.assignedDriver].status === "assigned") {
                         state.drivers[group.assignedDriver].status = "idle";
                         state.drivers[group.assignedDriver].activeRoute = [];
                         state.drivers[group.assignedDriver].passengersMap = {};
                     }
                }
            }
        });
        
        // Ensure to tell drivers to refresh
        if (req.io) req.io.emit("driver_opportunities_updated");
    }

    res.json({ message: "Ride completely cancelled and lists updated" });
};

// Passenger responds to the initial Group Proposal
const passengerConfirmGroup = (req, res) => {
    const { groupId, reqId, confirm } = req.body;
    const group = state.groups[groupId];
    
    if (!group) return res.status(404).json({ error: "Group not found or expired" });
    
    if (!confirm) {
        // User declined the group
        state.requests[reqId].status = "REQUESTED"; // Re-queue
        group.status = "DISBANDED"; // Invalidate this proposed group
        // Others in group should be re-queued
        group.passengers.forEach(pid => {
            if (state.requests[pid] && state.requests[pid].status === "GROUPING_FOUND") {
                state.requests[pid].status = "REQUESTED"; 
                // We'd tell them via socket
                if (req.io) req.io.to(`passenger_${pid}`).emit("group_disbanded", { message: "A co-passenger declined." });
            }
        });
        return res.json({ message: "Declined. Searching again..." });
    }

    group.responses = group.responses || {};
    group.responses[reqId] = true;

    // Check if ALL accepted
    let allAccepted = true;
    group.passengers.forEach(pid => {
        if (!group.responses[pid]) allAccepted = false;
    });

    if (allAccepted) {
        group.status = "PENDING_DRIVER_ACCEPT";
        group.passengers.forEach(pid => {
            if (state.requests[pid]) state.requests[pid].status = "PENDING_DRIVER_ACCEPT";
        });
        if (req.io) req.io.emit("driver_opportunities_updated"); // notify drivers
    }

    res.json({ message: "Confirmed group. Waiting for others or driver..." });
};

// Driver accepts a group
const driverAcceptGroup = (req, res) => {
    const { driverId, groupId, optionId } = req.body; // optionId references the specific route cost output
    const driver = state.drivers[driverId];
    const group = state.groups[groupId];

    if (!driver || !group || group.status !== "PENDING_DRIVER_ACCEPT") {
        return res.status(400).json({ error: "Invalid driver or group expired." });
    }

    group.status = "WAITING_FOR_FINAL_PASSENGER_CONFIRM";
    group.assignedDriver = driverId;
    group.selectedRoute = group.driverOptions.find(o => o.driver_id == driver.id.split('-')[1]); 
    group.finalResponses = {};

    group.passengers.forEach(pid => {
        if (state.requests[pid]) state.requests[pid].status = "WAITING_FOR_FINAL_PASSENGER_CONFIRM";
        if (req.io) req.io.to(`passenger_${pid}`).emit("driver_found", { driver, eta: group.selectedRoute.total_time, groupId });
    });

    if (req.io) req.io.emit("driver_opportunities_updated"); // refresh for other drivers

    res.json({ message: "Group clamped. Awaiting passenger final confirms." });
};

const { fetchRouteGeometry } = require("../services/osrmService");

// Passenger final confirm
const passengerFinalConfirm = async (req, res) => {
    const { groupId, reqId, confirm } = req.body;
    const group = state.groups[groupId];
    
    if (!group) return res.status(404).json({ error: "Group not found" });

    if (!confirm) {
        // Disband again
        group.status = "DISBANDED";
        state.requests[reqId].status = "REQUESTED";
        group.passengers.forEach(pid => {
            if (pid !== reqId && state.requests[pid]) {
                state.requests[pid].status = "REQUESTED"; 
                if (req.io) req.io.to(`passenger_${pid}`).emit("final_group_disbanded", { message: "Someone declined driver." });
            }
        });
        // Notify driver
        if (req.io) req.io.to(`driver_${group.assignedDriver}`).emit("group_disbanded", { message: "Passenger cancelled." });
        return res.json({ message: "Declined driver. Re-queueing..." });
    }

    group.finalResponses[reqId] = true;
    let allAccepted = true;
    group.passengers.forEach(pid => {
        if (!group.finalResponses[pid]) allAccepted = false;
    });

    if (allAccepted) {
        group.status = "SIMULATION_START";
        const driver = state.drivers[group.assignedDriver];
        driver.status = "assigned"; // NOT 'busy' yet, waiting for manual start
        
        try {
            // Morph the calculated basic euclidean waypoints into dense real-world road geometries
            const denseRoute = await fetchRouteGeometry(group.selectedRoute.route);
            driver.activeRoute = denseRoute;
        } catch(e) {
            console.error("OSRM Build Failed, Falling back", e);
            driver.activeRoute = group.selectedRoute.route;
        }

        driver.totalDistance = group.selectedRoute.total_distance;
        group.passengers.forEach(pid => {
            driver.passengersMap[pid] = state.requests[pid];
            state.requests[pid].status = "WAITING_DRIVER_START";
            if (req.io) req.io.to(`passenger_${pid}`).emit("ride_assigned");
        });
        if (req.io) req.io.to(`driver_${group.assignedDriver}`).emit("ride_ready", { route: driver.activeRoute });
    }

    res.json({ message: "Final confirm registered." });
};

// Driver manual start
const startJourney = (req, res) => {
    const { driverId } = req.body;
    const driver = state.drivers[driverId];
    if (driver && driver.status === "assigned") {
        driver.status = "busy"; // Now the physics loop will move it
        driver.currentRidePassengers = Object.keys(driver.passengersMap);
        Object.keys(driver.passengersMap).forEach(pid => {
             if (state.requests[pid]) state.requests[pid].status = "IN_RIDE";
             if (req.io) req.io.to(`passenger_${pid}`).emit("ride_started", { route: driver.activeRoute });
        });
        return res.json({ message: "Journey Started!" });
    }
    res.status(400).json({ error: "Cannot start journey." });
};

// Driver location setup
const setDriverLocation = (req, res) => {
    const { driverId, location } = req.body;
    if (state.drivers[driverId]) {
        state.drivers[driverId].location = location;
        if (req.io) req.io.emit("simulation_update", { drivers: state.drivers });
        res.json({ message: "Driver online" });
    } else {
        res.status(404).json({ error: "Driver not found" });
    }
};

module.exports = {
  requestRide,
  getDriverState,
  cancelRide,
  passengerConfirmGroup,
  driverAcceptGroup,
  passengerFinalConfirm,
  startJourney,
  setDriverLocation
};