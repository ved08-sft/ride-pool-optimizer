const fetchRouteGeometry = async (routeLegs) => {
    let fullRoute = [];
    
    for (let i = 0; i < routeLegs.length - 1; i++) {
        const start = routeLegs[i];
        const end = routeLegs[i+1];
        
        try {
             // OSRM accepts coordinates as lon,lat
             const url = `http://router.project-osrm.org/route/v1/driving/${start.y},${start.x};${end.y},${end.x}?overview=full&geometries=geojson`;
             const res = await fetch(url);
             const data = await res.json();
             
             if (data.routes && data.routes.length > 0) {
                 const coords = data.routes[0].geometry.coordinates; // [[lon,lat], ...]
                 
                 // Push the intermediate waypoints 
                 // We skip 0 and length-1 because they represent `start` and `end` precisely.
                 for (let j = 1; j < coords.length - 1; j++) {
                     // Convert lon,lat back to x,y mapping (lat,lng)
                     fullRoute.push({ type: 'WAYPOINT', pass_id: 0, x: coords[j][1], y: coords[j][0] });
                 }
             }
        } catch(e) {
             console.error("OSRM Fetch Error:", e);
        }
        
        // At the end of the dense geometry segment, push the explicit backend functional target (PICKUP/DROP)
        fullRoute.push(end);
    }
    
    return fullRoute;
};

module.exports = { fetchRouteGeometry };
