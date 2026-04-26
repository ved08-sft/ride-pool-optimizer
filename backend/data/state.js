// In-memory advanced simulation state

const state = {
    drivers: {
        'driver-1': {
            id: 'driver-1',
            name: 'Rajesh (White Swift)',
            location: [28.6300, 77.2100], // Near Connaught
            capacity: 4,
            activeRoute: [],
            totalDistance: 0,
            distanceLeft: 0,
            etaMins: 0,
            passengersMap: {}, // active riding passengers
            status: 'idle' // idle, busy
        },
        'driver-2': {
            id: 'driver-2',
            name: 'Amit (Silver Innova)',
            location: [28.5500, 77.2000], // Near Hauz Khas
            capacity: 6,
            activeRoute: [],
            totalDistance: 0,
            distanceLeft: 0,
            etaMins: 0,
            passengersMap: {},
            status: 'idle'
        }
    },
    requests: {}, // passenger requests: { id, pickup_x, ... status }
    groups: {}    // proposed groupings: { id, passengers: [], responses: { passId: true/false }, driverOptions: [] }
};

module.exports = state;
