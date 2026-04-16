const { writeInput, readOutput } = require("../utils/fileHandler");
const { runCpp } = require("../services/cppRunner");
const state = require("../data/state");

const reqIdGenerator = () => Math.floor(Math.random() * 10000);

const requestRide = async (req, res) => {
  const { pickup_x, pickup_y, drop_x, drop_y, name, pickupId, dropId } = req.body;
  const newReq = {
      id: reqIdGenerator(),
      name: name || "Passenger",
      pickup_x, pickup_y, drop_x, drop_y,
      pickupId, dropId,
      status: "pending"
  };
  
  // Find Nearest Driver
  let nearestDriverId = 'driver-1';
  let minDist = Infinity;
  Object.values(state.drivers).forEach(d => {
      const dist = Math.sqrt(Math.pow(d.location[0] - pickup_x, 2) + Math.pow(d.location[1] - pickup_y, 2));
      if(dist < minDist) {
          minDist = dist;
          nearestDriverId = d.id;
      }
  });

  const driver = state.drivers[nearestDriverId];
  
  // Combine current driver passengers with new
  const passengersToProcess = [...Object.values(driver.passengersMap), newReq];
  
  let inputData = `${driver.location[0]} ${driver.location[1]}\n`;
  inputData += `${driver.capacity}\n`;
  inputData += `${passengersToProcess.length}\n`;

  passengersToProcess.forEach(p => {
    inputData += `${p.id} ${p.pickup_x} ${p.pickup_y} ${p.drop_x} ${p.drop_y}\n`;
  });

  writeInput(inputData);
  try {
      await runCpp();
      const resultText = readOutput();
      const lines = resultText.trim().split('\n');
      const parsedObj = {
          total_distance: parseFloat(lines[1].split(': ')[1]),
          route: []
      };
      
      const route_size = parseInt(lines[2].split(': ')[1]);
      for(let i=0; i<route_size; i++){
          const parts = lines[3+i].trim().split(' ');
          parsedObj.route.push({
              type: parts[0],
              pass_id: parseInt(parts[1]),
              x: parseFloat(parts[2]),
              y: parseFloat(parts[3])
          });
      }

      driver.activeRoute = parsedObj.route;
      driver.totalDistance = parsedObj.total_distance;
      passengersToProcess.forEach(p => { driver.passengersMap[p.id] = p; });

      res.json({ message: "Ride Auto-Assigned & Start!", request: newReq, driverId: nearestDriverId });
  } catch(e) {
      res.status(500).json({error: e.message});
  }
};

const getDriverState = (req, res) => {
  const driverId = req.query.driverId || 'driver-1';
  const driver = state.drivers[driverId]; 
  res.json({
      driver,
      pendingRequests: state.pendingRequests
  });
};

const acceptRideList = async (req, res) => {
  try {
    const { requestIds, driverId } = req.body;
    
    // Find requests
    const acceptedReqs = state.pendingRequests.filter(r => requestIds.includes(r.id));
    state.pendingRequests = state.pendingRequests.filter(r => !requestIds.includes(r.id));

    const driver = state.drivers[driverId || 'driver-1'];
    
    // Combine current driver passengers with new
    const passengersToProcess = [...Object.values(driver.passengersMap), ...acceptedReqs];
    
    let inputData = `${driver.location[0]} ${driver.location[1]}\n`;
    inputData += `${driver.capacity}\n`;
    inputData += `${passengersToProcess.length}\n`;

    passengersToProcess.forEach(p => {
      inputData += `${p.id} ${p.pickup_x} ${p.pickup_y} ${p.drop_x} ${p.drop_y}\n`;
    });

    writeInput(inputData);
    await runCpp();

    // Read generated route
    const resultText = readOutput();
    const lines = resultText.trim().split('\n');
    const parsedObj = {
        total_distance: parseFloat(lines[1].split(': ')[1]),
        route: []
    };
    
    const route_size = parseInt(lines[2].split(': ')[1]);
    for(let i=0; i<route_size; i++){
        const parts = lines[3+i].trim().split(' ');
        parsedObj.route.push({
            type: parts[0],
            pass_id: parseInt(parts[1]),
            x: parseFloat(parts[2]),
            y: parseFloat(parts[3])
        });
    }

    driver.activeRoute = parsedObj.route;
    driver.totalDistance = parsedObj.total_distance;
    
    // Convert to map
    passengersToProcess.forEach(p => { driver.passengersMap[p.id] = p; });

    res.json({ message: "Ride optimized & accepted successfully", driver });
  } catch (error) {
    res.status(500).json({ message: "System Error", error: error.message });
  }
};

const updateDriverLocation = (req, res) => {
   // Legacy, handled by simulation internally mostly now
   res.json({success: true});
};

const cancelRide = (req, res) => {
    const { driverId, passengerId } = req.body;
    const driver = state.drivers[driverId];
    if (driver) {
        if (driver.passengersMap) delete driver.passengersMap[passengerId];
        if (driver.activeRoute) {
            driver.activeRoute = driver.activeRoute.filter(pt => pt.pass_id !== passengerId);
        }
    }
    res.json({ message: "Ride definitively cancelled across simulation state" });
};

module.exports = {
  requestRide,
  getDriverState,
  acceptRideList,
  updateDriverLocation,
  cancelRide
};