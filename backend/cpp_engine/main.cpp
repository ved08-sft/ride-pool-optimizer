#include <iostream>
#include <vector>
#include <fstream>
#include "models.h"

using namespace std;

Ride createRide(double start_x, double start_y, vector<Passenger>& passengers);

int main() {
    ifstream input("input.txt");
    ofstream output("output.txt");

    if (!input.is_open()) {
        cout << "Could not open input.txt" << endl;
        return 1;
    }

    double driver_x, driver_y;
    int capacity;
    int n;

    input >> driver_x >> driver_y;
    input >> capacity;
    input >> n;

    vector<Passenger> passengers;

    for (int i = 0; i < n; i++) {
        Passenger p;
        input >> p.id >> p.pickup_x >> p.pickup_y >> p.drop_x >> p.drop_y;
        passengers.push_back(p);
    }

    Ride ride = createRide(driver_x, driver_y, passengers);
    ride.driver_id = 999; // Placeholder driver id

    output << "Driver: " << ride.driver_id << "\n";
    output << "Total_Distance: " << ride.total_distance << "\n";
    
    output << "Route_Size: " << ride.route.size() << "\n";
    for (auto &pt : ride.route) {
        output << pt.type << " " << pt.pass_id << " " << pt.x << " " << pt.y << "\n";
    }

    input.close();
    output.close();

    return 0;
}