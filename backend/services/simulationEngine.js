const state = require("../data/state");

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    // Basic euclidean distance converted approximately to KM
    const dx = lat1 - lat2;
    const dy = lon1 - lon2;
    return Math.sqrt(dx * dx + dy * dy) * 111.0; 
};

// Speed fixed at 40km/h
const SPEED_KMH = 40;
const SPEED_KMS_PER_SEC = SPEED_KMH / 3600;

const runSimulation = (io) => {
    // Tick every 1 second
    setInterval(() => {
        let stateChanged = false;

        Object.values(state.drivers).forEach((driver) => {
            if (driver.activeRoute && driver.activeRoute.length > 0) {
                // Determine next target waypoint
                const target = driver.activeRoute[0];
                
                const d = calculateDistance(driver.location[0], driver.location[1], target.x, target.y);
                
                if (d < 0.1) {
                    // Reached waypoint!
                    driver.activeRoute.shift(); // Remove waypoint
                    
                    // Trigger pickup or dropoff logic if needed
                    if (target.type === "DROP") {
                        delete driver.passengersMap[target.pass_id];
                    } else if (target.type === "PICKUP") {
                        if (driver.passengersMap[target.pass_id]) {
                            driver.passengersMap[target.pass_id].is_picked_up = true;
                        }
                    }
                    stateChanged = true;
                } else {
                    // Move towards target literally
                    const ratio = (SPEED_KMS_PER_SEC * 1.0) / d; // we tick every 1 sec
                    const moveFactor = Math.min(ratio, 1.0);

                    const newLat = driver.location[0] + (target.x - driver.location[0]) * moveFactor;
                    const newLng = driver.location[1] + (target.y - driver.location[1]) * moveFactor;
                    
                    driver.location = [newLat, newLng];

                    // Recalculate Distance Left & ETA across all remaining waypoints
                    let remainingDist = calculateDistance(newLat, newLng, target.x, target.y);
                    for(let i=0; i < driver.activeRoute.length - 1; i++) {
                        remainingDist += calculateDistance(driver.activeRoute[i].x, driver.activeRoute[i].y, driver.activeRoute[i+1].x, driver.activeRoute[i+1].y);
                    }
                    
                    driver.distanceLeft = remainingDist.toFixed(2);
                    driver.etaMins = Math.ceil((remainingDist / SPEED_KMH) * 60);
                    stateChanged = true;
                }
            } else {
                // Driver is idle
                if(driver.distanceLeft !== 0) {
                    driver.distanceLeft = 0;
                    driver.etaMins = 0;
                    stateChanged = true;
                }
            }
        });

        // Broadcast entire state via WebSockets every second if there's active movement
        io.emit("simulation_update", state);
        
    }, 1000);
};

module.exports = { runSimulation };
