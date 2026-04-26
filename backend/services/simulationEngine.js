const state = require("../data/state");
const { writeInput, readOutput } = require("../utils/fileHandler");
const { runCpp } = require("./cppRunner");

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const dx = lat1 - lat2;
    const dy = lon1 - lon2;
    return Math.sqrt(dx * dx + dy * dy) * 111.0; 
};

const SPEED_KMH = 240;
const SPEED_KMS_PER_SEC = SPEED_KMH / 3600;

const runSimulation = (io) => {
    // 1-Second Physics & Movement Tick
    setInterval(() => {
        let stateChanged = false;

        Object.values(state.drivers).forEach((driver) => {
            if (driver.status === 'busy' && driver.activeRoute && driver.activeRoute.length > 0) {
                const target = driver.activeRoute[0];
                const d = calculateDistance(driver.location[0], driver.location[1], target.x, target.y);
                
                if (d < 0.1) {
                    driver.activeRoute.shift(); // Remove waypoint
                    if (target.type === "DROP") {
                        delete driver.passengersMap[target.pass_id];
                        if (state.requests[target.pass_id]) state.requests[target.pass_id].status = "DROPPED_OFF";
                    } else if (target.type === "PICKUP") {
                        if (driver.passengersMap[target.pass_id]) {
                            driver.passengersMap[target.pass_id].is_picked_up = true;
                        }
                    }
                    if (driver.activeRoute.length === 0) {
                        driver.status = 'idle';
                        driver.distanceLeft = 0;
                        driver.etaMins = 0;
                        if (driver.currentRidePassengers) {
                            driver.currentRidePassengers.forEach(pid => io.to(`passenger_${pid}`).emit('journey_completed'));
                        }
                        io.to(`driver_${driver.id}`).emit('journey_completed');
                        driver.currentRidePassengers = [];
                    }
                    stateChanged = true;
                } else {
                    const ratio = (SPEED_KMS_PER_SEC * 1.0) / d; 
                    const moveFactor = Math.min(ratio, 1.0);

                    const newLat = driver.location[0] + (target.x - driver.location[0]) * moveFactor;
                    const newLng = driver.location[1] + (target.y - driver.location[1]) * moveFactor;
                    
                    driver.location = [newLat, newLng];
                    
                    // Update remaining stats actively 
                    let remainingDist = calculateDistance(newLat, newLng, driver.activeRoute[0].x, driver.activeRoute[0].y);
                    for (let i = 0; i < driver.activeRoute.length - 1; i++) {
                         remainingDist += calculateDistance(driver.activeRoute[i].x, driver.activeRoute[i].y, driver.activeRoute[i+1].x, driver.activeRoute[i+1].y);
                    }
                    driver.distanceLeft = remainingDist;
                    driver.etaMins = Math.ceil((remainingDist / SPEED_KMH) * 60);

                    stateChanged = true;
                }
            }
        });

        // io.emit("simulation_update", state);  // Un-comment to blast all data
        // For performance, emit targeted events or less frequently if needed, but fine for local demo
        io.emit("simulation_update", { drivers: state.drivers });
    }, 1000);

    // 5-Second Matchmaker Tick
    setInterval(async () => {
        const now = Date.now();
        // Grab entire pool of pending requests
        const pendingReqs = Object.values(state.requests).filter(r => r.status === "REQUESTED");
        
        // Only run a batch simulation if someone in the pool has been waiting for at least 15 seconds to ensure we are pooling properly!
        const shouldRunBatch = pendingReqs.some(r => (now - r.requestedAt) > 15000);
        if (!shouldRunBatch) return;

        const availableDrivers = Object.values(state.drivers).filter(d => d.status === "idle");
        
        if (pendingReqs.length === 0 || availableDrivers.length === 0) return;

        // Formulate input.txt
        let inputData = `${availableDrivers.length}\n`;
        availableDrivers.forEach(d => {
            inputData += `${d.id.split('-')[1]} ${d.location[0]} ${d.location[1]} ${d.capacity}\n`;
        });
        
        inputData += `${pendingReqs.length}\n`;
        pendingReqs.forEach(p => {
            inputData += `${p.id} ${p.pickup_x} ${p.pickup_y} ${p.drop_x} ${p.drop_y}\n`;
        });

        writeInput(inputData);
        try {
            await runCpp();
            const outTxt = readOutput();
            if (!outTxt || outTxt.trim() === "[]" || outTxt.trim() === "") return;
            
            // Expected JSON: [ { driver_id, total_distance, total_time, passengers: [id], route: [...] } ]
            const options = JSON.parse(outTxt);
            
            if (options.length === 0) return;

            // Simple parser: Map passenger combos to a unique string to define a "grouping"
            // For example, if passengers=[1, 2], group key = "1_2"
            const groupedByPassengers = {};

            options.forEach(opt => {
                const pKey = [...opt.passengers].sort().join('_');
                if (!groupedByPassengers[pKey]) {
                    groupedByPassengers[pKey] = {
                        passengers: [...opt.passengers],
                        driverOptions: []
                    };
                }
                groupedByPassengers[pKey].driverOptions.push(opt);
            });

            // Convert to state.groups objects and update request states
            // Fix: Sort by group size descending so max density pooling is prioritized!
            const sortedKeys = Object.keys(groupedByPassengers).sort((a,b) => groupedByPassengers[b].passengers.length - groupedByPassengers[a].passengers.length);
            
            sortedKeys.forEach(pKey => {
                // Ensure none of these passengers are already being offered a group!
                const grp = groupedByPassengers[pKey];
                let isFree = true;
                grp.passengers.forEach(pid => {
                    if (state.requests[pid].status !== "REQUESTED") isFree = false;
                });

                if (isFree) {
                    const newGroupId = "grp-" + Math.floor(Math.random() * 999999);
                    state.groups[newGroupId] = {
                        id: newGroupId,
                        passengers: grp.passengers,
                        driverOptions: grp.driverOptions,
                        status: "GROUPING_FOUND",
                        responses: {},
                        createdAt: Date.now()
                    };

                    grp.passengers.forEach(pid => {
                        state.requests[pid].status = "GROUPING_FOUND";
                        // Find other passengers' details
                        const coPass = grp.passengers.filter(id => id !== pid).map(id => state.requests[id]);
                        io.to(`passenger_${pid}`).emit("grouping_found", {
                            groupId: newGroupId,
                            coPassengers: coPass
                        });
                    });
                }
            });

        } catch(e) {
            console.error("Matchmaker Error:", e);
        }
    }, 5000);
};

module.exports = { runSimulation };
