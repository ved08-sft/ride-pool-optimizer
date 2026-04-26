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

struct Driver {
    int id;
    double x, y;
    int capacity;
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
    double total_time;
    vector<Point> route;
};

#endif