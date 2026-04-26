import { API_URL } from '../config';
import { useState, useEffect } from "react";
import { Search, MapPin, Navigation, User, Car, Clock } from "lucide-react";
import Map from "../components/Map"; 
import { LOCATIONS, getLocationByName } from "../utils/locations";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const [pickup, setPickup] = useState(LOCATIONS[0].name);
  const [drop, setDrop] = useState(LOCATIONS[1].name);
  
  // Custom Flow States: IDLE, WAITING, GROUP_CONFIRM, WAITING_DRIVER, DRIVER_CONFIRM, IN_RIDE
  const [flowState, setFlowState] = useState('IDLE'); 
  const [reqId, setReqId] = useState(null);
  
  // Real-time payloads
  const [groupDetails, setGroupDetails] = useState(null);
  const [driverDetails, setDriverDetails] = useState(null);
  const [route, setRoute] = useState([]);
  const [driversMap, setDriversMap] = useState({});

  useEffect(() => {
     // Retrieve user info
     const token = localStorage.getItem("token");
     if (!token) { navigate("/login"); return; }
     JSON.parse(localStorage.getItem("user") || "{}");

     const socket = io(`${API_URL}`);

     // Once requested, setup our personalized room listener conceptually or just listen broadcast
     socket.on("connect", () => {
         // Join room based on user ID or just let server find us by socket id if we emit our req id?
         // In simulationEngine we emit `passenger_${pid}`. We need to tell socket who we are.
     });

     // Hack for demo: Listen to all group_found events and filter by ReqId
     // Note: In secure prod, we'd emit our userId on connection.
     socket.on("grouping_found", (data) => {
         setGroupDetails(data);
         setFlowState('GROUP_CONFIRM');
     });

     socket.on("group_disbanded", (data) => {
         alert("Group disbanded: " + (data.message || ""));
         setFlowState('WAITING');
     });
     
     socket.on("driver_found", (data) => {
         setDriverDetails(data);
         setFlowState('DRIVER_CONFIRM');
     });
     
     socket.on("ride_started", (data) => {
         setRoute(data.route);
         setFlowState('IN_RIDE');
     });

     socket.on("simulation_update", (data) => {
         if (data.drivers) setDriversMap(data.drivers);
     });

     return () => socket.disconnect();
  }, [navigate]);

  // Hacky solution for matching custom socket events manually:
  useEffect(() => {
     if (!reqId) return;
     const socket = io(`${API_URL}`);
     socket.emit("join_room", `passenger_${reqId}`);

     socket.on(`grouping_found`, (data) => { setGroupDetails(data); setFlowState('GROUP_CONFIRM'); });
     socket.on(`driver_found`, (data) => { setDriverDetails(data); setFlowState('DRIVER_CONFIRM'); });
     socket.on(`ride_started`, (data) => { setRoute(data.route); setFlowState('IN_RIDE'); });
     socket.on('ride_assigned', () => setFlowState('WAITING_DRIVER_START'));
     socket.on('journey_completed', () => setFlowState('COMPLETED'));
     socket.on(`group_disbanded`, (data) => { alert(data.message); setFlowState('WAITING'); });
     socket.on(`final_group_disbanded`, (data) => { alert(data.message); setFlowState('WAITING'); });
     
     // Note we're generating multiple sockets, this is dirty but works for this single page mock.
     return () => socket.disconnect();
  }, [reqId]);


  const handleRequestRide = async (e) => {
    e.preventDefault();
    setFlowState('WAITING');
    
    const pLoc = getLocationByName(pickup);
    const dLoc = getLocationByName(drop);
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    
    try {
        const res = await fetch(`${API_URL}/api/rides/request`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                name: user.name || "Customer",
                age: user.age || "N/A",
                gender: user.gender || "N/A",
                pickup_x: pLoc.lat,
                pickup_y: pLoc.lng,
                drop_x: dLoc.lat,
                drop_y: dLoc.lng
            })
        });
        const data = await res.json();
        setReqId(data.request.id);
    } catch(err) {
        console.error("Match failed", err);
        setFlowState('IDLE');
    }
  };

  const handleGroupConfirm = async (confirm) => {
      try {
          const res = await fetch(`${API_URL}/api/rides/group/passenger_confirm`, {
              method: "POST",
              headers: {"Content-Type": "application/json"},
              body: JSON.stringify({ groupId: groupDetails.groupId, reqId, confirm })
          });
          await res.json();
          if (confirm) setFlowState('WAITING_DRIVER');
          else setFlowState('WAITING'); 
      } catch(e) {}
  };

  const handleDriverConfirm = async (confirm) => {
      try {
          await fetch(`${API_URL}/api/rides/group/passenger_final_confirm`, {
              method: "POST",
              headers: {"Content-Type": "application/json"},
              body: JSON.stringify({ groupId: driverDetails.groupId, reqId, confirm })
          });
          if (!confirm) {
               setFlowState('WAITING'); 
          } else {
               setFlowState('WAITING_DRIVER_START');
          }
      } catch(e) {}
  };

  const handleFeedback = (isGood) => {
      if (isGood) alert("Thank you! 🎉");
      else alert("Sorry, we will work better. 😔");
      setFlowState('IDLE');
      setRoute([]);
      setGroupDetails(null);
      setDriverDetails(null);
  };

  const handleCancelEntireRide = async () => {
      try {
          await fetch(`${API_URL}/api/rides/cancel`, {
              method: "POST",
              headers: {"Content-Type": "application/json"},
              body: JSON.stringify({ reqId })
          });
          setFlowState('IDLE');
          setReqId(null);
          setGroupDetails(null);
          setDriverDetails(null);
      } catch(e) {}
  };


  const renderIdleScreen = () => (
    <div className="flex justify-center items-center w-full min-h-screen">
      <div className="card" style={{ maxWidth: 500, width: '100%', padding: '40px' }}>
          <h2 className="mb-8 text-center text-3xl">Where are you heading?</h2>
          <form onSubmit={handleRequestRide} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label>Pickup Location</label>
              <div className="flex items-center gap-2 relative">
                <MapPin size={20} className="absolute left-4" style={{color: 'var(--text-light)'}}/>
                <select value={pickup} onChange={e => setPickup(e.target.value)} className="input-field pl-12">
                   {LOCATIONS.map(loc => <option key={loc.name} value={loc.name}>{loc.name}</option>)}
                </select>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <label>Drop Location</label>
              <div className="flex items-center gap-2 relative">
                <Navigation size={20} className="absolute left-4" style={{color: 'var(--text-light)'}}/>
                <select value={drop} onChange={e => setDrop(e.target.value)} className="input-field pl-12">
                   {LOCATIONS.map(loc => <option key={loc.name} value={loc.name}>{loc.name}</option>)}
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary mt-4 w-full">
               <Search size={20} style={{marginRight: '8px'}}/> Find Ride Let's Go
            </button>
          </form>
      </div>
    </div>
  );

  const renderWaitScreen = (msg) => (
      <div className="flex flex-col justify-center items-center w-full min-h-screen text-center">
          <div className="snake-loader-wrapper mb-8">
              <div className="loader-track">
                  <div className="rat"></div>
                  <div className="snake"></div>
              </div>
          </div>
          <h2 className="text-3xl mb-4 text-white">Searching the grid...</h2>
          <p className="text-lg text-gray-400 max-w-md mb-8">{msg}</p>
          <button onClick={handleCancelEntireRide} className="btn border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all px-8">
              Cancel Ride Completely
          </button>
      </div>
  );

  const renderGroupModal = () => (
      <div className="modal-overlay">
          <div className="modal-content">
              <h2 className="mb-6">Ride Group Proposed</h2>
              <p className="mb-4 text-gray-300">We've found a combination that works. Are you okay with sharing this ride?</p>
              
              <div className="bg-black bg-opacity-30 p-4 rounded-xl mb-6">
                  <h4 className="flex gap-2 items-center mb-3 text-purple-400"><User size={18}/> Co-Passengers</h4>
                  {groupDetails?.coPassengers?.length === 0 ? (
                      <p className="text-sm text-gray-400 border border-gray-700 p-3 rounded">You are riding solo in this leg!</p>
                  ) : (
                      <div className="flex flex-col gap-3">
                        {groupDetails?.coPassengers?.map((p, i) => (
                           <div key={i} className="text-sm border border-gray-700 p-3 rounded flex justify-between bg-white bg-opacity-5">
                               <div><strong>{p.name}</strong> ({p.gender}, {p.age})</div>
                               <div className="text-right text-xs text-gray-400">
                                  <div>P: {LOCATIONS.find(l => l.lat === p.pickup_x)?.name || "Map"}</div>
                                  <div>D: {LOCATIONS.find(l => l.lat === p.drop_x)?.name || "Map"}</div>
                               </div>
                           </div>
                        ))}
                      </div>
                  )}
              </div>

              <div className="flex flex-col gap-3">
                  <div className="flex gap-4">
                      <button onClick={() => handleGroupConfirm(false)} className="btn btn-secondary flex-1 border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:bg-opacity-10">Decline Group (Re-queue)</button>
                      <button onClick={() => handleGroupConfirm(true)} className="btn btn-primary flex-1">Accept Group</button>
                  </div>
                  <button onClick={handleCancelEntireRide} className="btn w-full text-red-500 hover:bg-red-500 hover:bg-opacity-10 py-2">
                      Cancel Entire Ride
                  </button>
              </div>
          </div>
      </div>
  );

  const renderDriverModal = () => (
      <div className="modal-overlay">
          <div className="modal-content">
              <h2 className="mb-6">Driver Matched!</h2>
              <p className="mb-4 text-gray-300">A driver has accepted your group's route.</p>
              
              <div className="bg-black bg-opacity-30 p-4 rounded-xl mb-6 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                      <div className="bg-purple-900 p-3 rounded-full text-white"><Car size={24}/></div>
                      <div>
                          <p className="text-lg font-bold">{driverDetails?.driver?.name}</p>
                          <p className="text-sm text-gray-400">Capacity: {driverDetails?.driver?.capacity} seats</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-2 text-green-400 border-t border-gray-700 pt-3">
                      <Clock size={16}/> <span>ETA Total Route: {driverDetails?.eta?.toFixed(0)} mins</span>
                  </div>
              </div>

              <div className="flex flex-col gap-3">
                  <div className="flex gap-4">
                      <button onClick={() => handleDriverConfirm(false)} className="btn btn-secondary flex-1 border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:bg-opacity-10">Decline Driver (Re-queue)</button>
                      <button onClick={() => handleDriverConfirm(true)} className="btn btn-primary flex-1 bg-green-600 hover:bg-green-500">Confirm Ride</button>
                  </div>
                  <button onClick={handleCancelEntireRide} className="btn w-full text-red-500 hover:bg-red-500 hover:bg-opacity-10 py-2">
                       Cancel Entire Ride
                  </button>
              </div>
          </div>
      </div>
  );

  const renderInRideScreen = () => {
      const activeDriver = driversMap[driverDetails?.driver?.id] || driverDetails?.driver;
      return (
          <div className="dashboard-layout">
              <aside className="sidebar z-10 relative">
                  <div>
                      <h2 className="text-2xl text-purple-400 mb-2">Your Ride</h2>
                      <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                         <div className="flex items-center gap-2 mb-2">
                             <Car size={16} className="text-gray-400"/>
                             <span className="font-bold text-gray-200">{activeDriver?.name || "Driver"}</span>
                         </div>
                      </div>
                  </div>

                  {activeDriver && (
                      <div className="card" style={{border: '1px solid var(--success)', background: 'linear-gradient(to right, rgba(16,185,129,0.1), rgba(0,0,0,0))'}}>
                         <h3 style={{color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '8px'}}>
                           <Navigation size={18}/> En Route
                         </h3>
                         <div className="mt-4 flex flex-col gap-2 text-sm text-gray-300">
                           <p><strong>Distance Left:</strong> {parseFloat(activeDriver.distanceLeft || 0).toFixed(2)} km</p>
                           <p><strong>ETA to finish:</strong> {activeDriver.etaMins || 0} mins</p>
                           <div className="mt-4 bg-black bg-opacity-40 p-3 rounded-lg border border-gray-700">
                               <strong>Passengers in car:</strong>
                               <ul className="ml-4 list-disc text-purple-300 mt-2">
                                 {Object.values(activeDriver.passengersMap || {}).map(p => (
                                     <li key={p.id}>{p.name} {p.is_picked_up ? '(Picked Up)' : '(Waiting)'}</li>
                                 ))}
                               </ul>
                           </div>
                         </div>
                      </div>
                  )}

                  {flowState === 'COMPLETED' && (
                      <div className="card border-green-500 border p-4 text-center mt-4 relative z-50 shadow-2xl bg-gray-900 border-opacity-100 opacity-100">
                           <div className="text-4xl mb-2">🎉</div>
                           <h3 className="text-green-400 text-xl font-bold mb-2">Journey Completed!</h3>
                           <p className="text-sm text-gray-400 mb-4">You've arrived at your destination.</p>
                           <div className="flex gap-2 mt-2">
                              <button onClick={() => handleFeedback(true)} className="btn flex-1 bg-green-600 hover:bg-green-500 text-white">Good Ride</button>
                              <button onClick={() => handleFeedback(false)} className="btn flex-1 bg-red-600 hover:bg-red-500 text-white">Not Satisfied</button>
                           </div>
                      </div>
                  )}
              </aside>

              <main className="map-card relative z-0">
                 <div className="map-container">
                     <Map 
                        drivers={driversMap} 
                        activeDriverId={activeDriver?.id} 
                        boundsArray={route.map(r => [r.x, r.y])} 
                     />
                 </div>
              </main>
          </div>
      );
  };

  return (
    <div className="w-full relative">
       {flowState === 'IDLE' && renderIdleScreen()}
       {flowState === 'WAITING' && renderWaitScreen("Running highly optimized TSP and routing algorithms to match you based on distance radius rules...")}
       {flowState === 'GROUP_CONFIRM' && renderGroupModal()}
       {flowState === 'WAITING_DRIVER' && renderWaitScreen("Group locked! Now soliciting nearby drivers who can fulfill your journey efficiently...")}
       {flowState === 'DRIVER_CONFIRM' && renderDriverModal()}
       {flowState === 'WAITING_DRIVER_START' && renderWaitScreen("You confirmed! Awaiting driver to manually press Start Journey...")}
       {(flowState === 'IN_RIDE' || flowState === 'COMPLETED') && renderInRideScreen()}
    </div>
  );
};

export default CustomerDashboard;
