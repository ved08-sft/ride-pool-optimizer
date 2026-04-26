import { API_URL } from '../config';
import { useState, useEffect } from "react";
import { User, MapPin, Check, Clock, Navigation } from "lucide-react";
import Map from "../components/Map"; 
import { LOCATIONS } from "../utils/locations";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";

const DriverDashboard = () => {
  const navigate = useNavigate();
  const [driverId, setDriverId] = useState('driver-1');
  const [activeDriver, setActiveDriver] = useState(null);
  const [groups, setGroups] = useState({});
  const [driversMap, setDriversMap] = useState({});
  const [rideState, setRideState] = useState('IDLE'); // IDLE, WAITING_PASSENGERS, RIDE_READY, IN_RIDE
  
  const [setupMode, setSetupMode] = useState(true);
  const [startLoc, setStartLoc] = useState(LOCATIONS[0].name);

  useEffect(() => {
     const token = localStorage.getItem("token");
     if (!token) { navigate("/login"); return; }
     const user = JSON.parse(localStorage.getItem("user") || "{}");
     if (user.role && user.role.includes('driver')) {
         // for demo, bind user to driver-1/2/3 based on maybe their initial or just default.
         // keeping driver-1 for simplicity of this prototype.
     }

     const socket = io(`${API_URL}`);
     socket.emit("join_room", `driver_${driverId}`);

     const fetchState = async () => {
         try {
             const res = await fetch(`${API_URL}/api/rides/driver/state?driverId=${driverId}`);
             const data = await res.json();
             setActiveDriver(data.driver);
             setGroups(data.groups || {});
         } catch(e) {}
     }
     fetchState();
     
     socket.on("driver_opportunities_updated", () => fetchState());
     socket.on("simulation_update", (state) => {
         if (state.drivers) setDriversMap(state.drivers);
         if (state.drivers && state.drivers[driverId]) setActiveDriver(state.drivers[driverId]);
     });

     socket.on("group_disbanded", (msg) => { alert("Passenger cancelled."); setRideState('IDLE'); fetchState(); });
     socket.on("ride_ready", () => { setRideState('RIDE_READY'); fetchState(); });
     socket.on("journey_completed", () => setRideState('COMPLETED'));

     return () => socket.disconnect();
  }, [driverId, navigate]);

  // Filter groups to only show ones where PENDING_DRIVER_ACCEPT and this driver is an option
  const availableGroups = Object.values(groups).filter(g => {
       if (g.status !== "PENDING_DRIVER_ACCEPT") return false;
       return g.driverOptions.some(opt => opt.driver_id == driverId.split('-')[1]);
  });

  const handleAcceptGroup = async (group) => {
    const opt = group.driverOptions.find(o => o.driver_id == driverId.split('-')[1]);
    try {
        await fetch(`${API_URL}/api/rides/group/driver_accept`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                driverId,
                groupId: group.id,
                optionId: opt.id // conceptual
            })
        });
        setRideState('WAITING_PASSENGERS');
    } catch(err) {
        console.error("Failed to accept ride", err);
    }
  };

  const handleStartJourney = async () => {
      try {
        await fetch(`${API_URL}/api/rides/driver/start_journey`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ driverId })
        });
        setRideState('IN_RIDE');
      } catch(err) {}
  };

  const handleStartShift = async () => {
      const loc = LOCATIONS.find(l => l.name === startLoc);
      try {
          await fetch(`${API_URL}/api/rides/driver/location`, {
              method: "POST",
              headers: {"Content-Type": "application/json"},
              body: JSON.stringify({ driverId, location: [loc.lat, loc.lng] })
          });
          setSetupMode(false);
      } catch(e) {}
  };

  if (setupMode) {
      return (
         <div className="flex justify-center items-center w-full min-h-screen">
            <div className="card" style={{ maxWidth: 500, width: '100%', padding: '40px' }}>
                <h2 className="mb-4 text-center text-2xl text-purple-400">Start Driver Shift</h2>
                <div className="flex flex-col gap-2">
                   <label>Select Initial Location</label>
                   <select value={startLoc} onChange={e => setStartLoc(e.target.value)} className="input-field mt-2 mb-4">
                        {LOCATIONS.map(loc => <option key={loc.name} value={loc.name}>{loc.name}</option>)}
                   </select>
                </div>
                <button onClick={handleStartShift} className="btn btn-primary w-full">Go Online & Accept Rares</button>
            </div>
         </div>
      );
  }

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div>
          <h2 className="text-2xl text-purple-400 mb-2">Driver Hub</h2>
          <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
             <div className="flex items-center gap-2 mb-2">
                 <User size={16} className="text-gray-400"/>
                 <span className="font-bold text-gray-200">ID: {driverId}</span>
             </div>
             <div className="flex items-center gap-2 text-sm text-gray-400">
                 <MapPin size={16}/>
                 <span>Location: {activeDriver ? `${activeDriver.location[0].toFixed(3)}, ${activeDriver.location[1].toFixed(3)}` : 'Detecting GPS...'}</span>
             </div>
          </div>
        </div>

        {activeDriver && activeDriver.status === 'busy' && activeDriver.activeRoute && activeDriver.activeRoute.length > 0 && (
          <div className="card" style={{border: '1px solid var(--success)', background: 'linear-gradient(to right, rgba(16,185,129,0.1), rgba(0,0,0,0))'}}>
             <h3 style={{color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '8px'}}>
               <Navigation size={18}/> En Route
             </h3>
             <div className="mt-4 flex flex-col gap-2 text-sm text-gray-300">
               <p><strong>Distance Left:</strong> {parseFloat(activeDriver.distanceLeft || 0).toFixed(2)} km</p>
               <p><strong>ETA to finish:</strong> {activeDriver.etaMins} mins</p>
               <div className="mt-4 bg-black bg-opacity-40 p-3 rounded-lg border border-gray-700">
                   <strong>Passengers in car:</strong>
                   <ul className="ml-4 list-disc text-purple-300 mt-2">
                     {Object.values(activeDriver.passengersMap).map(p => (
                         <li key={p.id}>{p.name} {p.is_picked_up ? '(Picked Up)' : '(Waiting)'}</li>
                     ))}
                   </ul>
               </div>
             </div>
          </div>
        )}

        {rideState === 'WAITING_PASSENGERS' && (
            <div className="card border-yellow-500 border p-4 text-center">
                <div className="loader inline-block w-8 h-8 rounded-full border-4 border-yellow-500 border-t-transparent animate-spin mb-3"></div>
                <h3 className="text-yellow-500">Wait for final passenger confirm...</h3>
                <p className="text-xs text-gray-400 mt-2">The users are reviewing your profile.</p>
            </div>
        )}

        {rideState === 'RIDE_READY' && (
            <div className="card border-green-500 border p-4 text-center">
                <h3 className="text-green-400 text-xl font-bold mb-2">Passengers Confirmed!</h3>
                <p className="text-sm text-gray-300 mb-4">Route has been loaded into your GPS.</p>
                <button onClick={handleStartJourney} className="btn btn-primary w-full bg-green-600 hover:bg-green-500">Start Journey Maps ->></button>
            </div>
        )}
        
        {rideState === 'COMPLETED' && (
            <div className="card border-green-500 border p-4 text-center relative z-50 shadow-2xl bg-gray-900">
                 <div className="text-4xl mb-2">🎉</div>
                 <h3 className="text-green-400 text-xl font-bold mb-2">Journey Completed!</h3>
                 <p className="text-sm text-gray-400 mb-4">All passengers dropped successfully.</p>
                 <div className="flex gap-2 mt-2">
                    <button onClick={() => {
                        alert("Thank you! 🎉");
                        setRideState('IDLE');
                        setSetupMode(true);
                        setActiveDriver(null);
                        setGroups({});
                    }} className="btn flex-1 bg-green-600 hover:bg-green-500 text-white">Good Shift</button>
                    <button onClick={() => {
                        alert("Sorry, we will work better. 😔");
                        setRideState('IDLE');
                        setSetupMode(true);
                        setActiveDriver(null);
                        setGroups({});
                    }} className="btn flex-1 bg-red-600 hover:bg-red-500 text-white leading-tight">Not Satisfied</button>
                 </div>
            </div>
        )}


        <div className="flex flex-col gap-4 mt-4">
          <h3 className="flex items-center gap-2 text-xl text-white border-b border-gray-700 pb-2">
            <Clock size={20} className="text-purple-400"/> Viable Route Listings
          </h3>

          {availableGroups.map(grp => {
            const opt = grp.driverOptions.find(o => o.driver_id == driverId.split('-')[1]);
            return (
              <div key={grp.id} className="card p-4 hover:border-purple-500 cursor-pointer transition-all">
                <div className="flex justify-between items-center mb-3">
                   <strong className="flex items-center gap-2 text-purple-300"><User size={16}/> Group Size: {grp.passengers.length}</strong>
                   <span className="text-xs bg-purple-900 px-2 py-1 rounded text-purple-200">Combined</span>
                </div>
                <div className="flex flex-col gap-1 text-sm mb-4 text-gray-400">
                  <span className="flex items-center gap-2 text-green-400"><Navigation size={14}/> Total Dist: {opt?.total_distance?.toFixed(2)} km</span>
                  <span className="flex items-center gap-2 text-yellow-500"><Clock size={14}/> Total ETA: {opt?.total_time?.toFixed(0)} mins</span>
                </div>
                <button onClick={() => handleAcceptGroup(grp)} className="btn btn-secondary w-full border-purple-500 text-purple-400 hover:bg-purple-900 hover:bg-opacity-30">Claim Route</button>
              </div>
            );
          })}

          {availableGroups.length === 0 && rideState === 'IDLE' && <p className="text-gray-500 text-sm">No active optimal requests in your 8km/20min radius.</p>}
        </div>
      </aside>

      <main className="map-card">
         <div className="map-container">
            <Map drivers={driversMap} activeDriverId={driverId} />
         </div>
      </main>
    </div>
  );
};

export default DriverDashboard;
