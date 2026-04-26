#include <cmath>
#include "models.h"
#include <vector>
#include <limits>
#include <algorithm>
#include <iostream>

double calculateDistance(double x1, double y1, double x2, double y2) {
    // using Euclidean distance scaled roughly to km for visualization coordinates
    return sqrt(pow(x1 - x2, 2) + pow(y1 - y2, 2)) * 111.0; 
}

bool isValidGroup(const vector<Passenger>& group) {
    if (group.size() <= 1) return true;
    double max_drop_dist = 0.0;
    double max_pick_dist = 0.0;

    for (size_t i = 0; i < group.size(); i++) {
        for (size_t j = i + 1; j < group.size(); j++) {
            double d_drop = calculateDistance(group[i].drop_x, group[i].drop_y, group[j].drop_x, group[j].drop_y);
            double d_pick = calculateDistance(group[i].pickup_x, group[i].pickup_y, group[j].pickup_x, group[j].pickup_y);
            if (d_drop > max_drop_dist) max_drop_dist = d_drop;
            if (d_pick > max_pick_dist) max_pick_dist = d_pick;
        }
    }

    if (max_drop_dist <= 0.5) return max_pick_dist <= 5.0;
    if (max_drop_dist <= 1.0) return max_pick_dist <= 4.0;
    if (max_drop_dist <= 1.5) return max_pick_dist <= 3.0;
    if (max_drop_dist <= 2.0) return max_pick_dist <= 2.0;

    return false; // drop distance > 2km is invalid
}

void solveTSPRec(int n, vector<Passenger>& pass, double current_x, double current_y, 
                int mask_picked, int mask_dropped, double current_dist, 
                vector<Point>& current_route,
                double& min_total_dist, vector<Point>& best_route) {
    
    // Base case: all dropped off
    if (mask_dropped == (1 << n) - 1) {
        if (current_dist < min_total_dist) {
            min_total_dist = current_dist;
            best_route = current_route;
        }
        return;
    }

    // Prune
    if (current_dist >= min_total_dist) return;

    for (int i = 0; i < n; i++) {
        // Option 1: Pickup passenger i if not picked up yet
        if (!(mask_picked & (1 << i))) {
            double dist = calculateDistance(current_x, current_y, pass[i].pickup_x, pass[i].pickup_y);
            current_route.push_back({pass[i].pickup_x, pass[i].pickup_y, pass[i].id, "PICKUP"});
            solveTSPRec(n, pass, pass[i].pickup_x, pass[i].pickup_y, 
                        mask_picked | (1 << i), mask_dropped, current_dist + dist, 
                        current_route, min_total_dist, best_route);
            current_route.pop_back();
        }

        // Option 2: Dropoff passenger i if picked up but not dropped off
        if ((mask_picked & (1 << i)) && !(mask_dropped & (1 << i))) {
            double dist = calculateDistance(current_x, current_y, pass[i].drop_x, pass[i].drop_y);
            current_route.push_back({pass[i].drop_x, pass[i].drop_y, pass[i].id, "DROP"});
            solveTSPRec(n, pass, pass[i].drop_x, pass[i].drop_y, 
                        mask_picked, mask_dropped | (1 << i), current_dist + dist, 
                        current_route, min_total_dist, best_route);
            current_route.pop_back();
        }
    }
}

Ride calculateOptimalRoute(Driver d, vector<Passenger> group) {
    Ride ride;
    ride.driver_id = d.id;
    for (auto& p : group) {
        ride.passengers.push_back(p.id);
    }

    double min_total_dist = std::numeric_limits<double>::max();
    vector<Point> best_route;
    vector<Point> current_route;
    
    current_route.push_back({d.x, d.y, 0, "DRIVER_START"});

    solveTSPRec(group.size(), group, d.x, d.y, 0, 0, 0.0, current_route, min_total_dist, best_route);

    ride.total_distance = min_total_dist;
    // user requested average speed is at least 70 km/h -> ~1.16 km/min.
    ride.total_time = (min_total_dist / 70.0) * 60.0; 
    ride.route = best_route;

    return ride;
}