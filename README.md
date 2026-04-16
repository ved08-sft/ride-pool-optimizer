
# Ride Pooling Optimizer

This is a full-stack ride pooling system I built to apply **DAA concepts in a real-world scenario**.
It simulates how apps like BlaBlaCar or Rapido match riders and optimize routes.

---

## 💡 What it does

* Takes multiple ride requests
* Uses a **C++ optimization engine** to compute the best route
* Shows everything visually on a **map (Leaflet)**
* Simulates the ride with a moving driver

---

## ⚙️ Tech Stack

* **Frontend:** React + Leaflet
* **Backend:** Node.js + Express
* **Core Logic:** C++ (DAA algorithms)
* **Auth:** JWT

---

## 🔧 Features

* Login/signup (basic JWT auth)
* Driver + Customer roles
* Ride optimization using C++
* Node ↔ C++ integration
* Map-based visualization
* Driver movement simulation
* Passenger pickup flow

---

## 🧪 How it works (flow)

1. User sends ride requests
2. Backend passes data to C++ engine
3. Algorithm computes optimal route
4. Result is sent back to frontend
5. Driver movement is simulated on map

---

## 📁 Structure

frontend/   → React UI  
backend/    → API + C++ integration  
cpp_engine/ → DAA logic  

## 🚀 Why I built this

I wanted to go beyond basic DAA problems and actually **see algorithms working in a real system**, not just on paper.

---

## 🔮 Future improvements

* Real-time updates (WebSockets)
* Better UI (dashboard-style)
* Database integration
* Multiple drivers

---


