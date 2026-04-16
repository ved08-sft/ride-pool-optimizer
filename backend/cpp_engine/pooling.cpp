#include <cmath>
#include "models.h"
#include <vector>
#include <limits>
#include <algorithm>

double calculateDistance(double x1, double y1, double x2, double y2) {
    // using Euclidean distance scaled roughly to km for visualization coordinates
    return sqrt(pow(x1 - x2, 2) + pow(y1 - y2, 2)) * 111.0; 
}

Ride createRide(double start_x, double start_y, vector<Passenger>& passengers) {
    Ride ride;
    double current_x = start_x;
    double current_y = start_y;
    double total_distance = 0.0;
    
    ride.route.push_back({start_x, start_y, 0, "DRIVER_START"});

    // Very simple Greedy TSP with Pickup and Delivery
    int completed = 0;
    int n = passengers.size();
    
    while (completed < n) {
        double min_dist = std::numeric_limits<double>::max();
        int next_idx = -1;
        string next_type = "";
        
        for (int i = 0; i < n; i++) {
            if (!passengers[i].is_picked_up) {
                double d = calculateDistance(current_x, current_y, passengers[i].pickup_x, passengers[i].pickup_y);
                if (d < min_dist) {
                    min_dist = d;
                    next_idx = i;
                    next_type = "PICKUP";
                }
            } else if (passengers[i].is_picked_up && !passengers[i].is_dropped_off) {
                double d = calculateDistance(current_x, current_y, passengers[i].drop_x, passengers[i].drop_y);
                if (d < min_dist) {
                    min_dist = d;
                    next_idx = i;
                    next_type = "DROP";
                }
            }
        }
        
        if (next_idx != -1) {
            total_distance += min_dist;
            if (next_type == "PICKUP") {
                passengers[next_idx].is_picked_up = true;
                current_x = passengers[next_idx].pickup_x;
                current_y = passengers[next_idx].pickup_y;
                ride.route.push_back({current_x, current_y, passengers[next_idx].id, "PICKUP"});
            } else {
                passengers[next_idx].is_dropped_off = true;
                current_x = passengers[next_idx].drop_x;
                current_y = passengers[next_idx].drop_y;
                ride.route.push_back({current_x, current_y, passengers[next_idx].id, "DROP"});
                completed++;
            }
        }
    }

    ride.total_distance = total_distance;
    
    for (auto &p : passengers) {
        ride.passengers.push_back(p.id);
    }

    return ride;
}