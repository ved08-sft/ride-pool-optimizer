import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const createIcon = (color, svgPath) => new L.Icon({
  iconUrl: `data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(color)}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E${svgPath}%3C/svg%3E`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const carIcon = createIcon("#00AFF5", "%3Cpath d='M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a2 2 0 0 0-1.6-.8H9.3a2 2 0 0 0-1.6.8L5 11l-5.16.86a1 1 0 0 0-.84.99V16h3m10 0a2 2 0 1 1-4 0m4 0a2 2 0 1 0-4 0m-10 0a2 2 0 1 1-4 0m4 0a2 2 0 1 0-4 0'/%3E");
const silverCarIcon = createIcon("#9CA3AF", "%3Cpath d='M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a2 2 0 0 0-1.6-.8H9.3a2 2 0 0 0-1.6.8L5 11l-5.16.86a1 1 0 0 0-.84.99V16h3m10 0a2 2 0 1 1-4 0m4 0a2 2 0 1 0-4 0m-10 0a2 2 0 1 1-4 0m4 0a2 2 0 1 0-4 0'/%3E");

const audiIcon = new L.Icon({
  iconUrl: '/audi_a6_3d.png',
  iconSize: [64, 64],
  iconAnchor: [32, 64],
  popupAnchor: [0, -64],
  className: 'audi-marker'
});

const pickupIcon = new L.Icon({
  iconUrl: '/pickup_pin_3d.png',
  iconSize: [48, 48],
  iconAnchor: [24, 48],
  popupAnchor: [0, -48],
  className: 'pickup-marker'
});

const dropoffIcon = new L.Icon({
  iconUrl: '/dropoff_pin_3d.png',
  iconSize: [48, 48],
  iconAnchor: [24, 48],
  popupAnchor: [0, -48],
  className: 'dropoff-marker'
});

const MapBounds = ({ boundsArray, mapFocusKey }) => {
  const map = useMap();
  useEffect(() => {
    if (boundsArray && boundsArray.length > 0) {
      const bounds = L.latLngBounds(boundsArray);
      map.fitBounds(bounds, { padding: [120, 120], maxZoom: 14 });
    }
    // Exclude boundsArray so it only triggers on key change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapFocusKey, map]);
  return null;
};

const Map = ({ drivers = {}, activeDriverId = null, boundsArray = [], mapFocusKey = "default" }) => {
  return (
    <MapContainer
      center={[28.61, 77.23]}
      zoom={12}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapBounds boundsArray={boundsArray} mapFocusKey={mapFocusKey} />

      {Object.values(drivers).map((d) => {
        const isFocus = activeDriverId === d.id;
        // Build route path from active location -> waypoints
        const routePath = d.activeRoute && d.activeRoute.length > 0 
           ? [d.location, ...d.activeRoute.map(pt => [pt.x, pt.y])]
           : [];
           
        return (
          <div key={d.id}>
             {/* Draw route if active driver or if driver has a route */}
             {routePath.length > 1 && (
               <Polyline positions={routePath} color={isFocus ? "var(--primary-color)" : "#9CA3AF"} weight={isFocus ? 5 : 3} opacity={0.7} />
             )}
             
             <Marker position={d.location} icon={isFocus ? audiIcon : silverCarIcon} zIndexOffset={isFocus ? 1000 : 0}>
               <Popup>
                 <strong>{d.name}</strong><br/>
                 ETA: {d.etaMins} mins<br/>
                 Distance: {d.distanceLeft} km
               </Popup>
             </Marker>

             {/* Draw passengers for this driver */}
             {Object.values(d.passengersMap).map(p => (
                 <div key={p.id}>
                   {!p.is_picked_up && (
                     <Marker position={[p.pickup_x, p.pickup_y]} icon={pickupIcon}>
                        <Popup>Pickup: {p.name}</Popup>
                     </Marker>
                   )}
                   <Marker position={[p.drop_x, p.drop_y]} icon={dropoffIcon}>
                      <Popup>Drop: {p.name}</Popup>
                   </Marker>
                 </div>
             ))}
          </div>
        )
      })}
    </MapContainer>
  );
};

export default Map;