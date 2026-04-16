export const LOCATIONS = [
  { name: "Connaught Place", lat: 28.6315, lng: 77.2167 },
  { name: "India Gate", lat: 28.6129, lng: 77.2295 },
  { name: "Qutub Minar", lat: 28.5245, lng: 77.1855 },
  { name: "Hauz Khas", lat: 28.5494, lng: 77.2001 },
  { name: "Red Fort", lat: 28.6562, lng: 77.2410 },
  { name: "Lotus Temple", lat: 28.5535, lng: 77.2588 },
  { name: "Aerocity", lat: 28.5490, lng: 77.1211 }
];

export const getLocationByName = (name) => {
  return LOCATIONS.find(loc => loc.name === name);
};
