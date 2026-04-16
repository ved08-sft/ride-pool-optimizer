// In-memory advanced simulation state

const state = {
    drivers: {
        'driver-1': {
            id: 'driver-1',
            name: 'Rajesh (White Swift)',
            location: [28.6300, 77.2100], // Near Connaught
            capacity: 4,
            activeRoute: [],
            routeWaypoints: [], // The actual remaining destination coords
            totalDistance: 0,
            distanceLeft: 0,
            etaMins: 0,
            passengersMap: {} // active riding passengers
        },
        'driver-2': {
            id: 'driver-2',
            name: 'Amit (Silver Innova)',
            location: [28.5500, 77.2000], // Near Hauz Khas
            capacity: 6,
            activeRoute: [],
            routeWaypoints: [],
            totalDistance: 0,
            distanceLeft: 0,
            etaMins: 0,
            passengersMap: {} 
        },
        'driver-3': {
            id: 'driver-3',
            name: 'Sunil (Blue WagonR)',
            location: [28.6100, 77.2300], // Near India gate
            capacity: 3,
            activeRoute: [],
            routeWaypoints: [],
            totalDistance: 0,
            distanceLeft: 0,
            etaMins: 0,
            passengersMap: {} 
        }
    },
    pendingRequests: []
};

module.exports = state;
