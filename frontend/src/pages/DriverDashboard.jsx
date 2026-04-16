import { useState, useEffect } from "react";
import { User, MapPin, Check, Clock } from "lucide-react";
import Map from "../components/Map"; 
import { io } from "socket.io-client";

const DriverDashboard = () => {
  const [driverId, setDriverId] = useState('driver-1');
  const [drivers, setDrivers] = useState({});
  const [pendingRequests, setPendingRequests] = useState([]);
  
  useEffect(() => {
     const socket = io("http://localhost:5000");
     
     socket.on("simulation_update", (state) => {
         setDrivers(state.drivers);
         setPendingRequests(state.pendingRequests);
     });

     // Poll initial state
     fetch(`http://localhost:5000/api/rides/driver/state?driverId=${driverId}`)
        .then(res => res.json())
        .then(data => {
            if(data.drivers) setDrivers(data.drivers);
            if(data.pendingRequests) setPendingRequests(data.pendingRequests);
        });

     return () => socket.disconnect();
  }, [driverId]);

  const handleAccept = async (req) => {
    try {
        await fetch("http://localhost:5000/api/rides/driver/accept", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                driverId,
                requestIds: [req.id]
            })
        });
    } catch(err) {
        console.error("Failed to accept ride", err);
    }
  };

  const activeDriver = drivers[driverId];

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div>
          <h2>Driver Hub</h2>
          <select 
             value={driverId} 
             onChange={e => setDriverId(e.target.value)}
             className="input-field mt-2 bg-gray-50"
          >
              <option value="driver-1">driver-1 (Rajesh / White Swift)</option>
              <option value="driver-2">driver-2 (Amit / Silver Innova)</option>
              <option value="driver-3">driver-3 (Sunil / Blue WagonR)</option>
          </select>
        </div>

        {activeDriver && activeDriver.activeRoute && activeDriver.activeRoute.length > 0 && (
          <div className="card" style={{border: '2px solid var(--success)', backgroundColor: '#ECFDF5'}}>
             <h3 style={{color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '8px'}}>
               <Check size={18}/> Active Ride En Route!
             </h3>
             <div className="mt-4 flex flex-col gap-2">
               <p><strong>Distance Left:</strong> {activeDriver.distanceLeft} km</p>
               <p><strong>ETA to finish:</strong> {activeDriver.etaMins} mins</p>
               <div className="mt-2 text-sm bg-white p-2 rounded border">
                   <strong>Passengers inside:</strong>
                   <ul className="ml-4 list-disc text-gray-600">
                     {Object.values(activeDriver.passengersMap).map(p => (
                         <li key={p.id}>{p.name}</li>
                     ))}
                   </ul>
               </div>
             </div>
          </div>
        )}

        <div className="flex flex-col gap-4 mt-4">
          <h3 style={{display:'flex', alignItems: 'center', gap:'8px'}}>
            <Clock size={20} color="var(--primary-color)"/> New Requests
          </h3>

          {pendingRequests.map(req => (
            <div key={req.id} className="card" style={{padding: '16px'}}>
              <div className="flex justify-between items-center mb-4">
                 <strong className="flex items-center gap-2"><User size={16}/> {req.name}</strong>
              </div>
              <div className="flex flex-col gap-1 text-sm mb-4">
                <span className="flex items-center gap-2" style={{color: 'var(--text-light)'}}><MapPin size={14}/> Lat: {req.pickup_x.toFixed(3)}, Lng: {req.pickup_y.toFixed(3)}</span>
                <span className="flex items-center gap-2" style={{color: 'var(--text-light)'}}><MapPin size={14}/> Lat: {req.drop_x.toFixed(3)}, Lng: {req.drop_y.toFixed(3)}</span>
              </div>
              <div className="flex gap-2">
                 <button onClick={() => handleAccept(req)} className="btn btn-primary" style={{flex: 1, padding: '8px', fontSize: '14px'}}>Accept</button>
              </div>
            </div>
          ))}

          {pendingRequests.length === 0 && <p style={{color: 'var(--text-light)'}}>No active requests right now.</p>}
        </div>
      </aside>

      <main className="map-container">
         <Map drivers={drivers} activeDriverId={driverId} />
      </main>
    </div>
  );
};

export default DriverDashboard;
