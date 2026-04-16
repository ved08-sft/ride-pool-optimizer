import { useState, useEffect } from "react";
import { Search, MapPin, Navigation, User } from "lucide-react";
import Map from "../components/Map"; 
import { LOCATIONS, getLocationByName } from "../utils/locations";
import { io } from "socket.io-client";

const CustomerDashboard = () => {
  const [pickup, setPickup] = useState(LOCATIONS[0].name);
  const [drop, setDrop] = useState(LOCATIONS[1].name);
  const [requestStatus, setRequestStatus] = useState('idle'); // idle | searching | matched
  
  const [drivers, setDrivers] = useState({});
  const [matchedDriverId, setMatchedDriverId] = useState(null);
  const [currentRequestId, setCurrentRequestId] = useState(null);
  const [simulationSocket, setSimulationSocket] = useState(null);
  
  useEffect(() => {
     const socket = io("http://localhost:5000");
     setSimulationSocket(socket);
     
     socket.on("simulation_update", (state) => {
         setDrivers(state.drivers);
         // Simulate matching mechanism check internally for now
         if(matchedDriverId) {
             const md = state.drivers[matchedDriverId];
             if(md && md.etaMins === 0 && md.distanceLeft === 0 && requestStatus === 'matched') {
                 // Might have arrived
             }
         }
     });

     return () => socket.disconnect();
  }, [matchedDriverId, requestStatus]);

  const handleRequestRide = async (e) => {
    e.preventDefault();
    setRequestStatus('searching');
    
    const pLoc = getLocationByName(pickup);
    const dLoc = getLocationByName(drop);
    
    // Call node backend
    try {
        const res = await fetch("http://localhost:5000/api/rides/request", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                name: "You",
                pickup_x: pLoc.lat,
                pickup_y: pLoc.lng,
                drop_x: dLoc.lat,
                drop_y: dLoc.lng
            })
        });
        const data = await res.json();
        
        // Wait briefly for UI spinner
        setTimeout(() => {
            setRequestStatus('matched');
            setMatchedDriverId(data.driverId);
            setCurrentRequestId(data.request.id);
        }, 3000);
        
    } catch(err) {
        console.error("Match failed", err);
        setRequestStatus('idle');
    }
  };

  const handleCancelRide = async () => {
       if (matchedDriverId && currentRequestId) {
           try {
              await fetch("http://localhost:5000/api/rides/cancel", {
                  method: "POST",
                  headers: {"Content-Type": "application/json"},
                  body: JSON.stringify({
                      driverId: matchedDriverId,
                      passengerId: currentRequestId
                  })
              });
           } catch(e) {
               console.error("Failed to cleanly cancel with backend", e);
           }
       }
       setRequestStatus('idle');
       setMatchedDriverId(null);
       setCurrentRequestId(null);
  };

  const getMapBounds = () => {
      if(matchedDriverId && drivers[matchedDriverId]) {
          const d = drivers[matchedDriverId];
          return [
             d.location, 
             [getLocationByName(pickup).lat, getLocationByName(pickup).lng],
             [getLocationByName(drop).lat, getLocationByName(drop).lng]
          ];
      }
      return [[LOCATIONS[0].lat, LOCATIONS[0].lng], [LOCATIONS[1].lat, LOCATIONS[1].lng]];
  };

  const matchedDriver = matchedDriverId ? drivers[matchedDriverId] : null;

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div>
          <h2>Book a Ride</h2>
          <p style={{color: 'var(--text-light)', marginTop: '4px'}}>Where to?</p>
        </div>

        {requestStatus === 'idle' && (
          <form onSubmit={handleRequestRide} className="flex flex-col gap-4 mt-4">
            <div className="flex flex-col gap-2">
              <label style={{fontSize: '14px', fontWeight: 'bold'}}>Pickup Location</label>
              <div className="flex items-center gap-2" style={{position: 'relative'}}>
                <MapPin size={18} style={{position: 'absolute', left: '12px', color: 'var(--text-light)'}}/>
                <select value={pickup} onChange={e => setPickup(e.target.value)} className="input-field" style={{paddingLeft: '40px'}}>
                   {LOCATIONS.map(loc => <option key={loc.name} value={loc.name}>{loc.name}</option>)}
                </select>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <label style={{fontSize: '14px', fontWeight: 'bold'}}>Drop Location</label>
              <div className="flex items-center gap-2" style={{position: 'relative'}}>
                <Navigation size={18} style={{position: 'absolute', left: '12px', color: 'var(--text-light)'}}/>
                <select value={drop} onChange={e => setDrop(e.target.value)} className="input-field" style={{paddingLeft: '40px'}}>
                   {LOCATIONS.map(loc => <option key={loc.name} value={loc.name}>{loc.name}</option>)}
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary mt-4 w-full" style={{height: '50px', fontSize: '18px'}}>
               <Search size={20} style={{marginRight: '8px'}}/> Find Ride
            </button>
          </form>
        )}

        {requestStatus === 'searching' && (
          <div className="card mt-4 flex flex-col items-center gap-4 text-center">
             <div className="loader" style={{width: '40px', height: '40px', border: '4px solid var(--border-color)', borderTop: '4px solid var(--primary-color)', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
             <h3>Searching for drivers...</h3>
             <p style={{color: 'var(--text-light)'}}>Matching you with the nearest dynamically pooled car.</p>
          </div>
        )}

        {requestStatus === 'matched' && matchedDriver && (
          <div className="card mt-4" style={{borderTop: '4px solid var(--success)'}}>
             <h3 style={{color: 'var(--success)'}}>Ride Confirmed!</h3>
             <p className="mt-2 text-sm">Your driver is on the way.</p>
             <div className="mt-4 p-4" style={{backgroundColor: 'var(--secondary-color)', borderRadius: '8px'}}>
                <p><strong>Car:</strong> {matchedDriver.name}</p>
                <p><strong>Total ETA:</strong> {matchedDriver.etaMins} mins</p>
                <p><strong>Distance to cover:</strong> {matchedDriver.distanceLeft} km</p>
             </div>
             
             <div className="mt-4 pt-4 border-t" style={{borderColor: 'var(--border-color)'}}>
                 <h4 className="flex gap-2 items-center mb-2"><User size={16}/> Co-Passengers</h4>
                 {Object.values(matchedDriver.passengersMap).filter(p => p.name !== 'You').length === 0 ? (
                     <p className="text-sm text-gray-500">None currently.</p>
                 ) : (
                     <div className="flex flex-col gap-2">
                       {Object.values(matchedDriver.passengersMap).filter(p => p.name !== 'You').map(p => (
                          <div key={p.id} className="text-sm bg-gray-100 p-2 rounded">
                              {p.name}
                          </div>
                       ))}
                     </div>
                 )}
             </div>

             <button onClick={handleCancelRide} className="btn btn-secondary mt-4 w-full border-red-500 text-red-500">Cancel Ride</button>
          </div>
        )}
      </aside>

      <main className="map-container">
         <Map 
            drivers={drivers} 
            activeDriverId={matchedDriverId} 
            boundsArray={getMapBounds()} 
            mapFocusKey={requestStatus + pickup + drop} 
         />
      </main>

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default CustomerDashboard;
