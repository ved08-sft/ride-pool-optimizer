#include <iostream>
#include <vector>
#include <fstream>
#include "models.h"
#include <algorithm>

using namespace std;

bool isValidGroup(const vector<Passenger>& group);
Ride calculateOptimalRoute(Driver d, vector<Passenger> group);

// Recursive function to get all subsets up to size K
void getSubsets(vector<Passenger>& passengers, int k, int start, vector<Passenger>& current, vector<vector<Passenger>>& all_groups) {
    if (current.size() > 0) {
        if (isValidGroup(current)) {
            all_groups.push_back(current);
        }
    }
    if (current.size() == k) return;

    for (size_t i = start; i < passengers.size(); i++) {
        current.push_back(passengers[i]);
        getSubsets(passengers, k, i + 1, current, all_groups);
        current.pop_back();
    }
}

int main(int argc, char* argv[]) {
    string input_file = "input.txt";
    string output_file = "output.txt";

    if (argc > 1) input_file = argv[1];
    if (argc > 2) output_file = argv[2];

    ifstream input(input_file);
    ofstream output(output_file);

    if (!input.is_open()) {
        cout << "Could not open " << input_file << endl;
        return 1;
    }

    int num_drivers;
    input >> num_drivers;
    vector<Driver> drivers(num_drivers);
    int max_cap = 1;
    for (int i = 0; i < num_drivers; i++) {
        input >> drivers[i].id >> drivers[i].x >> drivers[i].y >> drivers[i].capacity;
        if (drivers[i].capacity > max_cap) max_cap = drivers[i].capacity;
    }

    int num_passengers;
    input >> num_passengers;
    vector<Passenger> passengers(num_passengers);
    for (int i = 0; i < num_passengers; i++) {
        input >> passengers[i].id >> passengers[i].pickup_x >> passengers[i].pickup_y >> passengers[i].drop_x >> passengers[i].drop_y;
    }
    input.close();

    // Max allowed group size logic bounds
    int search_k = min(4, max_cap); 
    vector<vector<Passenger>> valid_groups;
    vector<Passenger> current;
    getSubsets(passengers, search_k, 0, current, valid_groups);

    // Evaluate valid groups for all drivers
    output << "[\n";
    bool first = true;

    for (const auto& driver : drivers) {
        for (const auto& group : valid_groups) {
            if (group.size() <= driver.capacity) {
                Ride r = calculateOptimalRoute(driver, group);
                
                // Only output viable rides: <= 50km cost, <= 120 min total_time
                if (r.total_distance <= 50.0 && r.total_time <= 120.0) {
                    if (!first) output << ",\n";
                    first = false;

                    output << "  {\n";
                    output << "    \"driver_id\": " << r.driver_id << ",\n";
                    output << "    \"total_distance\": " << r.total_distance << ",\n";
                    output << "    \"total_time\": " << r.total_time << ",\n";
                    
                    output << "    \"passengers\": [";
                    for(size_t i=0; i<r.passengers.size(); i++){
                        output << r.passengers[i] << (i+1==r.passengers.size()?"":", ");
                    }
                    output << "],\n";

                    output << "    \"route\": [\n";
                    for(size_t i=0; i<r.route.size(); i++){
                        output << "      {\"type\": \"" << r.route[i].type << "\", \"pass_id\": " << r.route[i].pass_id 
                               << ", \"x\": " << r.route[i].x << ", \"y\": " << r.route[i].y << "}" << (i+1==r.route.size()?"":",") << "\n";
                    }
                    output << "    ]\n";
                    output << "  }";
                }
            }
        }
    }
    output << "\n]\n";
    output.close();

    return 0;
}