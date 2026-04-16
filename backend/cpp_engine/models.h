#ifndef MODELS_H
#define MODELS_H

#include <vector>
#include <string>
using namespace std;

struct Passenger {
    int id;
    double pickup_x, pickup_y;
    double drop_x, drop_y;
    bool is_picked_up;
    bool is_dropped_off;
    
    Passenger() : is_picked_up(false), is_dropped_off(false) {}
};

struct Point {
    double x, y;
    int pass_id;
    string type; // "DRIVER_START", "PICKUP", "DROP"
};

struct Ride {
    int driver_id;
    vector<int> passengers;
    double total_distance;
    vector<Point> route; // The chronologically ordered list of coordinates
};

#endif